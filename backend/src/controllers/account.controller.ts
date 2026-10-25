import type { Request, Response } from "express";
import { pool } from "../config/database.js";

export async function history(_req: Request, res: Response) {
  const userId = res.locals.authUser.id;

  const { rows } = await pool.query(
    `SELECT id, media_url, media_title, platform, format, status, created_at
       FROM download_history
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50`,
    [userId],
  );

  const count = await pool.query(
    `SELECT COUNT(*)::int AS total FROM download_history WHERE user_id = $1`,
    [userId],
  );

  res.json({ items: rows, total: count.rows[0].total });
}

export async function clearHistory(_req: Request, res: Response) {
  await pool.query(`DELETE FROM download_history WHERE user_id = $1`, [
    res.locals.authUser.id,
  ]);
  res.json({ message: "Historique vidé." });
}