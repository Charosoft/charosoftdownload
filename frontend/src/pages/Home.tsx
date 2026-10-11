import { useDownload } from "../features/download/useDownload";
import { formatDuration } from "../features/download/utils";
import type { MediaFormat } from "../features/download/types";

type DownloadState = ReturnType<typeof useDownload>;

/** Petit libellé sous le nom du format : « Vidéo HD », « Vidéo » ou « Audio ». */
function formatLabel(format: MediaFormat) {
  if (format.type === "audio") return "Audio";

  const height = parseInt(format.quality, 10);

  return Number.isFinite(height) && height >= 720 ? "Vidéo HD" : "Vidéo";
}

/**
 * Affichage de l'accueil.
 * Structure et classes : celles de l'index.html de référence.
 */
export function HomeView({
  url,
  setUrl,
  isAnalyzing,
  showResult,
  media,
  downloadingKey,
  notice,
  downloadProgress,
  handleAnalyze,
  handleDownload,
  videoFormats,
  audioFormats,
}: DownloadState) {
  const formats = [...videoFormats, ...audioFormats];
  const hasResult = showResult && media !== null;
  const noticeClass = notice.message
    ? `notice ${notice.type || "info"}`
    : "notice";

  return (
    <main id="home">
      <section className="hero">
        <div className="container hero-content">
          <div className="eyebrow">
            <span className="eyebrow-dot"></span>
            SIMPLE · RAPIDE · TECHNIQUE
          </div>

          <h1>
            Télécharge.
            <br />
            <span>Simplement.</span>
          </h1>

          <p className="hero-subtitle">
            Collez le lien de votre média, analysez-le et choisissez le
            format qui vous convient.
          </p>

          <form className="url-box" id="downloadForm" onSubmit={handleAnalyze}>
            <div className="url-icon">↗</div>
            <input
              id="urlInput"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="Collez votre lien ici..."
              autoComplete="off"
              required
            />
            <button
              className={isAnalyzing ? "analyze-btn loading" : "analyze-btn"}
              id="analyzeBtn"
              type="submit"
            >
              {isAnalyzing ? "ANALYSE..." : "ANALYSER"}
            </button>
          </form>

          <div className="supported">
            <strong>Formats disponibles selon la source :</strong>
            {" "}MP4 · MP3 · HD · Audio
          </div>

          {hasResult ? (
            <div className="result-area visible" id="resultArea">
              <div className="result-card">
                <div className="media-info">
                  <div className="thumbnail">
                    {media.thumbnail ? (
                      <img src={media.thumbnail} alt={media.title} />
                    ) : (
                      "▶"
                    )}
                  </div>

                  <div className="media-meta">
                    <div className="source">
                      Analyse terminée · {media.source}
                    </div>
                    <div className="media-title">{media.title}</div>
                    <div className="duration">
                      {formatDuration(media.duration)}
                    </div>
                  </div>
                </div>

                <div className="format-title">Choisissez votre format</div>

                <div className="formats">
                  {formats.map((format) => {
                    const key = `${format.type}-${format.formatId}`;
                    const isDownloading = downloadingKey === key;

                    return (
                      <div className="format" key={key}>
                        <div className="format-top">
                          <span className="format-name">{format.format}</span>
                          <span className="format-quality">
                            {format.quality}
                          </span>
                        </div>

                        <div className="format-size">
                          {formatLabel(format)}
                        </div>

                        <button
                          type="button"
                          className={
                            isDownloading
                              ? "download-btn busy"
                              : "download-btn"
                          }
                          disabled={!!downloadingKey}
                          onClick={() => handleDownload(format)}
                        >
                          {isDownloading
                            ? downloadProgress < 100
                              ? `Téléchargement ${downloadProgress}%`
                              : "Terminé ✓"
                            : "Télécharger"}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className={noticeClass} id="notice">
                  {notice.message}
                </div>
              </div>
            </div>
          ) : (
            notice.message && (
              <div className={`${noticeClass} standalone`} id="notice">
                {notice.message}
              </div>
            )
          )}
        </div>
      </section>

      <section className="section" id="about">
        <div className="container">
          <div className="section-heading">
            <div className="section-kicker">Pourquoi Charosoft Download</div>
            <h2>Un outil pensé pour aller droit au but.</h2>
            <p className="section-desc">
              Une interface claire, rapide et sans étapes inutiles.
            </p>
          </div>

          <div className="feature-grid">
            <article className="feature">
              <div className="feature-icon">↗</div>
              <h3>Simple</h3>
              <p>Un lien, une analyse, puis le choix du format disponible.</p>
            </article>

            <article className="feature">
              <div className="feature-icon">⚡</div>
              <h3>Rapide</h3>
              <p>Une expérience optimisée pour ordinateur comme pour mobile.</p>
            </article>

            <article className="feature">
              <div className="feature-icon">✓</div>
              <h3>Maîtrisé</h3>
              <p>
                Les téléchargements temporaires sont conçus pour être nettoyés
                automatiquement.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section" id="how">
        <div className="container">
          <div className="section-heading">
            <div className="section-kicker">Comment ça marche</div>
            <h2>{"Trois étapes. C'est tout."}</h2>
          </div>

          <div className="steps">
            <article className="step">
              <div className="step-number">01 — LIEN</div>
              <h3>Collez votre URL</h3>
              <p>
                Copiez le lien du média que vous êtes autorisé à télécharger.
              </p>
            </article>

            <article className="step">
              <div className="step-number">02 — ANALYSE</div>
              <h3>Analysez</h3>
              <p>Le service identifie les formats disponibles pour cette source.</p>
            </article>

            <article className="step">
              <div className="step-number">03 — TÉLÉCHARGEMENT</div>
              <h3>Choisissez</h3>
              <p>
                Sélectionnez la qualité disponible puis lancez le téléchargement.
              </p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}

/** Page d'accueil : relie la logique (useDownload) à l'affichage. */
export default function Home() {
  const download = useDownload();

  return <HomeView {...download} />;
}
