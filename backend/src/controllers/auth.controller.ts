
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/database.js";

const COOKIE_NAME = "charosoft_session";
const ONE_DAY = 24 * 60 * 60 * 1000;

function cookieOptions() {
  const production = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: production,
    sameSite: production ? ("none" as const) : ("lax" as const),
    path: "/",
    maxAge: ONE_DAY,
  };
}

function setSessionCookie(
  res: Response,
  user: { id: string | number; email: string; role: "user" | "admin" },
) {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET absent ou trop court.");
  }

  const token = jwt.sign(
    { sub: String(user.id), email: user.email, role: user.role },
    secret,
    { expiresIn: "1d", algorithm: "HS256" },
  );

  res.cookie(COOKIE_NAME, token, cookieOptions());
}

export async function register(req: Request, res: Response) {
  try {
    const name =
      typeof req.body.name === "string" ? req.body.name.trim() : "";
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    const password =
      typeof req.body.password === "string" ? req.body.password : "";

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Le nom, l'email et le mot de passe sont obligatoires.",
      });
    }

    if (name.length > 100 || email.length > 255) {
      return res.status(400).json({ message: "Données trop longues." });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Adresse email invalide." });
    }

    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({
        message: "Le mot de passe doit contenir entre 8 et 128 caractères.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'user')
       RETURNING id, name, email, role, is_active, created_at`,
      [name, email, passwordHash],
    );

    const user = result.rows[0];

    // La création du compte ouvre directement une session sécurisée.
    setSessionCookie(res, user);

    return res.status(201).json({
      message: "Compte créé avec succès.",
      user: {
        id: String(user.id),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return res.status(409).json({
        message: "Cette adresse email est déjà utilisée.",
      });
    }

    console.error("Erreur inscription :", error);
    return res.status(500).json({ message: "Erreur interne du serveur." });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    const password =
      typeof req.body.password === "string" ? req.body.password : "";

    if (!email || !password) {
      return res.status(400).json({
        message: "L'email et le mot de passe sont obligatoires.",
      });
    }

    const result = await pool.query(
      `SELECT id, name, email, password_hash, role, is_active
       FROM users
       WHERE email = $1`,
      [email],
    );

    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({
        message: "Email ou mot de passe incorrect.",
      });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: "Ce compte est désactivé." });
    }

    setSessionCookie(res, user);

    return res.json({
      message: "Connexion réussie.",
      user: {
        id: String(user.id),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Erreur connexion :", error);
    return res.status(500).json({ message: "Erreur interne du serveur." });
  }
}

export function me(_req: Request, res: Response) {
  return res.json({ user: res.locals.authUser });
}

export function logout(_req: Request, res: Response) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });

  return res.json({ message: "Déconnexion réussie." });
}
