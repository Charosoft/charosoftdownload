import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import {
  mkdir,
  readdir,
  rm,
  stat,
} from "node:fs/promises";
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
}

const TEMP_DIR =
  process.env.TEMP_DOWNLOAD_DIR ||
  "./downloads";

const YTDLP_PYTHON =
  process.env.YTDLP_PYTHON ||
  "python3";

const YTDLP_BIN =
  process.env.YTDLP_BIN ||
  "/usr/local/bin/yt-dlp";


  function sanitizeFileName(name: string): string {
  return name
    .normalize("NFKC")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "")
    .slice(0, 180);
}

function buildDownloadFileName(
  title: string,
  extension: string
): string {
  const cleanTitle =
    sanitizeFileName(title) || "media";

  return `CharosoftDownload - ${cleanTitle}.${extension}`;
}

function runYtDlp(
  args: string[],
  outputTemplate: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const process = spawn(
      YTDLP_PYTHON,
      [
        YTDLP_BIN,
        ...args,
        "--newline",
        "-o",
        outputTemplate,
        "--print",
        "after_move:filepath",
      ]
    );

    let stdout = "";
    let stderr = "";

    let lastProgress = 0;

    process.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    process.stderr.on("data", (data) => {
      const output = data.toString();

      stderr += output;

      const lines =
        output.split(/\r?\n/);

      for (const line of lines) {
        const match =
          line.match(
            /\[download\]\s+(\d+(?:\.\d+)?)%/
          );

        if (!match) {
          continue;
        }

        const percentage =
          Number.parseFloat(match[1]);

        if (
          !Number.isFinite(
            percentage
          )
        ) {
          continue;
        }

        /*
         * On réserve les derniers pourcents
         * à la préparation et à l'envoi du fichier.
         */
        const progress =
          Math.min(
            90,
            Math.max(
              lastProgress,
              Math.round(
                percentage * 0.9
              )
            )
          );

        if (
          progress >
          lastProgress
        ) {
          lastProgress =
            progress;

          onProgress?.(
            progress
          );
        }
      }
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

      onProgress?.(92);

      const lines =
        stdout
          .split(/\r?\n/)
          .map((line) =>
            line.trim()
          )
          .filter(Boolean);

      const finalPath =
        lines[lines.length - 1];

      if (!finalPath) {
        reject(
          new Error(
            "yt-dlp n'a pas retourné le chemin du fichier."
          )
        );

        return;
      }

      resolve(finalPath);
    });
  });
}

function normalizeExtension(
  extension: string
): "mp4" | "mp3" | "m4a" | "webm" {
  const normalized =
    extension.toLowerCase();

  if (
    normalized === "mp4" ||
    normalized === "mp3" ||
    normalized === "m4a" ||
    normalized === "webm"
  ) {
    return normalized;
  }

  throw new Error(
    `Format ${extension} non pris en charge.`
  );
}

function buildFormatSelector(
  options: DownloadOptions
): string {
  if (!options.formatId) {
    throw new Error(
      "Identifiant de format manquant."
    );
  }

  if (
    options.type === "audio"
  ) {
    return options.formatId;
  }

  if (options.hasAudio) {
    return options.formatId;
  }

  return `${options.formatId}+bestaudio/best`;
}

export async function downloadMedia(
  options: DownloadOptions
): Promise<{
  filePath: string;
  fileName: string;
}> {
  const extension =
    normalizeExtension(
      options.extension
    );

  await mkdir(TEMP_DIR, {
    recursive: true,
  });

  const jobId =
    crypto.randomUUID();

  const temporaryTemplate =
    path.resolve(
      TEMP_DIR,
      `charosoft-${jobId}.%(ext)s`
    );

  const selector =
    buildFormatSelector(
      options
    );

  const args = [
    "--no-warnings",
    "--no-playlist",
    "--restrict-filenames",
    "-f",
    selector,
  ];

  if (
    options.type === "audio"
  ) {
    args.push(
      "-x",
      "--audio-format",
      extension
    );
  }

  if (
    options.type === "video"
  ) {
    args.push(
      "--merge-output-format",
      extension
    );
  }

  const finalPath =
    await runYtDlp(
      [
        ...args,
        options.url,
      ],
      temporaryTemplate,
      options.onProgress
    );

  if (!existsSync(finalPath)) {
    throw new Error(
      "Le fichier téléchargé n'a pas été généré."
    );
  }

  options.onProgress?.(94);

  const fileName = buildDownloadFileName(
  options.title,
  extension
);

return { filePath: finalPath, fileName };
}

export async function cleanupFile(
  filePath: string
) {
  try {
    await rm(filePath, {
      force: true,
    });
  } catch {
    // Nettoyage silencieux
  }
}

export async function cleanupOldFiles() {
  try {
    await mkdir(TEMP_DIR, {
      recursive: true,
    });

    const files =
      await readdir(TEMP_DIR);

    const now =
      Date.now();

    const maxAge =
      60 * 60 * 1000;

    for (const file of files) {
      if (
        !file.startsWith(
          "charosoft-"
        )
      ) {
        continue;
      }

      const filePath =
        path.resolve(
          TEMP_DIR,
          file
        );

      try {
        const stats =
          await stat(
            filePath
          );

        const age =
          now -
          stats.mtimeMs;

        if (
          age > maxAge
        ) {
          await rm(
            filePath,
            {
              force: true,
            }
          );
        }
      } catch {
        // Le fichier peut avoir été supprimé
        // entre-temps.
      }
    }
  } catch {
    // Nettoyage silencieux.
  }
}