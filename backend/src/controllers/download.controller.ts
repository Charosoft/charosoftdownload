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
  abort: AbortController;
  orphanTimer?: ReturnType<typeof setTimeout>;
}

const jobs = new Map<string, Job>();
const MAX_RUNNING = Number(process.env.MAX_CONCURRENT_JOBS) || 3;
const JOB_TTL = 60 * 60 * 1000; // un fichier prêt non récupéré expire après 1 h
const MAX_RUN = 45 * 60 * 1000; // durée maximale d'une préparation
const ORPHAN_DELAY = 2 * 60 * 1000; // sans personne pour suivre le téléchargement

// Ménage chaque minute :
// - une préparation trop longue est arrêtée ;
// - un fichier non récupéré expire après 1 h.
setInterval(() => {
  const now = Date.now();

  for (const [id, job] of jobs) {
    if (job.status === "running") {
      if (now - job.createdAt > MAX_RUN) job.abort.abort();
    } else if (now - job.createdAt > JOB_TTL) {
      if (job.filePath) void cleanupFile(job.filePath);
      jobs.delete(id);
    }
  }
}, 60 * 1000).unref();

/**
 * Si plus personne ne suit ce téléchargement au bout de ORPHAN_DELAY
 * (onglet fermé, page jamais rechargée), on l'arrête pour libérer la place.
 */
function scheduleOrphanCheck(job: Job) {
  if (job.orphanTimer) clearTimeout(job.orphanTimer);

  job.orphanTimer = setTimeout(() => {
    if (job.status === "running" && job.listeners.size === 0) {
      job.abort.abort();
    }
  }, ORPHAN_DELAY);
}

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
    if (job.orphanTimer) clearTimeout(job.orphanTimer);
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
      signal: job.abort.signal,
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
    job.status = "error";

    if (error instanceof Error && error.message === "CANCELLED") {
      job.error = "Téléchargement annulé.";
    } else {
      console.error("❌ Erreur téléchargement :", error);
      job.error =
        error instanceof LimitExceededError
          ? error.message
          : describeMediaError(error, "Le téléchargement a échoué.").message;
    }
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
    abort: new AbortController(),
  };
  jobs.set(job.id, job);

  // Si personne ne se connecte au suivi, on arrête au bout de 2 minutes.
  scheduleOrphanCheck(job);

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

  // Quelqu'un suit de nouveau ce téléchargement : on annule l'arrêt prévu.
  if (job.orphanTimer) {
    clearTimeout(job.orphanTimer);
    job.orphanTimer = undefined;
  }

  const ping = setInterval(() => res.write(": ping\n\n"), 15000);

  req.on("close", () => {
    clearInterval(ping);
    job.listeners.delete(res);

    // Plus personne ne suit : sans retour sous 2 minutes, on arrête.
    if (job.status === "running" && job.listeners.size === 0) {
      scheduleOrphanCheck(job);
    }
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

/** POST /api/download/:jobId/cancel : arrête la préparation et nettoie. */
export function jobCancel(req: Request, res: Response) {
  const job = jobs.get(String(req.params.jobId));

  if (job) {
    if (job.orphanTimer) clearTimeout(job.orphanTimer);

    if (job.status === "running") {
      job.abort.abort();
    } else if (job.filePath) {
      void cleanupFile(job.filePath);
    }

    jobs.delete(job.id);
  }

  res.json({ ok: true });
}