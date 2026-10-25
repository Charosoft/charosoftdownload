import type { Request, Response } from "express";
import { analyzeMedia } from "../services/media.service.js";
import { publicLimits } from "../config/limits.js";
import { assertPublicHttpUrl, UrlNotAllowedError } from "../utils/urlGuard.js";
import { describeMediaError } from "../utils/mediaErrors.js";

export async function analyzeUrl(req: Request, res: Response) {
  const url = req.body?.url;

  if (!url || typeof url !== "string") {
    return res.status(400).json({
      success: false,
      message: "Une URL est requise.",
    });
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({
      success: false,
      message: "Veuillez fournir une URL valide.",
    });
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return res.status(400).json({
      success: false,
      message: "Le lien doit utiliser HTTP ou HTTPS.",
    });
  }

  try {
    await assertPublicHttpUrl(url);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof UrlNotAllowedError
          ? error.message
          : "Veuillez fournir une URL valide.",
    });
  }

  try {
    const media = await analyzeMedia(url);

    return res.json({
      success: true,
      data: { ...media, limits: publicLimits() },
    });
  } catch (error) {
    console.error("❌ Erreur yt-dlp / analyse média :", error);

    const friendly = describeMediaError(error, "L'analyse du média a échoué.");

    return res.status(friendly.status).json({
      success: false,
      message: friendly.message,
    });
  }
}