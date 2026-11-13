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

/** Ce qu'il faut savoir pour corriger la taille d'un format plus tard. */
interface SizeMeta {
  url?: string;
  exact: boolean;
  estimate: number | null;
  audio: number;
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
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("timed out : analyse trop longue"));
    }, Number(process.env.ANALYZE_TIMEOUT_MS) || 60_000);

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timer);
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

/** Format HLS (liste de lecture) : pas de taille fiable, téléchargement lent. */
function isHls(f: YtDlpFormat): boolean {
  return !!f.protocol && f.protocol.includes("m3u8");
}

/** Taille exacte donnée par la plateforme (celle que yt-dlp contrôle aussi). */
function exactSize(f: YtDlpFormat): number | null {
  return f.filesize || f.filesize_approx || null;
}

/** Estimation par le débit : jamais pour le HLS, dont le débit est trompeur. */
function estimateSize(f: YtDlpFormat, duration: number | null): number | null {
  if (isHls(f) || !f.tbr || !duration) return null;
  return Math.round(((f.tbr * 1000) / 8) * duration);
}

function videoFormatScore(format: YtDlpFormat): number {
  let score = 0;

  const extension = format.ext?.toLowerCase() || "";
  const hasAudio = !!format.acodec && format.acodec !== "none";

  if (hasAudio) score += 100;
  if (extension === "mp4") score += 20;
  if (format.vcodec?.startsWith("avc1")) score += 10;

  // On préfère les formats directs dont la taille est exacte.
  if (exactSize(format)) score += 40;
  if (isHls(format)) score -= 60;

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
  const allFormats = info.formats ?? [];

  const videoMap = new Map<string, { format: MediaFormat; score: number }>();
  const audioMap = new Map<string, MediaFormat>();
  const meta = new Map<string, SizeMeta>();

  // Pistes audio : le MP4 reçoit du M4A, les autres la meilleure piste.
  const audioTracks = allFormats
    .filter(
      (f) =>
        f.acodec && f.acodec !== "none" && (!f.vcodec || f.vcodec === "none")
    )
    .sort((a, b) => (b.tbr ?? 0) - (a.tbr ?? 0));

  const audioSizeOf = (f?: YtDlpFormat) =>
    f ? (exactSize(f) ?? estimateSize(f, duration) ?? 0) : 0;

  const audioForMp4 = audioSizeOf(
    audioTracks.find((f) => f.ext === "m4a") ?? audioTracks[0]
  );
  const audioForOthers = audioSizeOf(audioTracks[0]);

  for (const format of allFormats) {
    const formatId = format.format_id?.trim();
    const extension = format.ext?.toLowerCase();

    if (!formatId || !extension) continue;

    const hasVideo = !!format.vcodec && format.vcodec !== "none";
    const hasAudio = !!format.acodec && format.acodec !== "none";

    const exact = exactSize(format);
    const estimate = estimateSize(format, duration);
    const own = exact ?? estimate;

    // ===== VIDEO =====
    if (hasVideo && typeof format.height === "number" && format.height > 0) {
      const std = standardHeight(format.width, format.height);
      const key = `video-${extension}-${std}`;

      // Une vidéo sans son sera fusionnée avec une piste audio.
      const audioPart = hasAudio
        ? 0
        : extension === "mp4"
          ? audioForMp4
          : audioForOthers;

      const candidate: MediaFormat = {
        formatId,
        format: extension.toUpperCase(),
        quality: `${std}p`,
        type: "video",
        extension,
        hasAudio,
        filesize: own === null ? null : own + audioPart,
        filesizeApprox: null,
      };

      const score = videoFormatScore(format);
      const existing = videoMap.get(key);

      if (!existing || score > existing.score) {
        videoMap.set(key, { format: candidate, score });
        meta.set(formatId, {
          url: isHls(format) ? undefined : format.url,
          exact: exact !== null,
          estimate,
          audio: audioPart,
        });
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
          filesize: own,
          filesizeApprox: null,
        });
        meta.set(formatId, {
          url: isHls(format) ? undefined : format.url,
          exact: exact !== null,
          estimate,
          audio: 0,
        });
      }
    }
  }

  const videoFormats = Array.from(videoMap.values())
    .map((item) => item.format)
    .sort((a, b) => {
      const heightA = Number.parseInt(a.quality, 10) || 0;
      const heightB = Number.parseInt(b.quality, 10) || 0;
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

  // Vraie taille demandée au serveur, seulement quand la plateforme n'en donne pas.
  await Promise.all(
    [...videoFormats, ...audioFormats].map(async (f) => {
      const m = meta.get(f.formatId);
      if (!m || m.exact || !m.url) return;

      const real = await realSize(m.url);
      if (!real) return;

      // Garde-fou : une taille aberrante vient d'une mauvaise réponse.
      if (m.estimate && (real < m.estimate * 0.4 || real > m.estimate * 2.5)) {
        return;
      }

      f.filesize = real + m.audio;
    })
  );

  return {
    url,
    source,
    title: info.title ?? `${source} — média détecté`,
    thumbnail: info.thumbnail ?? null,
    duration,
    formats: [...videoFormats, ...audioFormats],
  };
}