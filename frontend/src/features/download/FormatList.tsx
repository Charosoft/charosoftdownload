import { useState } from "react";

import { formatSize, splitFormats } from "./formatSelection";
import type { MediaFormat } from "./types";

import "./formats.css";

type FormatListProps = {
  videoFormats: MediaFormat[];
  audioFormats: MediaFormat[];
  downloadingKey: string | null;
  downloadProgress: number;
  onDownload: (format: MediaFormat) => void;
};

/** Petit libellé sous le nom du format : « Vidéo HD », « Vidéo » ou « Audio ». */
function formatLabel(format: MediaFormat) {
  if (format.type === "audio") return "Audio";

  const height = parseInt(format.quality, 10);

  return Number.isFinite(height) && height >= 720 ? "Vidéo HD" : "Vidéo";
}

function FormatCard({
  format,
  downloadingKey,
  downloadProgress,
  onDownload,
}: Omit<FormatListProps, "videoFormats" | "audioFormats"> & {
  format: MediaFormat;
}) {
  const key = `${format.type}-${format.formatId}`;
  const isDownloading = downloadingKey === key;
  const size = formatSize(format.filesize ?? format.filesizeApprox);

  return (
    <div className="format">
      <div className="format-top">
        <span className="format-name">{format.format}</span>
        <span className="format-quality">{format.quality}</span>
      </div>

      <div className="format-size">
        {formatLabel(format)}
        {size ? ` · ≈ ${size}` : ""}
      </div>

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
}: FormatListProps) {
  const [showAll, setShowAll] = useState(false);

  const { featured, others } = splitFormats(videoFormats, audioFormats);

  const card = (format: MediaFormat) => (
    <FormatCard
      key={`${format.type}-${format.formatId}`}
      format={format}
      downloadingKey={downloadingKey}
      downloadProgress={downloadProgress}
      onDownload={onDownload}
    />
  );

  return (
    <>
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
