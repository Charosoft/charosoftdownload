import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  max: 10,
  idleTimeoutMillis: 30000,
});

// Signale les erreurs inattendues sur les connexions inactives.
pool.on("error", (error) => {
  console.error("Erreur PostgreSQL :", error.message);
});

// Vérifie que le backend peut réellement accéder à la base.
export async function testDatabaseConnection(): Promise<void> {
  const result = await pool.query(
    "SELECT current_database() AS database, NOW() AS server_time"
  );

  console.log("Connexion PostgreSQL réussie :", result.rows[0]);
}