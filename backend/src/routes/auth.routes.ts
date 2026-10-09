
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, logout, me, register } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Trop de tentatives. Réessaie dans 15 minutes." },
});

function checkOrigin(
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction,
) {
  const origin = req.get("origin");

  // Autorise les requêtes serveur à serveur sans en-tête Origin.
  if (!origin) return next();

  const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    process.env.FRONTEND_ORIGIN,
  ].filter((value): value is string => Boolean(value));

  if (!allowedOrigins.includes(origin)) {
    return res.status(403).json({ message: "Origine non autorisée." });
  }

  return next();
}

router.post("/register", checkOrigin, loginLimiter, register);
router.post("/login", checkOrigin, loginLimiter, login);
router.get("/me", requireAuth, me);
router.post("/logout", checkOrigin, logout);

export default router;
