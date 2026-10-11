import { OAuth2Client } from "google-auth-library";

export type GoogleProfile = {
  /** Identifiant Google unique et permanent de la personne. */
  sub: string;
  email: string;
  name: string;
};

export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID);
}

/**
 * Vérifie auprès de Google que le « credential » reçu du bouton Google est
 * authentique, destiné à CE site, et que l'adresse e-mail est vérifiée.
 */
export async function verifyGoogleCredential(
  credential: string,
): Promise<GoogleProfile> {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID absent.");
  }

  const client = new OAuth2Client(clientId);

  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: clientId,
  });

  const payload = ticket.getPayload();

  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    throw new Error("Compte Google sans adresse e-mail vérifiée.");
  }

  const email = payload.email.trim().toLowerCase();
  const name = (payload.name || email.split("@")[0]).trim().slice(0, 100);

  return { sub: payload.sub, email, name };
}
