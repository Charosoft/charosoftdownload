import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { LimitExceededError, durationMessage, type Plan } from "../config/limits.js";
import { mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export interface DownloadOptions {
  url: string;
  title: string;
  type: "video" | "audio";
  extension: string;
  quality: string;
  formatId: string;
  hasAudio: boolean;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
  plan: Plan;
  maxBytes: number | null;
  maxDuration: number | null;
}

const TEMP_DIR = process.env.TEMP_DOWNLOAD_DIR || "./downloads";
const YTDLP_PYTHON = process.env.YTDLP_PYTHON || "python3";
const YTDLP_BIN = process.env.YTDLP_BIN || "/usr/local/bin/yt-dlp";

function sanitizeFileName(name: string): string {
  return name
    .normalize("NFKC")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "")
    .slice(0, 180);
}

function buildDownloadFileName(title: string, extension: string): string {
  const cleanTitle = sanitizeFileName(title) || "media";
  return `CharosoftDownload - ${cleanTitle}.${extension}`;
}

function runYtDlp(
  args: string[],
  outputTemplate: string,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      YTDLP_PYTHON,
      [
        YTDLP_BIN,
        "--js-runtimes",
        "deno",
        ...args,
        "--newline",
        "--progress",
        "-o",
        outputTemplate,
        "--print",
        "after_move:filepath",
      ],
      // Le signal arrête yt-dlp dès que l'annulation est demandée.
      { stdio: ["ignore", "pipe", "pipe"], signal }
    );

    let stdout = "";
    let stderr = "";
    let lastProgress = 0;

    function readProgress(output: string) {
      for (const line of output.split(/\r?\n/)) {
        const match = line.match(/\[download\]\s+(\d+(?:\.\d+)?)%/);
        if (!match) continue;

        const mapped = Math.min(90, Math.floor(Number(match[1]) * 0.9));

        if (mapped > lastProgress) {
          lastProgress = mapped;
          onProgress?.(mapped);
        }
      }
    }

    child.stdout.on("data", (chunk: Buffer | string) => {
      const text = chunk.toString();
      stdout += text;
      if (stdout.length > 200_000) stdout = stdout.slice(-100_000);
      readProgress(text);
    });

    child.stderr.on("data", (chunk: Buffer | string) => {
      const text = chunk.toString();
      stderr += text;
      if (stderr.length > 200_000) stderr = stderr.slice(-100_000);
      readProgress(text);
    });

    child.on("error", (error) => {
      reject(new Error(`Impossible de lancer yt-dlp : ${error.message}`));
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(stderr.trim() || `yt-dlp a terminé avec le code ${code}`)
        );
        return;
      }

      onProgress?.(92);

      const lines = stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      // Format réellement téléchargé (pour vérifier ce que yt-dlp a choisi).
      console.log(lines.filter((l) => l.startsWith("FORMAT_CHOISI")).join(" | "));

      const finalPath = lines[lines.length - 1];

      if (!finalPath || finalPath.startsWith("FORMAT_CHOISI")) {
        reject(new Error(`NO_OUTPUT\n${(stdout + "\n" + stderr).slice(-2000)}`));
        return;
      }

      resolve(finalPath);
    });
  });
}

function normalizeExtension(extension: string): "mp4" | "mp3" | "m4a" | "webm" {
  const normalized = extension.toLowerCase();

  if (
    normalized === "mp4" ||
    normalized === "mp3" ||
    normalized === "m4a" ||
    normalized === "webm"
  ) {
    return normalized;
  }

  throw new Error(`Format ${extension} non pris en charge.`);
}

function buildFormatSelector(options: DownloadOptions): string {
  const formatId = options.formatId.trim();

  // Le formatId est inséré dans le sélecteur yt-dlp : on n'accepte que
  // les caractères d'un identifiant de format réel.
  if (!/^[A-Za-z0-9._-]+$/.test(formatId)) {
    throw new Error("Identifiant de format invalide.");
  }

  if (options.type === "audio") {
    // Le format choisi d'abord, sinon le meilleur audio disponible.
    return `${formatId}/bestaudio[protocol=https]/bestaudio`;
  }

  // Hauteur demandée, par exemple « 720p » → 720.
  const height = Number.parseInt(options.quality, 10);
  const limit =
    Number.isFinite(height) && height > 0 ? `[height<=${height}]` : "";

  // Pour le MP4, le repli reste en H.264 (vrai MP4) au lieu de VP9.
  const isMp4 = options.extension.toLowerCase() === "mp4";
  const codec = isMp4 ? "[vcodec^=avc1]" : "";
  const audio = isMp4 ? "bestaudio[ext=m4a]" : "bestaudio";

  if (options.hasAudio) {
    return `${formatId}/best${limit}${isMp4 ? "[ext=mp4]" : ""}/best${limit}`;
  }

  // Vidéo sans son : on lui associe la meilleure piste audio.
  return [
    `${formatId}+${audio}`,
    `${formatId}+bestaudio`,
    `bestvideo${limit}${codec}+${audio}`,
    `best${limit}`,
  ].join("/");
}

