/**
 * Identifiant client Google (public : il peut être exposé sans danger).
 * À définir dans frontend/.env :  VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
 * Sans lui, le bouton Google n'est simplement pas affiché.
 */
export const GOOGLE_CLIENT_ID: string | undefined =
  import.meta.env.VITE_GOOGLE_CLIENT_ID || undefined;
