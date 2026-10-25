import type { Request, Response } from "express";
import crypto from "node:crypto";
import { stat } from "node:fs/promises";
import { pool } from "../config/database.js";
import {
  LimitExceededError,
  MAX_DURATION,
  maxBytesFor,
  planOf,
} from "../config/limits.js";
import { assertPublicHttpUrl, UrlNotAllowedError } from "../utils/urlGuard.js";
import { describeMediaError } from "../utils/mediaErrors.js";
import { cleanupFile, downloadMedia } from "../services/download.service.js";

type JobStatus = "running" | "done" | "error";

interface Job {
  id: string;
  status: JobStatus;
  progress: number;
  filePath?: string;
  fileName?: string;
  size?: number;
  error?: string;
  createdAt: number;
  listeners: Set<Response>;
}

const jobs = new Map<string, Job>();
const MAX_RUNNING = Number(process.env.MAX_CONCURRENT_JOBS) || 3;
const JOB_TTL = 60 * 60 * 1000;

// Ménage : les téléchargements non récupérés expirent après 1 h.
setInterval(() => {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (job.status !== "running" && now - job.createdAt > JOB_TTL) {
      if (job.filePath) void cleanupFile(job.filePath);
      jobs.delete(id);
    }
  }
}, 10 * 60 * 1000).unref();

function snapshot(job: Job) {
  return {
    status: job.status,
    progress: job.progress,
    fileName: job.fileName,
    size: job.size,
    error: job.error,
  };
}

function emit(job: Job) {
  const data = `data: ${JSON.stringify(snapshot(job))}\n\n`;
  for (const res of job.listeners) res.write(data);

  if (job.status !== "running") {
    for (const res of job.listeners) res.end();
    job.listeners.clear();
  }
}

interface JobInput {
  url: string;
  title: string;
  type: "video" | "audio";
  extension: string;
  quality: string;
  formatId: string;
  hasAudio: boolean;
}

async function runJob(
  job: Job,
  input: JobInput,
  authUser: { id: string } | null
) {
  const plan = planOf(authUser as { plan?: string } | null);

  try {
    const result = await downloadMedia({
      ...input,
      plan,
      maxBytes: maxBytesFor(plan),
      maxDuration: plan === "premium" ? null : MAX_DURATION,
      onProgress: (progress) => {
        if (progress > job.progress) {
          job.progress = progress;
          emit(job);
        }
      },
    });

    const { size } = await stat(result.filePath);

    job.filePath = result.filePath;
    job.fileName = result.fileName;
    job.size = size;
    job.progress = 100;
    job.status = "done";

    if (authUser) {
      pool
        .query(
          `INSERT INTO download_history
             (user_id, media_url, media_title, platform, format, status)
           VALUES ($1, $2, $3, $4, $5, 'completed')`,
          [
            authUser.id,
            input.url,
            input.title,
            new URL(input.url).hostname.replace(/^www\./, ""),
            input.extension,
          ]
        )
        .catch((e) => console.error("Historique :", e.message));
    }
  } catch (error) {
    console.error("❌ Erreur téléchargement :", error);
    job.status = "error";
    job.error =
      error instanceof LimitExceededError
        ? error.message
        : describeMediaError(error, "Le téléchargement a échoué.").message;
  }

  emit(job);
}

/** POST /api/download : lance la préparation et renvoie un jobId. */
export async function startDownload(req: Request, res: Response) {
  const body = req.body ?? {};

  if (
    typeof body.url !== "string" ||
    typeof body.formatId !== "string" ||
    typeof body.extension !== "string" ||
    (body.type !== "video" && body.type !== "audio")
  ) {
    return res.status(400).json({ success: false, message: "Requête invalide." });
  }

  try {
    await assertPublicHttpUrl(body.url);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof UrlNotAllowedError ? error.message : "URL invalide.",
    });
  }

  const running = [...jobs.values()].filter((j) => j.status === "running").length;
  if (running >= MAX_RUNNING) {
    return res.status(503).json({
      success: false,
      message: "Le serveur est occupé, réessaie dans un instant.",
    });
  }

  const job: Job = {
    id: crypto.randomUUID(),
    status: "running",
    progress: 0,
    createdAt: Date.now(),
    listeners: new Set(),
  };
  jobs.set(job.id, job);

  res.status(202).json({ success: true, jobId: job.id });

  void runJob(
    job,
    {
      url: body.url,
      title: typeof body.title === "string" ? body.title : "media",
      type: body.type,
      extension: body.extension,
      quality: typeof body.quality === "string" ? body.quality : "",
      formatId: body.formatId,
      hasAudio: Boolean(body.hasAudio),
    },
    res.locals.authUser ?? null
  );
}

/** GET /api/download/:jobId/events : progression en direct (SSE). */
export function jobEvents(req: Request, res: Response) {
  const job = jobs.get(String(req.params.jobId));

  if (!job) {
    return res
      .status(404)
      .json({ success: false, message: "Téléchargement introuvable ou expiré." });
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  res.write(`data: ${JSON.stringify(snapshot(job))}\n\n`);

  if (job.status !== "running") {
    res.end();
    return;
  }

  job.listeners.add(res);
  const ping = setInterval(() => res.write(": ping\n\n"), 15000);

  req.on("close", () => {
    clearInterval(ping);
    job.listeners.delete(res);
  });
}

/** GET /api/download/:jobId/file : le navigateur télécharge directement. */
export function jobFile(req: Request, res: Response) {
  const job = jobs.get(String(req.params.jobId));

  if (!job || job.status !== "done" || !job.filePath || !job.fileName) {
    return res
      .status(404)
      .json({ success: false, message: "Fichier introuvable ou expiré." });
  }

  const { filePath } = job;

  // Le fichier est supprimé une fois entièrement envoyé.
  res.on("finish", () => {
    if (res.statusCode === 200) {
      void cleanupFile(filePath);
      jobs.delete(job.id);
    }
  });

  res.download(filePath, job.fileName, (error) => {
    if (error && !res.headersSent) {
      res.status(500).json({ success: false, message: "Envoi du fichier impossible." });
    }
  });
}