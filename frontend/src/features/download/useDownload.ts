import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { API_URL } from "../../lib/api";
import type { MediaFormat, MediaInfo, AnalyzeResponse, Notice } from "./types";
import { useAuth } from "../auth/useAuth";

const JOB_KEY = "charosoft_job";
const JOB_MAX_AGE = 55 * 60 * 1000;

type SavedJob = { id: string; title: string; at: number };

/** Téléchargement en cours retenu par le navigateur (survit au rechargement). */
function readSavedJob(): SavedJob | null {
  try {
    const raw = localStorage.getItem(JOB_KEY);
    if (!raw) return null;

    const job = JSON.parse(raw) as SavedJob;
    return Date.now() - job.at < JOB_MAX_AGE ? job : null;
  } catch {
    return null;
  }
}

function saveJob(job: SavedJob) {
  try {
    localStorage.setItem(JOB_KEY, JSON.stringify(job));
  } catch {
    // Stockage indisponible : le rechargement repartira de zéro.
  }
}

function clearJob() {
  try {
    localStorage.removeItem(JOB_KEY);
  } catch {
    // Stockage indisponible.
  }
}

/**
 * Toute la logique de la page d'accueil : analyse d'un lien et téléchargement.
 */
export function useDownload() {
  const { user, loading } = useAuth();

  const [adSecondsLeft, setAdSecondsLeft] = useState(0);
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [media, setMedia] = useState<MediaInfo | null>(null);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>({ type: "", message: "" });
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Titre du téléchargement repris après un rechargement de la page.
  const [resumeTitle, setResumeTitle] = useState<string | null>(null);

  // Téléchargement en cours : sert à l'annuler.
  const currentJob = useRef<{
    id: string | null;
    cancelled: boolean;
    close?: () => void;
  }>({ id: null, cancelled: false });

  // Compte à rebours de la pub : arrêtable si on annule.
  const adTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const adFinish = useRef<(() => void) | null>(null);
  const resumedOnce = useRef(false);

  /* =======================================================
     ANALYSER UNE URL
     ======================================================= */

  const handleAnalyze = async (event: FormEvent) => {
    event.preventDefault();

    const value = url.trim();

    if (!value) {
      setNotice({ type: "error", message: "Veuillez coller un lien." });
      return;
    }

    try {
      const parsedUrl = new URL(value);

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error();
      }
    } catch {
      setNotice({ type: "error", message: "Veuillez fournir une URL valide." });
      return;
    }

    setNotice({ type: "", message: "" });
    setShowResult(false);
    setMedia(null);
    setIsAnalyzing(true);

    try {
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value }),
      });

      const result = (await response.json()) as AnalyzeResponse;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || "Impossible d'analyser ce lien.");
      }

      setMedia(result.data);
      setShowResult(true);

      setTimeout(() => {
        document.getElementById("resultArea")?.scrollIntoView({
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
     PUBLICITÉ
     ======================================================= */

  const showAd = () =>
    new Promise<void>((resolve) => {
      let left = 5;
      setAdSecondsLeft(left);

      const finish = () => {
        if (adTimer.current) clearInterval(adTimer.current);
        adTimer.current = null;
        adFinish.current = null;
        setAdSecondsLeft(0);
        resolve();
      };

      adFinish.current = finish;

      adTimer.current = setInterval(() => {
        left -= 1;
        setAdSecondsLeft(left);
        if (left <= 0) finish();
      }, 1000);
    });

  /* =======================================================
     SUIVRE UN TÉLÉCHARGEMENT ET LE LIVRER
     ======================================================= */

  /** Attend la fin de la préparation (progression envoyée par le serveur). */
  const waitForJob = (jobId: string) =>
    new Promise<void>((resolve, reject) => {
      const source = new EventSource(`${API_URL}/api/download/${jobId}/events`);

      currentJob.current.close = () => {
        source.close();
        reject(new Error("CANCELLED"));
      };

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

  /** Prépare, attend la pub, puis lance le téléchargement du navigateur. */
  const deliver = async (jobId: string, adGate: Promise<void>) => {
    await waitForJob(jobId);
    await adGate;

    if (currentJob.current.cancelled) throw new Error("CANCELLED");

    setDownloadProgress(100);

    // Le navigateur télécharge directement, avec sa propre barre de progression.
    const link = document.createElement("a");
    link.href = `${API_URL}/api/download/${jobId}/file`;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();

    clearJob();

    setNotice({
      type: "success",
      message: "Téléchargement lancé, suis-le dans ton navigateur.",
    });

    setTimeout(() => {
      setNotice({ type: "", message: "" });
    }, 4000);
  };

  /* =======================================================
     ANNULER LE TÉLÉCHARGEMENT EN COURS
     ======================================================= */

  const cancelDownload = async () => {
    const job = currentJob.current;

    job.cancelled = true;
    job.close?.();
    adFinish.current?.();
    clearJob();

    if (job.id) {
      await fetch(`${API_URL}/api/download/${job.id}/cancel`, {
        method: "POST",
        credentials: "include",
      }).catch(() => undefined);
    }
  };

  /* =======================================================
     TÉLÉCHARGER UN FORMAT
     ======================================================= */

  const handleDownload = async (format: MediaFormat) => {
    if (!media) return;

    const downloadKey = `${format.type}-${format.formatId}`;

    try {
      setDownloadingKey(downloadKey);
      setDownloadProgress(0);
      setNotice({ type: "", message: "" });

      currentJob.current = { id: null, cancelled: false };

      // Pub pour les visiteurs et les comptes gratuits, pendant la préparation.
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
      currentJob.current.id = jobId;

      // Retenu pour survivre à un rechargement de la page.
      saveJob({ id: jobId, title: media.title, at: Date.now() });

      // Annulé pendant que la requête partait : on prévient le serveur.
      if (currentJob.current.cancelled) {
        await cancelDownload();
        throw new Error("CANCELLED");
      }

      setNotice({ type: "", message: "Préparation du fichier..." });

      await deliver(jobId, adGate);
    } catch (error) {
      const cancelled =
        error instanceof Error && error.message === "CANCELLED";

      if (!cancelled) console.error("❌ Téléchargement frontend :", error);

      clearJob();

      setNotice(
        cancelled
          ? { type: "", message: "Téléchargement annulé." }
          : {
              type: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "Le téléchargement a échoué.",
            }
      );

      setDownloadProgress(0);
    } finally {
      setTimeout(() => {
        setDownloadingKey(null);
      }, 800);
    }
  };

  /* =======================================================
     REPRENDRE UN TÉLÉCHARGEMENT APRÈS UN RECHARGEMENT
     ======================================================= */

  useEffect(() => {
    // On attend de connaître le compte (Premium = pas de pub).
    if (loading || resumedOnce.current) return;
    resumedOnce.current = true;

    const saved = readSavedJob();
    if (!saved) return;

    void (async () => {
      try {
        setResumeTitle(saved.title);
        setDownloadProgress(0);

        currentJob.current = { id: saved.id, cancelled: false };

        const adGate = user?.plan === "premium" ? Promise.resolve() : showAd();

        await deliver(saved.id, adGate);
      } catch (error) {
        const message = error instanceof Error ? error.message : "";

        clearJob();

        if (message !== "CANCELLED") {
          setNotice({
            type: "error",
            message:
              message === "Connexion au serveur perdue."
                ? "Ce téléchargement a expiré, relance-le."
                : message || "Le téléchargement a échoué.",
          });
        } else {
          setNotice({ type: "", message: "Téléchargement annulé." });
        }
      } finally {
        setResumeTitle(null);
        setDownloadProgress(0);
      }
    })();
    // Une seule fois, dès que la session est connue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  /* =======================================================
     FILTRAGE DES FORMATS
     ======================================================= */

  const videoFormats =
    media?.formats.filter((format) => format.type === "video") ?? [];

  const audioFormats =
    media?.formats.filter((format) => format.type === "audio") ?? [];

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
    resumeTitle,
    handleAnalyze,
    handleDownload,
    cancelDownload,
    videoFormats,
    audioFormats,
  };
}