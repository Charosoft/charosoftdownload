import { useState } from "react";
import type { FormEvent } from "react";
import { API_URL } from "../../lib/api";
import type { MediaFormat, MediaInfo, AnalyzeResponse, Notice } from "./types";
import { useAuth } from "../auth/useAuth";
/**
 * Toute la logique de la page d'accueil : analyse d'un lien et téléchargement.
 * (Code déplacé tel quel depuis l'ancien App.tsx, sans modification.)
 */
export function useDownload() {

  /* =======================================================
     ÉTATS DE L'APPLICATION
     ======================================================= */


  const { user } = useAuth();
  const [adSecondsLeft, setAdSecondsLeft] = useState(0);

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
            credentials: "include",

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


  const showAd = () =>
    new Promise<void>((resolve) => {
      let left = 5;
      setAdSecondsLeft(left);
      const timer = setInterval(() => {
        left -= 1;
        setAdSecondsLeft(left);
        if (left <= 0) {
          clearInterval(timer);
          resolve();
        }
      }, 1000);
    });

  const handleDownload = async (format: MediaFormat) => {
    if (!media) return;

    const downloadKey = `${format.type}-${format.formatId}`;

    try {
      setDownloadingKey(downloadKey);
      setDownloadProgress(0);
      setNotice({ type: "", message: "" });

      // Les visiteurs voient la pub pendant que le serveur prépare le fichier.
      const adGate = user?.plan === "premium" ? Promise.resolve() : showAd();

      const response = await fetch(`${API_URL}/api/download`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: media.url,
          title: media.title,
          type: format.type,
          extension: format.extension,
          quality: format.quality,
          formatId: format.formatId,
          hasAudio: format.hasAudio,
        }),
      });

      const started = (await response.json().catch(() => null)) as {
        jobId?: string;
        message?: string;
      } | null;

      if (!response.ok || !started?.jobId) {
        throw new Error(started?.message || "Le téléchargement a échoué.");
      }

      const jobId = started.jobId;

      setNotice({ type: "", message: "Préparation du fichier..." });

      // Attente de la fin de la préparation (progression envoyée par le serveur).
      await new Promise<void>((resolve, reject) => {
        const source = new EventSource(
          `${API_URL}/api/download/${jobId}/events`
        );

        source.onmessage = (event) => {
          const data = JSON.parse(event.data) as {
            status: "running" | "done" | "error";
            progress: number;
            error?: string;
          };

          setDownloadProgress(Math.min(99, data.progress));

          if (data.status === "done") {
            source.close();
            resolve();
          } else if (data.status === "error") {
            source.close();
            reject(new Error(data.error || "Le téléchargement a échoué."));
          }
        };

        source.onerror = () => {
          // CLOSED = le serveur a refusé (introuvable) ; sinon reconnexion automatique.
          if (source.readyState === EventSource.CLOSED) {
            reject(new Error("Connexion au serveur perdue."));
          }
        };
      });

      // On attend la fin de la pub avant de donner le fichier.
      await adGate;

      setDownloadProgress(100);

      // Le navigateur télécharge directement, avec sa propre barre de progression.
      const link = document.createElement("a");
      link.href = `${API_URL}/api/download/${jobId}/file`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      link.remove();

      setNotice({
        type: "success",
        message: "Téléchargement lancé, suis-le dans ton navigateur.",
      });

      setTimeout(() => {
        setNotice({ type: "", message: "" });
      }, 4000);
    } catch (error) {
      console.error("❌ Téléchargement frontend :", error);

      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Le téléchargement a échoué.",
      });

      setDownloadProgress(0);
    } finally {
      setTimeout(() => {
        setDownloadingKey(null);
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
    adSecondsLeft,
    handleAnalyze,
    handleDownload,
    videoFormats,
    audioFormats,
  };
}
