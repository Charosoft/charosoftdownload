export interface MediaFormat {
  formatId: string;
  format: string;
  quality: string;
  type: "video" | "audio";
  extension: string;
  hasAudio: boolean;
}

export interface MediaInfo {
  url: string;
  source: string;
  title: string;
  thumbnail: string | null;
  duration: number | null;
  formats: MediaFormat[];
}

export interface AnalyzeResponse {
  success: boolean;
  message?: string;
  data?: MediaInfo;
}

export type Notice = {
  type: "" | "success" | "error";
  message: string;
};
