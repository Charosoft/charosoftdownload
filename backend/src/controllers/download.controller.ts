import type {
  Request,
  Response,
} from "express";
import { assertPublicHttpUrl, UrlNotAllowedError } from "../utils/urlGuard.js";

import {
  createReadStream,
} from "node:fs";

import {
  stat,
} from "node:fs/promises";

import {
  cleanupFile,
  downloadMedia,
} from "../services/download.service.js";

/**
 * Protocole de communication :
 *
 * Chaque message envoyé au frontend est :
 *
 * [4 octets = longueur]
 * [1 octet = type]
 * [payload]
 *
 * Type 0 = progression
 * Type 1 = informations fichier
 * Type 2 = morceau du fichier
 * Type 3 = fin
 * Type 4 = erreur
 */

const TYPE_PROGRESS = 0;
const TYPE_FILE_INFO = 1;
const TYPE_FILE_CHUNK = 2;
const TYPE_DONE = 3;
const TYPE_ERROR = 4;

function createFrame(
  type: number,
  payload: Buffer
): Buffer {
  const length =
    1 + payload.length;

  const frame =
    Buffer.allocUnsafe(
      4 + length
    );

  frame.writeUInt32BE(
    length,
    0
  );

  frame.writeUInt8(
    type,
    4
  );

  payload.copy(
    frame,
    5
  );

  return frame;
}

function sendProgress(
  res: Response,
  progress: number
) {
  const payload =
    Buffer.from(
      String(
        Math.round(progress)
      ),
      "utf8"
    );

  res.write(
    createFrame(
      TYPE_PROGRESS,
      payload
    )
  );
}

function sendFileInfo(
  res: Response,
  fileName: string,
  fileSize: number
) {
  const payload =
    Buffer.from(
      JSON.stringify({
        fileName,
        fileSize,
      }),
      "utf8"
    );

  res.write(
    createFrame(
      TYPE_FILE_INFO,
      payload
    )
  );
}

function sendFileChunk(
  res: Response,
  chunk: Buffer
) {
  res.write(
    createFrame(
      TYPE_FILE_CHUNK,
      chunk
    )
  );
}

function sendDone(
  res: Response
) {
  res.write(
    createFrame(
      TYPE_DONE,
      Buffer.alloc(0)
    )
  );
}

function sendError(
  res: Response,
  message: string
) {
  const payload =
    Buffer.from(
      JSON.stringify({
        message,
      }),
      "utf8"
    );

  res.write(
    createFrame(
      TYPE_ERROR,
      payload
    )
  );
}

