
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { pool } from "../config/database.js";

export async function requireAuth(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = _req.cookies?.charosoft_session;

    if (!token) {
      return res.status(401).json({ message: "Connexion requise." });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "Configuration serveur invalide." });
    }

    const payload = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    });

    if (typeof payload === "string" || !payload.sub) {
      return res.status(401).json({ message: "Session invalide." });
    }

    // Relire l'utilisateur en base : son rôle et son état restent à jour.
    const result = await pool.query(
      `SELECT id, name, email, role, is_active
       FROM users
       WHERE id = $1`,
      [payload.sub],
    );

    const user = result.rows[0];

    if (!user || !user.is_active) {
      return res.status(401).json({ message: "Compte indisponible." });
    }

    res.locals.authUser = {
      id: String(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return next();
  } catch {
    return res.status(401).json({ message: "Session invalide ou expirée." });
  }
}

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
