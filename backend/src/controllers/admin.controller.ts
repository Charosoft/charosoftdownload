import type { Request, Response } from "express";
import { pool } from "../config/database.js";

const ID = /^\d+$/;

async function log(adminId: string, action: string, details: object) {
  await pool
    .query(
      `INSERT INTO admin_logs (admin_id, action, details) VALUES ($1, $2, $3)`,
      [adminId, action, JSON.stringify(details)],
    )
    .catch((e) => console.error("admin_logs :", e.message));
}

export async function stats(_req: Request, res: Response) {
  const { rows } = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM users)::int AS users,
      (SELECT COUNT(*) FROM users
        WHERE plan = 'premium' AND (premium_until IS NULL OR premium_until > NOW()))::int AS premium,
      (SELECT COUNT(*) FROM download_history)::int AS downloads,
      (SELECT COUNT(*) FROM download_history
        WHERE created_at > NOW() - INTERVAL '1 day')::int AS downloads_today
  `);
  res.json(rows[0]);
}

export async function listUsers(req: Request, res: Response) {
  const search =
    typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 20;

  const where = `($1 = '' OR email ILIKE '%' || $1 || '%' OR name ILIKE '%' || $1 || '%')`;

  const { rows } = await pool.query(
    `SELECT id, name, email, role, is_active, created_at, premium_until,
            (plan = 'premium' AND (premium_until IS NULL OR premium_until > NOW())) AS is_premium
       FROM users
      WHERE ${where}
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3`,
    [search, limit, (page - 1) * limit],
  );

  const count = await pool.query(
    `SELECT COUNT(*)::int AS total FROM users WHERE ${where}`,
    [search],
  );

  res.json({ users: rows, total: count.rows[0].total, page, pageSize: limit });
}

/** days : nombre de jours à ajouter, null = illimité, 0 = retirer le Premium. */
export async function setPremium(req: Request, res: Response) {
  const id = String(req.params.id);
  const days = req.body?.days;

  if (!ID.test(id)) {
    return res.status(400).json({ message: "Identifiant invalide." });
  }

  if (days !== null && (!Number.isInteger(days) || days < 0 || days > 3650)) {
    return res.status(400).json({ message: "Durée invalide." });
  }

  let result;

  if (days === 0) {
    result = await pool.query(
      `UPDATE users SET plan = 'free', premium_until = NULL, updated_at = NOW()
        WHERE id = $1 RETURNING id, plan, premium_until`,
      [id],
    );
  } else if (days === null) {
    result = await pool.query(
      `UPDATE users SET plan = 'premium', premium_until = NULL, updated_at = NOW()
        WHERE id = $1 RETURNING id, plan, premium_until`,
      [id],
    );
  } else {
    // On prolonge à partir de la fin actuelle ; un Premium illimité le reste.
    result = await pool.query(
      `UPDATE users
          SET plan = 'premium',
              premium_until = CASE
                WHEN plan = 'premium' AND premium_until IS NULL THEN NULL
                ELSE GREATEST(COALESCE(premium_until, NOW()), NOW())
                     + make_interval(days => $2::int)
              END,
              updated_at = NOW()
        WHERE id = $1 RETURNING id, plan, premium_until`,
      [id, days],
    );
  }

  if (result.rowCount === 0) {
    return res.status(404).json({ message: "Utilisateur introuvable." });
  }

  await log(res.locals.authUser.id, "set_premium", { userId: id, days });
  return res.json({ user: result.rows[0] });
}

export async function setActive(req: Request, res: Response) {
  const id = String(req.params.id);
  const active = req.body?.active;

  if (!ID.test(id) || typeof active !== "boolean") {
    return res.status(400).json({ message: "Requête invalide." });
  }

  if (id === res.locals.authUser.id) {
    return res.status(400).json({ message: "Tu ne peux pas suspendre ton propre compte." });
  }

  const result = await pool.query(
    `UPDATE users SET is_active = $2, updated_at = NOW() WHERE id = $1 RETURNING id, is_active`,
    [id, active],
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ message: "Utilisateur introuvable." });
  }

  await log(res.locals.authUser.id, active ? "reactivate_user" : "suspend_user", { userId: id });
  return res.json({ user: result.rows[0] });
}