import { spawn } from "node:child_process";
import { assertPublicHttpUrl } from "../utils/urlGuard.js";

export interface MediaFormat {
  formatId: string;
  format: string;
  quality: string;
  type: "video" | "audio";
  extension: string;
  hasAudio: boolean;
  filesize: number | null;
  filesizeApprox: number | null;
}

export interface MediaInfo {
  url: string;
  source: string;
  title: string;
  thumbnail: string | null;
  duration: number | null;
  formats: MediaFormat[];
}

interface YtDlpFormat {
  format_id?: string;
  ext?: string;
  width?: number;
  height?: number;
  tbr?: number;
  acodec?: string;
  vcodec?: string;
  url?: string;
  protocol?: string;
  filesize?: number;
  filesize_approx?: number;
}

interface YtDlpInfo {
  title?: string;
  thumbnail?: string;
  duration?: number;
  formats?: YtDlpFormat[];
}

const YTDLP_PYTHON = process.env.YTDLP_PYTHON || "python3";
const YTDLP_BIN = process.env.YTDLP_BIN || "/usr/local/bin/yt-dlp";

function runYtDlp(url: string): Promise<YtDlpInfo> {
  return new Promise((resolve, reject) => {
    const child = spawn(YTDLP_PYTHON, [
      YTDLP_BIN,
      "--js-runtimes",
      "deno",
      "--dump-single-json",
      "--no-warnings",
      "--skip-download",
      "--no-playlist",
      url,
    ]);

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(stderr.trim() || `yt-dlp a terminé avec le code ${code}`)
        );
        return;
      }

      try {
        resolve(JSON.parse(stdout) as YtDlpInfo);
      } catch {
        reject(new Error("Réponse JSON invalide provenant de yt-dlp."));
      }
    });
  });
}

function videoFormatScore(format: YtDlpFormat): number {
  let score = 0;

  const extension = format.ext?.toLowerCase() || "";
  const hasAudio = !!format.acodec && format.acodec !== "none";

  if (hasAudio) score += 100;
  if (extension === "mp4") score += 20;
  if (format.vcodec?.startsWith("avc1")) score += 10;

  return score;
}

const LADDER = [144, 240, 360, 480, 720, 1080, 1440, 2160, 4320];

/** 1920×1012 → 1080, 3840×2026 → 2160 (comme YouTube et Snaptube). */
function standardHeight(width?: number, height?: number): number {
  const h = height ?? 0;
  if (!width) return h;

  const effective =
    width >= h ? Math.max(Math.round((width * 9) / 16), h) : width;

  let best = LADDER[0];
  for (const step of LADDER) {
    if (step <= effective * 1.06) best = step;
  }
  return best;
}

/** Estimation de taille (utilisée tant que la vraie taille n'est pas connue). */
function sizeOf(f: YtDlpFormat, duration: number | null): number | null {
  if (f.filesize) return f.filesize;
  if (f.filesize_approx) return f.filesize_approx;
  if (f.tbr && duration) return Math.round(((f.tbr * 1000) / 8) * duration);
  return null;
}

/** Taille réelle demandée au serveur du fichier (sans le télécharger). */
async function realSize(url?: string): Promise<number | null> {
  if (!url) return null;

  try {
    // Anti-SSRF : l'adresse vient du site analysé, donc on la contrôle.
    await assertPublicHttpUrl(url);

    const head = await fetch(url, {
      method: "HEAD",
      redirect: "manual",
      signal: AbortSignal.timeout(4000),
    });

    let size = Number(head.headers.get("content-length"));

    if (!Number.isFinite(size) || size <= 0) {
      // Certains serveurs refusent HEAD : on lit la taille totale via Range.
      const ranged = await fetch(url, {
        headers: { Range: "bytes=0-0" },
        redirect: "manual",
        signal: AbortSignal.timeout(4000),
      });
      size = Number(ranged.headers.get("content-range")?.split("/")[1]);
    }

    return Number.isFinite(size) && size > 0 ? size : null;
  } catch {
    return null;
  }
}

