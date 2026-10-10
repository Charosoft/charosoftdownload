import { useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Download,
  Loader2,
  Play,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

/* =========================================================
   TYPES
   ========================================================= */

interface MediaFormat {
  formatId: string;
  format: string;
  quality: string;
  type: "video" | "audio";
  extension: string;
  hasAudio: boolean;
}

interface MediaInfo {
  url: string;
  source: string;
  title: string;
  thumbnail: string | null;
  duration: number | null;
  formats: MediaFormat[];
}

interface AnalyzeResponse {
  success: boolean;
  message?: string;
  data?: MediaInfo;
}

type Notice = {
  type: "" | "success" | "error";
  message: string;
};

/* =========================================================
   CONFIGURATION API
   ========================================================= */

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000";

/* =========================================================
   FONCTION : FORMATTER LA DURÉE
   Exemple : 73 secondes → 1:13
   ========================================================= */

function formatDuration(
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

/* =========================================================
   APPLICATION PRINCIPALE
   ========================================================= */

function App() {
  /* =======================================================
     ÉTATS DE L'APPLICATION
     ======================================================= */

  // URL saisie par l'utilisateur
  const [url, setUrl] = useState("");

  // Indique si l'analyse est en cours
  const [isAnalyzing, setIsAnalyzing] =
    useState(false);

  // Affiche ou masque les résultats
  const [showResult, setShowResult] =
    useState(false);// Informations du média analysé
  const [media, setMedia] =
    useState<MediaInfo | null>(null);

  // Format actuellement téléchargé
  const [downloadingKey, setDownloadingKey] =
    useState<string | null>(null);

  // Message affiché à l'utilisateur
  const [notice, setNotice] =
    useState<Notice>({
      type: "",
      message: "",
    });

  // Progression du téléchargement
  const [downloadProgress, setDownloadProgress] =
    useState(0);

  /* =======================================================
     ANALYSER UNE URL
     ======================================================= */

  const handleAnalyze = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    const value = url.trim();

    /* -------------------------------------------------------
       Vérification : URL vide
       ------------------------------------------------------- */

    if (!value) {
      setNotice({
        type: "error",
        message:
          "Veuillez coller un lien.",
      });

      return;
    }

    /* -------------------------------------------------------
       Vérification : URL valide
       ------------------------------------------------------- */

    try {
      const parsedUrl =
        new URL(value);

      if (
        ![
          "http:",
          "https:",
        ].includes(
          parsedUrl.protocol
        )
      ) {
        throw new Error();
      }
    } catch {
      setNotice({
        type: "error",
        message:
          "Veuillez fournir une URL valide.",
      });

      return;
    }

    /* -------------------------------------------------------
       Préparation de l'analyse
       ------------------------------------------------------- */

    setNotice({
      type: "",
      message: "",
    });

    setShowResult(false);
    setMedia(null);
    setIsAnalyzing(true);

    /* -------------------------------------------------------
       Appel API /api/analyze
       ------------------------------------------------------- */

    try {
      const response =
        await fetch(
          `${API_URL}/api/analyze`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              url: value,
            }),
          }
        );

      const result =
        (await response.json()) as AnalyzeResponse;

      /* -----------------------------------------------------
         Vérification de la réponse
         ----------------------------------------------------- */

      if (
        !response.ok ||
        !result.success ||
        !result.data
      ) {
        throw new Error(
          result.message ||
            "Impossible d'analyser ce lien."
        );
      }

      /* -----------------------------------------------------
         Enregistrement du résultat
         ----------------------------------------------------- */

      setMedia(result.data);
      setShowResult(true);

      /* -----------------------------------------------------
         Scroll automatique vers les résultats
         ----------------------------------------------------- */

      setTimeout(() => {
        document
          .getElementById(
            "resultArea"
          )
          ?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
      }, 100);
    } catch (error) {
      setShowResult(false);

      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue pendant l'analyse.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  /* =======================================================
     TÉLÉCHARGER UN FORMAT
     ======================================================= */
     /**
 * Détermine le type MIME réel du fichier.
 *
 * Cela permet au navigateur de reconnaître correctement
 * le fichier téléchargé selon son extension.
 */
function getMimeType(
  extension: string,
  type: "video" | "audio"
): string {
  const normalizedExtension =
    extension.toLowerCase();

  switch (normalizedExtension) {
    case "mp4":
      return "video/mp4";

    case "webm":
      return "video/webm";

    case "mp3":
      return "audio/mpeg";

    case "m4a":
      return "audio/mp4";

    default:
      return type === "audio"
        ? "audio/*"
        : "video/*";
  }
}

  const handleDownload = async (
    format: MediaFormat
  ) => {
    /* -------------------------------------------------------
       Vérification : média disponible
       ------------------------------------------------------- */

    if (!media) {
      return;
    }

    /* -------------------------------------------------------
       Identifiant unique du bouton de téléchargement
       ------------------------------------------------------- */

    const downloadKey =
      `${format.type}-${format.formatId}`;

    try {
      /* -----------------------------------------------------
         État téléchargement
         ----------------------------------------------------- */

      setDownloadingKey(
        downloadKey
      );

      setDownloadProgress(
        0
      );

      setNotice({
        type: "",
        message: "",
      });

      /* =====================================================
         APPEL API /api/download
         ===================================================== */

      const response =
        await fetch(
          `${API_URL}/api/download`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            /* -------------------------------------------------
               Données envoyées au backend
               ------------------------------------------------- */

            body: JSON.stringify({
              url: media.url,

              // Titre du média
              // utilisé par le backend pour
              // créer le nom du fichier.
              title: media.title,

              type:
                format.type,

              extension:
                format.extension,

              quality:
                format.quality,

              formatId:
                format.formatId,

              hasAudio:
                format.hasAudio,
            }),
          }
        );

      /* =====================================================
         ERREUR HTTP CLASSIQUE
         ===================================================== */

      if (!response.ok) {
        let message =
          "Le téléchargement a échoué.";

        try {
          const data =
            await response.json();

          if (
            data?.message
          ) {
            message =
              data.message;
          }
        } catch {
          // Réponse non JSON.
        }

        throw new Error(
          message
        );
      }

      /* =====================================================
         VÉRIFICATION DU STREAM
         ===================================================== */

      if (!response.body) {
        throw new Error(
          "Le serveur n'a pas retourné de flux."
        );
      }

      /* =====================================================
         LECTEUR DU STREAM
         ===================================================== */

      const reader =
        response.body.getReader();

      /* =====================================================
         BUFFER DU PROTOCOLE PERSONNALISÉ
         ===================================================== */

      let buffer =
        new Uint8Array(0);

      /* =====================================================
         MORCEAUX DU FICHIER
         ===================================================== */

      const fileChunks:
        Uint8Array[] = [];

      /* =====================================================
         INFORMATIONS FICHIER
         ===================================================== */

      let fileName =
        `charosoft-download.${format.extension}`;

      let fileSize = 0;

      let receivedBytes = 0;

      let downloadFinished =
        false;

      /* =====================================================
         TEXT DECODER
         ===================================================== */

      const decoder =
        new TextDecoder();

      /* =====================================================
         FONCTION : AJOUTER DES DONNÉES AU BUFFER
         ===================================================== */

      const appendBuffer = (
        current: Uint8Array,
        incoming: Uint8Array
      ) => {
        const result =
          new Uint8Array(
            current.length +
              incoming.length
          );

        result.set(
          current,
          0
        );

        result.set(
          incoming,
          current.length
        );

        return result;
      };

      /* =====================================================
         MESSAGE D'INFORMATION
         ===================================================== */

      setNotice({
        type: "",
        message:
          "Téléchargement en cours...",
      });

      /* =====================================================
         LECTURE DU PROTOCOLE BACKEND
         ===================================================== */

      while (
        !downloadFinished
      ) {
        const {
          value,
          done,
        } =
          await reader.read();

        /* ---------------------------------------------------
           Fin du flux
           --------------------------------------------------- */

        if (done) {
          break;
        }

        if (!value) {
          continue;
        }

        /* ---------------------------------------------------
           Ajout des nouvelles données
           --------------------------------------------------- */

        buffer =
          appendBuffer(
            buffer,
            value
          );

        /* ===================================================
           LECTURE DES FRAMES
           =================================================== */

        while (
          buffer.length >= 5
        ) {
          /* -------------------------------------------------
             Lecture de la longueur du frame
             ------------------------------------------------- */

          const view =
            new DataView(
              buffer.buffer,
              buffer.byteOffset,
              buffer.byteLength
            );

          const payloadLength =
            view.getUint32(
              0
            );

          /* -------------------------------------------------
             Taille totale du frame
             ------------------------------------------------- */

          const frameLength =
            4 +
            payloadLength;

          /* -------------------------------------------------
             Frame incomplet :
             on attend les prochaines données.
             ------------------------------------------------- */

          if (
            buffer.length <
            frameLength
          ) {
            break;
          }

          /* -------------------------------------------------
             Type du frame
             ------------------------------------------------- */

          const type =
            buffer[4];

          /* -------------------------------------------------
             Payload du frame
             ------------------------------------------------- */

          const payload =
            buffer.slice(
              5,
              frameLength
            );

          /* -------------------------------------------------
             Suppression du frame du buffer
             ------------------------------------------------- */

          buffer =
            buffer.slice(
              frameLength
            );

          /* =================================================
             TYPE 0 : PROGRESSION
             ================================================= */

          if (
            type === 0
          ) {
            const text =
              decoder.decode(
                payload
              );

            const progress =
              Number.parseInt(
                text,
                10
              );

            if (
              Number.isFinite(
                progress
              )
            ) {
              setDownloadProgress(
                Math.max(
                  0,
                  Math.min(
                    100,
                    progress
                  )
                )
              );
            }
          }

          /* =================================================
             TYPE 1 : INFORMATIONS DU FICHIER
             ================================================= */

          if (
            type === 1
          ) {
            const text =
              decoder.decode(
                payload
              );

            try {
              const info =
                JSON.parse(
                  text
                ) as {
                  fileName?: string;
                  fileSize?: number;
                };

              /* -----------------------------------------------
                 Nom réel du fichier envoyé par le backend
                 ----------------------------------------------- */

              if (
                typeof info.fileName ===
                "string"
              ) {
                fileName =
                  info.fileName;
              }

              /* -----------------------------------------------
                 Taille du fichier
                 ----------------------------------------------- */

              if (
                typeof info.fileSize ===
                "number"
              ) {
                fileSize =
                  info.fileSize;
              }

              /* -----------------------------------------------
                 Le serveur a terminé la préparation.
                 On passe au minimum à 94%.
                 ----------------------------------------------- */

              setDownloadProgress(
                (current) =>
                  Math.max(
                    current,
                    94
                  )
              );
            } catch {
              // Informations fichier invalides.
            }
          }

          /* =================================================
             TYPE 2 : MORCEAU DU FICHIER
             ================================================= */

          if (
            type === 2
          ) {
            /* -----------------------------------------------
               Stockage du morceau reçu
               ----------------------------------------------- */

            fileChunks.push(
              payload
            );

            receivedBytes +=
              payload.length;

            /* -----------------------------------------------
               Progression du transfert
               ----------------------------------------------- */

            if (
              fileSize > 0
            ) {
              const transferProgress =
                receivedBytes /
                fileSize;

              const progress =
                Math.min(
                  99,
                  94 +
                    Math.round(
                      transferProgress *
                        5
                    )
                );

              setDownloadProgress(
                (current) =>
                  Math.max(
                    current,
                    progress
                  )
              );
            }
          }

          /* =================================================
             TYPE 4 : ERREUR BACKEND
             
             IMPORTANT :
             Le backend utilise ce type lorsqu'une erreur
             survient APRÈS l'envoi des headers HTTP.
             ================================================= */

          if (
            type === 4
          ) {
            /* -----------------------------------------------
               Transformation du payload en texte
               ----------------------------------------------- */

            const errorText =
              decoder.decode(
                payload
              );

            let message =
              "Le téléchargement a échoué.";

            /* -----------------------------------------------
               Lecture du JSON d'erreur
               ----------------------------------------------- */

            try {
              const errorData =
                JSON.parse(
                  errorText
                ) as {
                  message?: string;
                };

              if (
                typeof errorData.message ===
                "string" &&
                errorData.message.trim()
              ) {
                message =
                  errorData.message;
              }
            } catch {
              // Message d'erreur par défaut.
            }

            /* -----------------------------------------------
               On arrête la lecture du téléchargement
               ----------------------------------------------- */

            downloadFinished =
              true;

            /* -----------------------------------------------
               On transmet l'erreur à notre catch principal
               ----------------------------------------------- */

            throw new Error(
              message
            );
          }

          /* =================================================
             TYPE 3 : TÉLÉCHARGEMENT TERMINÉ
             ================================================= */

          if (
            type === 3
          ) {
            downloadFinished =
              true;

            setDownloadProgress(
              100
            );
          }
        }
      }

      /* =====================================================
         VÉRIFICATION : FICHIER REÇU
         ===================================================== */

      if (
        fileChunks.length === 0
      ) {
        throw new Error(
          "Aucun fichier n'a été reçu."
        );
      }

      /* =====================================================
         CRÉATION DU BLOB
         ===================================================== */

      const chunks =
        fileChunks.map(
          (chunk) => {
            const arrayBuffer =
              new ArrayBuffer(
                chunk.byteLength
              );

            new Uint8Array(
              arrayBuffer
            ).set(
              chunk
            );

            return arrayBuffer;
          }
        );

      /* =====================================================
         TYPE MIME
         
         Pour l'instant :
         - audio → MP3
         - vidéo → MP4
         
         On améliorera cela à l'étape suivante pour gérer
         correctement MP4 / MP3 / M4A / WebM.
         ===================================================== */

      /*
 * Création du fichier final.
 *
 * Le MIME est maintenant déterminé
 * automatiquement selon le format choisi.
 */
      const blob = new Blob(
        chunks,
        {
          type: getMimeType(
            format.extension,
            format.type
          ),
        }
      );

      /* =====================================================
         CRÉATION DU LIEN DE TÉLÉCHARGEMENT
         ===================================================== */

      const objectUrl =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href =
        objectUrl;

      /* -----------------------------------------------------
         Nom fourni par le backend
         Exemple :
         CharosoftDownload - Ma vidéo.mp4
         ----------------------------------------------------- */

      link.download =
        fileName;

      link.style.display =
        "none";

      document.body.appendChild(
        link
      );

      /* -----------------------------------------------------
         Déclenchement automatique
         ----------------------------------------------------- */

      link.click();

      link.remove();

      /* -----------------------------------------------------
         Libération de la mémoire
         ----------------------------------------------------- */

      URL.revokeObjectURL(
        objectUrl
      );

      /* =====================================================
         SUCCÈS
         ===================================================== */

      setDownloadProgress(
        100
      );

      setNotice({
        type: "success",
        message:
          "Téléchargement terminé.",
      });

      /* -----------------------------------------------------
         Masquer le message après 1,8 seconde
         ----------------------------------------------------- */

      setTimeout(() => {
        setNotice({
          type: "",
          message: "",
        });
      }, 1800);
    } catch (error) {
      /* =====================================================
         ERREUR FRONTEND
         ===================================================== */

      console.error(
        "❌ Téléchargement frontend :",
        error
      );

      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Le téléchargement a échoué.",
      });

      setDownloadProgress(
        0
      );
    } finally {
      /* =====================================================
         LIBÉRATION DU BOUTON
         ===================================================== */

      setTimeout(() => {
        setDownloadingKey(
          null
        );
      }, 800);
    }
  };

  /* =======================================================
     FILTRAGE DES FORMATS
     ======================================================= */

  const videoFormats =
    media?.formats.filter(
      (format) =>
        format.type === "video"
    ) ?? [];

  const audioFormats =
    media?.formats.filter(
      (format) =>
        format.type === "audio"
    ) ?? [];

  /* =======================================================
     INTERFACE
     ======================================================= */

  return (
    <div className="app">
      {/* =====================================
          MAIN
          ===================================== */}

      <main id="home">

        {/* ===================================
            HERO
            =================================== */}

        <section className="hero">
          <div className="container hero-content">

            {/* ---------------------------------
                EYEBROW
                --------------------------------- */}

            <div className="eyebrow">
              SIMPLE · RAPIDE · TECHNIQUE
            </div>

            {/* ---------------------------------
                TITRE PRINCIPAL
                --------------------------------- */}

            <h1>
              Télécharge.
              <br />

              <span>
                Simplement.
              </span>
            </h1>

            {/* ---------------------------------
                DESCRIPTION
                --------------------------------- */}

            <p className="hero-subtitle">
              Collez le lien de votre média,
              analysez-le et choisissez le
              format qui vous convient.
            </p>

            {/* ===============================
                FORMULAIRE URL
                =============================== */}

            <form
              className="url-box"
              onSubmit={
                handleAnalyze
              }
            >
              <div className="url-input-wrapper">
                <ArrowUpRight
                  size={21}
                />

                <input
                  type="url"
                  value={url}
                  onChange={(event) =>
                    setUrl(
                      event.target.value
                    )
                  }
                  placeholder="Collez votre lien ici..."
                  disabled={
                    isAnalyzing
                  }
                  autoComplete="off"
                />
              </div>

              <button
                type="submit"
                className="analyze-button"
                disabled={
                  isAnalyzing
                }
              >
                {isAnalyzing ? (
                  <>
                    <Loader2
                      className="spin"
                      size={18}
                    />

                    ANALYSE...
                  </>
                ) : (
                  "ANALYSER"
                )}
              </button>
            </form>

            {/* ---------------------------------
                FORMATS SUPPORTÉS
                --------------------------------- */}

            <div className="supported">
              Formats disponibles selon la
              source :{" "}

              <strong>
                MP4 · MP3 · HD · Audio
              </strong>
            </div>

            {/* ---------------------------------
                CHARGEMENT ANALYSE
                --------------------------------- */}

            {isAnalyzing && (
              <div className="analysis-loading">
                <Loader2
                  className="spin"
                  size={20}
                />

                Analyse du média en cours...
              </div>
            )}

            {/* =================================
                RESULTAT DE L'ANALYSE
                ================================= */}

            {showResult &&
              media && (
                <section
                  id="resultArea"
                  className="result-area"
                >

                  {/* =============================
                      APERÇU DU MÉDIA
                      ============================= */}

                  <div className="result-card">
                    <div className="media-preview">

                      {/* -----------------------------
                          MINIATURE
                          ----------------------------- */}

                      {media.thumbnail ? (
                        <img
                          src={
                            media.thumbnail
                          }
                          alt={
                            media.title
                          }
                        />
                      ) : (
                        <div className="thumbnail-placeholder">
                          <Play
                            size={30}
                            fill="currentColor"
                          />
                        </div>
                      )}

                      {/* -----------------------------
                          BOUTON PLAY
                          ----------------------------- */}

                      <div className="play-overlay">
                        <Play
                          size={26}
                          fill="currentColor"
                        />
                      </div>

                      {/* -----------------------------
                          DURÉE
                          ----------------------------- */}

                      {media.duration !==
                        null && (
                        <div className="duration">
                          {formatDuration(
                            media.duration
                          )}
                        </div>
                      )}
                    </div>

                    {/* =============================
                        INFORMATIONS MÉDIA
                        ============================= */}

                    <div className="media-info">
                      <div className="result-label">
                        <CheckCircle2
                          size={16}
                        />

                        Analyse terminée
                      </div>

                      <h2>
                        {media.title}
                      </h2>

                      <p className="source">
                        {media.source}
                      </p>

                      <p className="media-meta">
                        <Clock3
                          size={15}
                        />

                        {formatDuration(
                          media.duration
                        )}
                      </p>
                    </div>
                  </div>

                  {/* =============================
                      SECTION FORMATS
                      ============================= */}

                  <div className="formats-section">

                    {/* ===========================
                        FORMATS VIDÉO
                        =========================== */}

                    {videoFormats.length >
                      0 && (
                      <>
                        <h3>
                          Formats vidéo
                        </h3>

                        <div className="formats-grid">
                          {videoFormats.map(
                            (format) => {
                              const key =
                                `${format.type}-${format.formatId}`;

                              const isDownloading =
                                downloadingKey ===
                                key;

                              return (
                                <div
                                  className="format-card"
                                  key={key}
                                >
                                  <div>
                                    <span className="format-type">
                                      {
                                        format.format
                                      }
                                    </span>

                                    <strong>
                                      {
                                        format.quality
                                      }
                                    </strong>
                                  </div>

                                  {/* -----------------
                                      BOUTON DOWNLOAD
                                      ----------------- */}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDownload(
                                        format
                                      )
                                    }
                                    disabled={
                                      !!downloadingKey
                                    }
                                  >
                                    {isDownloading ? (
                                      <>
                                        <Loader2
                                          size={16}
                                          className="spin"
                                        />

                                        {downloadProgress < 100
                                          ? `Téléchargement ${downloadProgress}%`
                                          : "Terminé ✓"}
                                      </>
                                    ) : (
                                      <>
                                        <Download
                                          size={16}
                                        />

                                        Télécharger
                                      </>
                                    )}
                                  </button>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </>
                    )}

                    {/* ===========================
                        FORMATS AUDIO
                        =========================== */}

                    {audioFormats.length >
                      0 && (
                      <>
                        <h3 className="audio-heading">
                          Formats audio
                        </h3>

                        <div className="formats-grid">
                          {audioFormats.map(
                            (format) => {
                              const key =
                                `${format.type}-${format.formatId}`;

                              const isDownloading =
                                downloadingKey ===
                                key;

                              return (
                                <div
                                  className="format-card"
                                  key={key}
                                >
                                  <div>
                                    <span className="format-type">
                                      {
                                        format.format
                                      }
                                    </span>

                                    <strong>
                                      Audio
                                    </strong>
                                  </div>

                                  {/* -----------------
                                      BOUTON DOWNLOAD
                                      ----------------- */}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDownload(
                                        format
                                      )
                                    }
                                    disabled={
                                      !!downloadingKey
                                    }
                                  >
                                    {isDownloading ? (
                                      <>
                                        <Loader2
                                          size={16}
                                          className="spin"
                                        />

                                        {downloadProgress < 100
                                          ? `Téléchargement ${downloadProgress}%`
                                          : "Terminé ✓"}
                                      </>
                                    ) : (
                                      <>
                                        <Download
                                          size={16}
                                        />

                                        Télécharger
                                      </>
                                    )}
                                  </button>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </section>
              )}

            {/* =================================
                NOTIFICATION / MESSAGE
                ================================= */}

            {notice.message && (
              <div
                className={`notice ${notice.type}`}
              >
                {notice.type ===
                "success" ? (
                  <CheckCircle2
                    size={18}
                  />
                ) : (
                  <ShieldCheck
                    size={18}
                  />
                )}

                <span>
                  {notice.message}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* =====================================
            SECTION : POURQUOI CHAROSOFT
            ===================================== */}

        <section
          className="features"
          id="about"
        >
          <div className="container">

            {/* ---------------------------------
                TITRE SECTION
                --------------------------------- */}

            <div className="section-heading">
              <div className="eyebrow">
                POURQUOI CHAROSOFT DOWNLOAD
              </div>

              <h2>
                Un outil pensé pour aller
                droit au but.
              </h2>

              <p>
                Une interface claire,
                rapide et sans étapes
                inutiles.
              </p>
            </div>

            {/* ---------------------------------
                CARTES FONCTIONNALITÉS
                --------------------------------- */}

            <div className="feature-grid">

              {/* SIMPLE */}
              <div className="feature-card">
                <Sparkles
                  size={25}
                />

                <h3>
                  Simple
                </h3>

                <p>
                  Une seule action
                  principale : collez votre
                  lien et analysez.
                </p>
              </div>

              {/* RAPIDE */}
              <div className="feature-card">
                <Zap size={25} />

                <h3>
                  Rapide
                </h3>

                <p>
                  Une architecture pensée
                  pour analyser rapidement
                  les médias disponibles.
                </p>
              </div>

              {/* MAÎTRISÉ */}
              <div className="feature-card">
                <ShieldCheck
                  size={25}
                />

                <h3>
                  Maîtrisé
                </h3>

                <p>
                  Validation, limitation
                  des requêtes et traitement
                  contrôlé côté serveur.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================
            SECTION : COMMENT ÇA MARCHE
            ===================================== */}

        <section
          className="how"
          id="how"
        >
          <div className="container">

            {/* ---------------------------------
                TITRE SECTION
                --------------------------------- */}

            <div className="section-heading">
              <div className="eyebrow">
                COMMENT ÇA MARCHE
              </div>

              <h2>
                Trois étapes. C'est tout.
              </h2>
            </div>

            {/* ---------------------------------
                ÉTAPES
                --------------------------------- */}

            <div className="steps">

              {/* ÉTAPE 01 */}
              <div className="step">
                <span>
                  01
                </span>

                <div>
                  <strong>
                    LIEN
                  </strong>

                  <p>
                    Collez l'URL de votre
                    média.
                  </p>
                </div>
              </div>

              {/* ÉTAPE 02 */}
              <div className="step">
                <span>
                  02
                </span>

                <div>
                  <strong>
                    ANALYSE
                  </strong>

                  <p>
                    Charosoft détecte les
                    formats disponibles.
                  </p>
                </div>
              </div>

              {/* ÉTAPE 03 */}
              <div className="step">
                <span>
                  03
                </span>

                <div>
                  <strong>
                    TÉLÉCHARGEMENT
                  </strong>

                  <p>
                    Choisissez le format qui
                    vous convient.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      </div>
              );
}

export default App;