export type Plan = "anonymous" | "free" | "premium";

const mb = (n: number) => n * 1024 * 1024;

export const MAX_DURATION =
  Number(process.env.MAX_MEDIA_DURATION_SECONDS) || 3600;

export function planOf(user?: { plan?: string } | null): Plan {
  if (!user) return "anonymous";
  return user.plan === "premium" ? "premium" : "free";
}

/** null = illimité */
export function maxBytesFor(plan: Plan): number | null {
  if (plan === "premium") return null;
  if (plan === "free") return mb(Number(process.env.LIMIT_USER_MB) || 2048);
  return mb(Number(process.env.LIMIT_ANON_MB) || 50);
}

export function limitMessage(plan: Plan): string {
  if (plan === "anonymous") {
    const n = Number(process.env.LIMIT_ANON_MB) || 50;
    return `Ce média dépasse la limite des visiteurs (${n} Mo). Connecte-toi gratuitement pour télécharger jusqu'à 2 Go.`;
  }
  return "Ce média dépasse la limite du compte gratuit (2 Go). Passe en Premium pour un téléchargement illimité.";
}

export class LimitExceededError extends Error {
  constructor(plan: Plan) {
    super(limitMessage(plan));
  }
}