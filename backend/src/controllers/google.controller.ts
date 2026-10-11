import type { Request, Response } from "express";
import { pool } from "../config/database.js";
import { verifyGoogleCredential } from "../services/google.service.js";
import type { GoogleProfile } from "../services/google.service.js";
import { setSessionCookie } from "./auth.controller.js";

type DbUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  is_active: boolean;
};

/**
 * Trouve ou crée l'utilisateur correspondant à un compte Google.
 *
 * 1. Compte Google déjà lié → on le retrouve.
 * 2. Même adresse e-mail qu'un compte existant → on lie les deux.
 *    L'e-mail d'un compte créé avec mot de passe n'a jamais été vérifié : on
 *    supprime donc son mot de passe, pour que personne ne puisse garder un
 *    accès en s'étant inscrit avant le vrai propriétaire de l'adresse.
 * 3. Sinon → nouveau compte, sans mot de passe.
 */
async function findOrCreateGoogleUser(profile: GoogleProfile): Promise<DbUser> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const linked = await client.query(
      `SELECT u.id, u.name, u.email, u.role, u.is_active
       FROM auth_identities ai
       JOIN users u ON u.id = ai.user_id
       WHERE ai.provider = 'google' AND ai.provider_user_id = $1`,
      [profile.sub],
    );

    let user: DbUser | undefined = linked.rows[0];

    if (!user) {
      const existing = await client.query(
        `SELECT id, name, email, role, is_active
         FROM users
         WHERE email = $1
         FOR UPDATE`,
        [profile.email],
      );

      if (existing.rows[0]) {
        user = existing.rows[0] as DbUser;

        await client.query(
          `UPDATE users SET password_hash = NULL, updated_at = NOW()
           WHERE id = $1`,
          [user.id],
        );
      } else {
        const created = await client.query(
          `INSERT INTO users (name, email, password_hash)
           VALUES ($1, $2, NULL)
           RETURNING id, name, email, role, is_active`,
          [profile.name, profile.email],
        );

        user = created.rows[0] as DbUser;
      }

      await client.query(
        `INSERT INTO auth_identities
           (user_id, provider, provider_user_id, email)
         VALUES ($1, 'google', $2, $3)`,
        [user.id, profile.sub, profile.email],
      );
    }

    await client.query("COMMIT");

    return user;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function googleLogin(req: Request, res: Response) {
  try {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({
        message: "La connexion avec Google n'est pas configurée.",
      });
    }

    const credential =
      typeof req.body?.credential === "string" ? req.body.credential : "";

    if (!credential || credential.length > 4096) {
      return res.status(400).json({ message: "Connexion Google invalide." });
    }

    let profile: GoogleProfile;

    try {
      profile = await verifyGoogleCredential(credential);
    } catch {
      return res.status(401).json({
        message: "Connexion Google refusée. Réessaie.",
      });
    }

    const user = await findOrCreateGoogleUser(profile);

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
    console.error("Erreur connexion Google :", error);
    return res.status(500).json({ message: "Erreur interne du serveur." });
  }
}
