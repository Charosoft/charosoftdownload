import type { NextFunction, Request, Response } from "express";

type HttpError = Error & { type?: string; status?: number };

/**
 * Dernier filet de sécurité : toute erreur non gérée devient une réponse JSON
 * claire (au lieu d'une page HTML d'erreur), sans détail technique.
 */
export function errorHandler(
  error: HttpError,
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  // Un téléchargement est déjà en cours d'envoi : on laisse Express fermer.
  if (res.headersSent) return next(error);

  if (error.message === "Origine CORS non autorisée.") {
    return res.status(403).json({ message: "Origine non autorisée." });
  }

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Corps de requête invalide." });
  }

  if (error.type === "entity.too.large") {
    return res.status(413).json({ message: "Requête trop volumineuse." });
  }

  console.error("Erreur non gérée :", error);

  return res.status(500).json({ message: "Erreur interne du serveur." });
}