export async function analyzeMedia(url: string): Promise<MediaInfo> {
  const parsedUrl = new URL(url);
  const source = parsedUrl.hostname.replace(/^www\./, "");

  const info = await runYtDlp(url);
  const duration = info.duration ?? null;

  const videoMap = new Map<string, { format: MediaFormat; score: number }>();
  const audioMap = new Map<string, MediaFormat>();

  // Meilleure piste audio : sa taille s'ajoute aux vidéos sans son.
  const bestAudio = (info.formats ?? [])
    .filter(
      (f) =>
        f.acodec && f.acodec !== "none" && (!f.vcodec || f.vcodec === "none")
    )
    .sort((a, b) => (b.tbr ?? 0) - (a.tbr ?? 0))[0];

  const audioSize = bestAudio ? (sizeOf(bestAudio, duration) ?? 0) : 0;

  // Adresse de chaque format (pour lire sa vraie taille plus bas).
  const urls = new Map<string, string>();

  for (const format of info.formats ?? []) {
    const formatId = format.format_id?.trim();
    const extension = format.ext?.toLowerCase();

    if (!formatId || !extension) continue;

    if (format.url) urls.set(formatId, format.url);

    const hasVideo = !!format.vcodec && format.vcodec !== "none";
    const hasAudio = !!format.acodec && format.acodec !== "none";

    // ===== VIDEO =====
    if (hasVideo && typeof format.height === "number" && format.height > 0) {
      const std = standardHeight(format.width, format.height);
      const quality = `${std}p`;
      const key = `video-${extension}-${std}`;

      const ownSize = sizeOf(format, duration);
      const totalSize =
        ownSize === null ? null : ownSize + (hasAudio ? 0 : audioSize);

      const candidate: MediaFormat = {
        formatId,
        format: extension.toUpperCase(),
        quality,
        type: "video",
        extension,
        hasAudio,
        filesize: totalSize,
        filesizeApprox: null,
      };

      const score = videoFormatScore(format);
      const existing = videoMap.get(key);

      if (!existing || score > existing.score) {
        videoMap.set(key, { format: candidate, score });
      }
    }

    // ===== AUDIO =====
    if (hasAudio && !hasVideo) {
      const key = `audio-${extension}`;

      if (!audioMap.has(key)) {
        audioMap.set(key, {
          formatId,
          format: extension.toUpperCase(),
          quality: "Audio",
          type: "audio",
          extension,
          hasAudio: true,
          filesize: sizeOf(format, duration),
          filesizeApprox: null,
        });
      }
    }
  }

  const videoFormats = Array.from(videoMap.values())
    .map((item) => item.format)
    .sort((a, b) => {
      const heightA = Number.parseInt(a.quality.replace("p", ""), 10) || 0;
      const heightB = Number.parseInt(b.quality.replace("p", ""), 10) || 0;
      return heightB - heightA;
    });

  const audioPriority = (extension: string) => {
    switch (extension) {
      case "mp3":
        return 1;
      case "m4a":
        return 2;
      case "webm":
        return 3;
      default:
        return 4;
    }
  };

  const audioFormats = Array.from(audioMap.values()).sort(
    (a, b) => audioPriority(a.extension) - audioPriority(b.extension)
  );

  // Vraies tailles : elles remplacent les estimations quand le serveur répond.
  const audioReal = (await realSize(bestAudio?.url)) ?? audioSize;

  await Promise.all(
    [...videoFormats, ...audioFormats].map(async (f) => {
      const exact = await realSize(urls.get(f.formatId));
      if (!exact) return;

      // Une vidéo sans son sera fusionnée avec la piste audio.
      f.filesize = f.type === "video" && !f.hasAudio ? exact + audioReal : exact;
    })
  );

  return {
    url,
    source,
    title: info.title ?? `${source} — média détecté`,
    thumbnail: info.thumbnail ?? null,
    duration: info.duration ?? null,
    formats: [...videoFormats, ...audioFormats],
  };
}