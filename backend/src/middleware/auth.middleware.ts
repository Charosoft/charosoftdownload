import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { pool } from "../config/database.js";

async function resolveUser(req: Request) {
  const token = req.cookies?.charosoft_session;
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) return null;

  try {
    const payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
    if (typeof payload === "string" || !payload.sub) return null;

    const { rows } = await pool.query(
      `SELECT id, name, email, role, is_active, premium_until,
              CASE WHEN plan = 'premium'
                    AND (premium_until IS NULL OR premium_until > NOW())
                   THEN 'premium' ELSE 'free' END AS plan
         FROM users WHERE id = $1`,
      [payload.sub],
    );
    const u = rows[0];
    if (!u || !u.is_active) return null;

    return {
      id: String(u.id),
      name: u.name,
      email: u.email,
      role: u.role,
      plan: u.plan,
      premiumUntil: u.premium_until,
    };
  } catch (error) {
    console.error("Session :", error instanceof Error ? error.message : error);
    return null;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = await resolveUser(req);
  if (!user) return res.status(401).json({ message: "Connexion requise." });
  res.locals.authUser = user;
  return next();
}

/** Identifie l'utilisateur s'il est connecté, sans jamais bloquer. */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  res.locals.authUser = await resolveUser(req);
  return next();
}

// requireAdmin : inchangé

export function requireAdmin(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  if (res.locals.authUser?.role !== "admin") {
    return res.status(403).json({ message: "Accès réservé à l'administration." });
  }

  return next();
}
