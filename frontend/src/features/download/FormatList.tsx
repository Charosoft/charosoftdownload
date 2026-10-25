import { useState } from "react";

import { useAuth } from "../auth/useAuth";
import { formatSize, splitFormats } from "./formatSelection";
import type { MediaFormat, MediaInfo } from "./types";

import "./formats.css";

type FormatListProps = {
  videoFormats: MediaFormat[];
  audioFormats: MediaFormat[];
  downloadingKey: string | null;
  downloadProgress: number;
  onDownload: (format: MediaFormat) => void;
  limits?: MediaInfo["limits"];
};

/** Petit libellé sous le nom du format : « Vidéo HD », « Vidéo » ou « Audio ». */
function formatLabel(format: MediaFormat) {
  if (format.type === "audio") return "Audio";

  const height = parseInt(format.quality, 10);

  return Number.isFinite(height) && height >= 720 ? "Vidéo HD" : "Vidéo";
}

function limitLabel(bytes: number): string {
  return bytes >= 1073741824
    ? `${Number((bytes / 1073741824).toFixed(1))} Go`
    : `${Math.round(bytes / 1048576)} Mo`;
}

function FormatCard({
  format,
  downloadingKey,
  downloadProgress,
  onDownload,
  limits,
}: Omit<FormatListProps, "videoFormats" | "audioFormats"> & {
  format: MediaFormat;
}) {
  const { user } = useAuth();

  const key = `${format.type}-${format.formatId}`;
  const isDownloading = downloadingKey === key;
  const bytes = format.filesize ?? format.filesizeApprox;
  const size = formatSize(bytes);

  // Limite qui s'applique à la personne en ce moment.
  // Premium : aucune limite de taille.
  const cap =
    !limits || user?.plan === "premium"
      ? null
      : user
        ? limits.free
        : limits.anonymous;
  const tooBig = cap !== null && bytes !== null && bytes > cap;

  return (
    <div className="format">
      <div className="format-top">
        <span className="format-name">{format.format}</span>
        <span className="format-quality">{format.quality}</span>
      </div>

      <div className="format-size">
        {formatLabel(format)}
        {size ? ` · ${size}` : ""}
      </div>

      {tooBig && !user && (
        <a className="download-btn locked" href="/login">
          🔒 Connecte-toi pour ce fichier
        </a>
      )}

      {tooBig && user && (
        <button type="button" className="download-btn locked" disabled>
          Réservé Premium
        </button>
      )}

      {!tooBig && (
        <button
          type="button"
          className={isDownloading ? "download-btn busy" : "download-btn"}
          disabled={!!downloadingKey}
          onClick={() => onDownload(format)}
        >
          {isDownloading
            ? downloadProgress < 100
              ? `Téléchargement ${downloadProgress}%`
              : "Terminé ✓"
            : "Télécharger"}
        </button>
      )}
    </div>
  );
}

/**
 * Liste des formats : les plus utiles sont visibles directement, les autres
 * (4K, WEBM, qualités intermédiaires…) s'ouvrent avec un bouton.
 */
export default function FormatList({
  videoFormats,
  audioFormats,
  downloadingKey,
  downloadProgress,
  onDownload,
  limits,
}: FormatListProps) {
  const { user } = useAuth();
  const [showAll, setShowAll] = useState(false);

  const { featured, others } = splitFormats(videoFormats, audioFormats);

  const card = (format: MediaFormat) => (
    <FormatCard
      key={`${format.type}-${format.formatId}`}
      format={format}
      downloadingKey={downloadingKey}
      downloadProgress={downloadProgress}
      onDownload={onDownload}
      limits={limits}
    />
  );

  return (
    <>
      {!user && limits && (
        <p className="limit-hint">
          Visiteur : fichiers jusqu'à {limitLabel(limits.anonymous)}, avec une
          pub. <a href="/login">Connecte-toi</a> pour aller jusqu'à{" "}
          {limitLabel(limits.free)}.
        </p>
      )}

      {user && user.plan !== "premium" && limits && (
        <p className="limit-hint">
          Compte gratuit : fichiers jusqu'à {limitLabel(limits.free)}, avec une
          pub. Le Premium enlève la limite et la pub.
        </p>
      )}

      <div className="formats">{featured.map(card)}</div>

      {others.length > 0 && (
        <>
          <button
            type="button"
            className="more-formats-btn"
            aria-expanded={showAll}
            onClick={() => setShowAll(!showAll)}
          >
            {showAll
              ? "Masquer les autres formats"
              : `Voir les autres formats (${others.length})`}
          </button>

          {showAll && <div className="formats formats-more">{others.map(card)}</div>}
        </>
      )}
    </>
  );
}