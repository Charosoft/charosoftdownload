import type { Request, Response } from "express";
import { analyzeMedia } from "../services/media.service.js";

export async function analyzeUrl(
  req: Request,
  res: Response
) {
  const { url } = req.body;

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
    const media = await analyzeMedia(url);

    return res.json({
      success: true,
      data: media,
    });
  } catch (error) {
    console.error(
      "❌ Erreur yt-dlp / analyse média :",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "L'analyse du média a échoué.",
    });
  }
}