import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  jobEvents,
  jobFile,
  startDownload,
} from "../controllers/download.controller.js";
import { optionalAuth } from "../middleware/auth.middleware.js";

const router = Router();

// Limite plus stricte pour les visiteurs ; les comptes connectés en sont dispensés.
const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: (_req, res) => Boolean(res.locals.authUser),
  message: {
    success: false,
    message: "Trop de téléchargements. Connecte-toi ou réessaie plus tard.",
  },
});

router.post("/", optionalAuth, downloadLimiter, startDownload);
router.get("/:jobId/events", jobEvents);
router.get("/:jobId/file", jobFile);

export default router;