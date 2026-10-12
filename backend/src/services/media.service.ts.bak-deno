import { spawn } from "node:child_process";

export interface MediaFormat {
  formatId: string;
  format: string;
  quality: string;
  type: "video" | "audio";
  extension: string;
  hasAudio: boolean;
}

export interface MediaInfo {
  url: string;
  source: string;
  title: string;
  thumbnail: string | null;
  duration: number | null;
  formats: MediaFormat[];
}

interface YtDlpInfo {
  title?: string;
  thumbnail?: string;
  duration?: number;

  formats?: Array<{
    format_id?: string;
    ext?: string;
    height?: number;
    acodec?: string;
    vcodec?: string;
    protocol?: string;
  }>;
}

const YTDLP_PYTHON =
  process.env.YTDLP_PYTHON || "python3";

const YTDLP_BIN =
  process.env.YTDLP_BIN || "/usr/local/bin/yt-dlp";

function runYtDlp(
  url: string
): Promise<YtDlpInfo> {
  return new Promise((resolve, reject) => {
    const process = spawn(
      YTDLP_PYTHON,
      [
        YTDLP_BIN,
        "--dump-single-json",
        "--no-warnings",
        "--skip-download",
        "--no-playlist",
        url,
      ]
    );

    let stdout = "";
    let stderr = "";

    process.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    process.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    process.on("error", (error) => {
      reject(error);
    });

    process.on("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(
            stderr.trim() ||
              `yt-dlp a terminé avec le code ${code}`
          )
        );
        return;
      }

      try {
        resolve(
          JSON.parse(stdout) as YtDlpInfo
        );
      } catch {
        reject(
          new Error(
            "Réponse JSON invalide provenant de yt-dlp."
          )
        );
      }
    });
  });
}

function videoFormatScore(
  format: {
    ext?: string;
    acodec?: string;
    vcodec?: string;
  }
): number {
  let score = 0;

  const extension =
    format.ext?.toLowerCase() || "";

  const hasAudio =
    !!format.acodec &&
    format.acodec !== "none";

  if (hasAudio) {
    score += 100;
  }

  if (extension === "mp4") {
    score += 20;
  }

  if (
    format.vcodec?.startsWith("avc1")
  ) {
    score += 10;
  }

  return score;
}

export async function analyzeMedia(
  url: string
): Promise<MediaInfo> {
  const parsedUrl = new URL(url);

  const source =
    parsedUrl.hostname.replace(
      /^www\./,
      ""
    );

  const info = await runYtDlp(url);

  const videoMap =
    new Map<
      string,
      {
        format: MediaFormat;
        score: number;
      }
    >();

  const audioMap =
    new Map<string, MediaFormat>();

  for (const format of info.formats ?? []) {
    const formatId =
      format.format_id?.trim();

    const extension =
      format.ext?.toLowerCase();

    if (!formatId || !extension) {
      continue;
    }

    const hasVideo =
      !!format.vcodec &&
      format.vcodec !== "none";

    const hasAudio =
      !!format.acodec &&
      format.acodec !== "none";

    // ==========================================
    // VIDEO
    // ==========================================

    if (
      hasVideo &&
      typeof format.height === "number" &&
      format.height > 0
    ) {
      const quality =
        `${format.height}p`;

      const key =
        `video-${extension}-${format.height}`;

      const candidate: MediaFormat = {
        formatId,
        format:
          extension.toUpperCase(),
        quality,
        type: "video",
        extension,
        hasAudio,
      };

      const score =
        videoFormatScore(format);

      const existing =
        videoMap.get(key);

      if (
        !existing ||
        score > existing.score
      ) {
        videoMap.set(key, {
          format: candidate,
          score,
        });
      }
    }

    // ==========================================
    // AUDIO
    // ==========================================

    if (
      hasAudio &&
      !hasVideo
    ) {
      const key =
        `audio-${extension}`;

      if (!audioMap.has(key)) {
        audioMap.set(
          key,
          {
            formatId,
            format:
              extension.toUpperCase(),
            quality: "Audio",
            type: "audio",
            extension,
            hasAudio: true,
          }
        );
      }
    }
  }

  const videoFormats =
    Array.from(videoMap.values())
      .map((item) => item.format)
      .sort((a, b) => {
        const heightA =
          Number.parseInt(
            a.quality.replace("p", ""),
            10
          ) || 0;

        const heightB =
          Number.parseInt(
            b.quality.replace("p", ""),
            10
          ) || 0;

        return heightB - heightA;
      });

  const audioFormats =
    Array.from(audioMap.values())
      .sort((a, b) => {
        const priority = (
          extension: string
        ) => {
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

        return (
          priority(a.extension) -
          priority(b.extension)
        );
      });

  return {
    url,
    source,

    title:
      info.title ??
      `${source} — média détecté`,

    thumbnail:
      info.thumbnail ?? null,

    duration:
      info.duration ?? null,

    formats: [
      ...videoFormats,
      ...audioFormats,
    ],
  };
}