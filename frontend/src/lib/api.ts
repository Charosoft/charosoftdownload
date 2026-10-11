/**
 * Adresse du backend (une seule source de vérité).
 * En développement : http://localhost:3000
 * En production : définie par la variable VITE_API_URL.
 */
export const API_URL: string =
  import.meta.env.VITE_API_URL || "http://localhost:3000";
