export type Plan = "anonymous" | "free" | "premium";

const mb = (n: number) => n * 1024 * 1024;

const anonMb = () => Number(process.env.LIMIT_ANON_MB) || 50;
const userMb = () => Number(process.env.LIMIT_USER_MB) || 900;

export const MAX_DURATION =
  Number(process.env.MAX_MEDIA_DURATION_SECONDS) || 3600;

/** 900 → « 900 Mo », 2048 → « 2 Go ». */
function label(megabytes: number): string {
  return megabytes >= 1024
    ? `${Number((megabytes / 1024).toFixed(1))} Go`
    : `${megabytes} Mo`;
}

export function planOf(user?: { plan?: string } | null): Plan {
  if (!user) return "anonymous";
  return user.plan === "premium" ? "premium" : "free";
}

/** null = illimité */
export function maxBytesFor(plan: Plan): number | null {
  if (plan === "premium") return null;
  if (plan === "free") return mb(userMb());
  return mb(anonMb());
}

export function limitMessage(plan: Plan): string {
  if (plan === "anonymous") {
    return `Ce média dépasse la limite des visiteurs (${label(anonMb())}). Connecte-toi gratuitement pour télécharger jusqu'à ${label(userMb())}.`;
  }
  return `Ce média dépasse la limite du compte gratuit (${label(userMb())}). Passe en Premium pour des fichiers plus lourds, sans pub.`;
}

export class LimitExceededError extends Error {
  constructor(plan: Plan, message?: string) {
    super(message ?? limitMessage(plan));
  }
}

function durationLabel(seconds: number): string {
  if (seconds >= 3600) return `${Number((seconds / 3600).toFixed(1))} h`;
  if (seconds >= 60) return `${Math.round(seconds / 60)} min`;
  return `${seconds} s`;
}

export function durationMessage(): string {
  return `Ce média est trop long (limite : ${durationLabel(MAX_DURATION)}). Choisis un média plus court.`;
}

/** Limites exposées au frontend pour griser les formats trop lourds. */
export function publicLimits() {
  return {
    anonymous: maxBytesFor("anonymous") ?? 0,
    free: maxBytesFor("free") ?? 0,
  };
}