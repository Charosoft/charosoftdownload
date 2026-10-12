export type MediaErrorInfo = { status: number; message: string };

const KNOWN_ERRORS: Array<{ test: RegExp; status: number; message: string }> = [
  {
    test: /not a bot|captcha/i,
    status: 502,
    message: "Le site a refusé la demande. Réessaie dans quelques minutes.",
  },
  {
    test: /unsupported url|no suitable extractor/i,
    status: 422,
    message: "Ce site ou ce type de lien n'est pas pris en charge.",
  },
  {
    test: /private video|login required|sign in|members only|requires (a )?login/i,
    status: 422,
    message: "Ce média est privé ou demande une connexion : il ne peut pas être téléchargé.",
  },
  {
    test: /video unavailable|has been removed|no longer available|not available|\b404\b|does not exist|deleted/i,
    status: 422,
    message: "Ce média n'est plus disponible ou le lien est incorrect.",
  },
  {
    test: /geo|not available in your country|blocked it in your country/i,
    status: 422,
    message: "Ce média n'est pas accessible depuis la zone du serveur.",
  },
  {
    test: /\b403\b|forbidden|\b429\b|too many requests|rate.?limit/i,
    status: 502,
    message: "Le site a refusé la demande. Réessaie dans quelques minutes.",
  },
  {
    test: /timed out|timeout|temporary failure|name resolution|connection (reset|refused)|unable to download webpage/i,
    status: 502,
    message: "Le site ne répond pas pour le moment. Réessaie plus tard.",
  },
];

/**
 * Transforme une erreur brute de yt-dlp en message clair pour l'utilisateur.
 * Le détail technique reste dans les journaux du serveur, jamais à l'écran.
 */
export function describeMediaError(
  error: unknown,
  fallback: string,
): MediaErrorInfo {
  const raw = error instanceof Error ? error.message : String(error ?? "");

  for (const known of KNOWN_ERRORS) {
    if (known.test.test(raw)) {
      return { status: known.status, message: known.message };
    }
  }

  return { status: 500, message: fallback };
}