/** Supprime tous les fichiers (même partiels) d'un téléchargement. */
async function removeJobFiles(jobId: string) {
  try {
    const prefix = `charosoft-${jobId}`;

    for (const file of await readdir(TEMP_DIR)) {
      if (file.startsWith(prefix)) {
        await rm(path.resolve(TEMP_DIR, file), { force: true });
      }
    }
  } catch {
    // Nettoyage silencieux
  }
}

export async function downloadMedia(
  options: DownloadOptions
): Promise<{ filePath: string; fileName: string }> {
  const extension = normalizeExtension(options.extension);

  await mkdir(TEMP_DIR, { recursive: true });

  const jobId = crypto.randomUUID();

  const temporaryTemplate = path.resolve(
    TEMP_DIR,
    `charosoft-${jobId}.%(ext)s`
  );

  const selector = buildFormatSelector(options);

  const args = [
    "--no-warnings",
    "--no-playlist",
    "--restrict-filenames",
    "-f",
    selector,
    "--print",
    "before_dl:FORMAT_CHOISI %(format_id)s %(resolution)s %(vcodec)s",
  ];

  if (options.type === "audio") {
    args.push("-x", "--audio-format", extension);
  }

  if (options.type === "video") {
    args.push("--merge-output-format", extension);
  }

  if (options.maxBytes) {
    args.push("--max-filesize", `${Math.floor(options.maxBytes / 1024)}k`);
  }

  if (options.maxDuration) {
    args.push("--match-filter", `!is_live & duration<=?${options.maxDuration}`);
  }

  let finalPath: string;

  try {
    finalPath = await runYtDlp(
      [...args, options.url],
      temporaryTemplate,
      options.onProgress,
      options.signal
    );
  } catch (error) {
    // Annulation demandée par la personne : on nettoie et on s'arrête.
    if (options.signal?.aborted) {
      await removeJobFiles(jobId);
      throw new Error("CANCELLED");
    }

    if (error instanceof Error && error.message.startsWith("NO_OUTPUT")) {
      // On affiche la vraie sortie de yt-dlp pour comprendre la cause.
      console.error("yt-dlp sans fichier :", error.message);

      if (/does not pass filter/i.test(error.message)) {
        throw new LimitExceededError(options.plan, durationMessage());
      }

      if (/larger than|max-filesize/i.test(error.message)) {
        throw new LimitExceededError(options.plan);
      }

      throw new Error("Le média n'a pas pu être téléchargé.");
    }
    throw error;
  }

  // Annulé juste au moment où yt-dlp se terminait.
  if (options.signal?.aborted) {
    await removeJobFiles(jobId);
    throw new Error("CANCELLED");
  }

  if (!existsSync(finalPath)) {
    throw new Error("Le fichier téléchargé n'a pas été généré.");
  }

  if (options.maxBytes) {
    const { size } = await stat(finalPath);
    if (size > options.maxBytes) {
      await cleanupFile(finalPath);
      throw new LimitExceededError(options.plan);
    }
  }

  options.onProgress?.(94);

  const fileName = buildDownloadFileName(options.title, extension);

  return { filePath: finalPath, fileName };
}

export async function cleanupFile(filePath: string) {
  try {
    await rm(filePath, { force: true });
  } catch {
    // Nettoyage silencieux
  }
}

export async function cleanupOldFiles() {
  try {
    await mkdir(TEMP_DIR, { recursive: true });

    const files = await readdir(TEMP_DIR);
    const now = Date.now();
    const maxAge = 60 * 60 * 1000;

    for (const file of files) {
      if (!file.startsWith("charosoft-")) continue;

      const filePath = path.resolve(TEMP_DIR, file);

      try {
        const stats = await stat(filePath);
        if (now - stats.mtimeMs > maxAge) {
          await rm(filePath, { force: true });
        }
      } catch {
        // Le fichier peut avoir été supprimé entre-temps.
      }
    }
  } catch {
    // Nettoyage silencieux.
  }
}