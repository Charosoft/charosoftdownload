/* =========================================================
   FONCTION : FORMATTER LA DURÉE
   Exemple : 73 secondes → 1:13
   ========================================================= */

export function formatDuration(
  seconds: number | null
) {
  if (
    seconds === null ||
    !Number.isFinite(seconds)
  ) {
    return "Durée inconnue";
  }

  const minutes = Math.floor(
    seconds / 60
  );

  const remainingSeconds =
    Math.floor(seconds % 60);

  return `${minutes}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}
