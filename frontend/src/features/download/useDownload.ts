import { useState } from "react";
import type { FormEvent } from "react";
import { API_URL } from "../../lib/api";
import type { MediaFormat, MediaInfo, AnalyzeResponse, Notice } from "./types";

/**
 * Toute la logique de la page d'accueil : analyse d'un lien et téléchargement.
 * (Code déplacé tel quel depuis l'ancien App.tsx, sans modification.)
 */
export function useDownload() {

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

  return {
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
  };
}
