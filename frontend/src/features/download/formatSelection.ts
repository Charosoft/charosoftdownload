import type { MediaFormat } from "./types";

/** Hauteurs mises en avant : le meilleur MP4 pour 1080p, 720p et 360p. */
const FEATURED_HEIGHTS = [1080, 720, 360];

function heightOf(format: MediaFormat): number {
  return parseInt(format.quality, 10) || 0;
}

/**
 * Sépare les formats en deux groupes :
 * - « featured » : les plus utiles, visibles directement ;
 * - « others » : tous les autres, derrière « Voir les autres formats ».
 */
export function splitFormats(
  videoFormats: MediaFormat[],
  audioFormats: MediaFormat[],
) {
  const mp4 = videoFormats.filter((format) => format.extension === "mp4");

  // Source avec très peu de MP4 : on choisit parmi tous les formats vidéo.
  const pool = mp4.length >= 2 ? mp4 : videoFormats;
  const sorted = [...pool].sort((a, b) => heightOf(b) - heightOf(a));

  const featured: MediaFormat[] = [];

  for (const target of FEATURED_HEIGHTS) {
    const match = sorted.find((format) => heightOf(format) <= target);

    if (match && !featured.includes(match)) featured.push(match);
  }

  // Tous les formats dépassent 1080p : on propose au moins le plus léger.
  if (featured.length === 0 && sorted.length > 0) {
    featured.push(sorted[sorted.length - 1]);
  }

  const audio =
    audioFormats.find((format) => format.extension === "m4a") ??
    audioFormats[0];

  if (audio) featured.push(audio);

  const others = [...videoFormats, ...audioFormats].filter(
    (format) => !featured.includes(format),
  );

  return { featured, others };
}

/** 85 Mo, 1,2 Go… (null si la taille est inconnue). */
export function formatSize(bytes?: number | null): string | null {
  if (typeof bytes !== "number" || !Number.isFinite(bytes) || bytes <= 0) {
    return null;
  }

  const units = [
    ["Go", 1024 ** 3],
    ["Mo", 1024 ** 2],
    ["Ko", 1024],
  ] as const;

  for (const [unit, size] of units) {
    if (bytes >= size) {
      const value = bytes / size;
      const digits = value >= 100 || unit === "Ko" ? 0 : 1;

      return `${value.toLocaleString("fr-FR", {
        maximumFractionDigits: digits,
      })} ${unit}`;
    }
  }

  return `${bytes} o`;
}