export async function downloadUrl(
  req: Request,
  res: Response
) {
  const body =
    req.body ?? {};

  const {
    url,
    type,
    extension,
    quality,
    formatId,
    hasAudio,
    title,
  } = body;

  /**
   * PARAMÈTRES
   */
  if (
    typeof url !== "string" ||
    typeof type !== "string" ||
    typeof extension !== "string" ||
    typeof quality !== "string" ||
    typeof formatId !== "string"
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Les paramètres du téléchargement sont incomplets.",
    });
  }

  /**
   * TYPE
   */
  if (
    ![
      "video",
      "audio",
    ].includes(type)
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Type de média invalide.",
    });
  }

  /**
   * FORMAT ID
   */
  if (
    !formatId.trim()
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Identifiant de format invalide.",
    });
  }

  /**
   * URL
   */
  try {
    const parsedUrl =
      new URL(url);

    if (
      ![
        "http:",
        "https:",
      ].includes(
        parsedUrl.protocol
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Le lien doit utiliser HTTP ou HTTPS.",
      });
    }
  } catch {
    return res.status(400).json({
      success: false,
      message:
        "URL du média invalide.",
    });
  }

  /**
   * ADRESSE PUBLIQUE UNIQUEMENT (anti-SSRF)
   */
  try {
    await assertPublicHttpUrl(url);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof UrlNotAllowedError
          ? error.message
          : "URL du média invalide.",
    });
  }

  /**
   * HEADERS DU FLUX
   */
  res.status(200);

  res.setHeader(
    "Content-Type",
    "application/octet-stream"
  );

  res.setHeader(
    "Cache-Control",
    "no-store"
  );

  res.setHeader(
    "X-Accel-Buffering",
    "no"
  );

  try {
    console.log(
      "⬇️ Téléchargement :",
      {
        url,
        type,
        extension,
        quality,
        formatId,
        hasAudio,
      }
    );

    /**
     * PROGRESSION INITIALE
     */
    sendProgress(
      res,
      0
    );

    /**
     * TITRE DU FICHIER
     *
     * Le site envoie déjà le titre affiché à l'écran : inutile d'analyser de
     * nouveau le média (plusieurs secondes d'attente avec la barre à 0 %).
     * Le nom est nettoyé et limité en longueur par le service de téléchargement.
     */
    const fileTitle =
      typeof title === "string" && title.trim()
        ? title.trim().slice(0, 200)
        : "media";

    /**
     * TÉLÉCHARGEMENT SERVEUR
     */
    const result =
      await downloadMedia({
        url,
        title: fileTitle,
        type:
          type as
            | "video"
            | "audio",
        extension,
        quality,
        formatId,
        hasAudio:
          hasAudio === true ||
          hasAudio === "true",

        onProgress:
          (progress) => {
            if (
              !res.writableEnded
            ) {
              sendProgress(
                res,
                progress
              );
            }
          },
      });

    console.log(
      "✅ Fichier généré :",
      result.filePath
    );

    /**
     * TAILLE DU FICHIER
     */
    const fileStats =
      await stat(
        result.filePath
      );

    const fileSize =
      fileStats.size;

    /**
     * INFORMATIONS DU FICHIER
     */
    sendFileInfo(
      res,
      result.fileName,
      fileSize
    );

    /**
     * ENVOI DU FICHIER
     */
    const fileStream =
      createReadStream(
        result.filePath
      );

    let sentBytes = 0;

    let lastProgress = 94;

    fileStream.on(
      "data",
      (chunk) => {
        const buffer =
          Buffer.isBuffer(chunk)
            ? chunk
            : Buffer.from(chunk);

        sendFileChunk(
          res,
          buffer
        );

        sentBytes +=
          buffer.length;

        if (
          fileSize > 0
        ) {
          const transfer =
            sentBytes /
            fileSize;

          const progress =
            Math.min(
              99,
              94 +
                Math.round(
                  transfer * 5
                )
            );

          if (
            progress >
            lastProgress
          ) {
            lastProgress =
              progress;

            sendProgress(
              res,
              progress
            );
          }
        }
      }
    );

    fileStream.on(
      "end",
      async () => {
        try {
          if (
            !res.writableEnded
          ) {
            sendProgress(
              res,
              100
            );

            sendDone(
              res
            );

            res.end();
          }

          console.log(
            "✅ Téléchargement envoyé :",
            result.fileName
          );
        } finally {
          await cleanupFile(
            result.filePath
          );
        }
      }
    );

    fileStream.on(
      "error",
      async (error) => {
        console.error(
          "❌ Erreur lecture fichier :",
          error
        );

        await cleanupFile(
          result.filePath
        );

        if (
          !res.writableEnded
        ) {
          try {
            sendError(
              res,
              "Erreur pendant la lecture du fichier."
            );
          } catch {
            // La connexion peut déjà être fermée.
          }

          res.end();
        }
      }
    );

    /**
     * Si le client ferme la connexion
     * pendant le téléchargement.
     */
    res.on(
      "close",
      async () => {
        if (
          !res.writableEnded
        ) {
          fileStream.destroy();

          await cleanupFile(
            result.filePath
          );
        }
      }
    );
  } catch (error) {
    console.error(
      "❌ Erreur téléchargement :",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Le téléchargement a échoué.";

    /**
     * Si les headers n'ont pas encore
     * été envoyés, on peut retourner
     * une réponse JSON classique.
     */
    if (
      !res.headersSent
    ) {
      return res.status(500).json({
        success: false,
        message,
      });
    }

    /**
     * Les headers sont déjà envoyés.
     *
     * On utilise donc notre protocole
     * personnalisé pour transmettre
     * l'erreur au frontend.
     */
    if (
      !res.writableEnded
    ) {
      try {
        sendError(
          res,
          message
        );
      } catch {
        // La connexion peut déjà être fermée.
      }

      res.end();
    }
  }
}