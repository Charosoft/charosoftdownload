import { GOOGLE_CLIENT_ID } from "../../lib/config";
import GoogleButton from "./GoogleButton";

/**
 * Bloc « Continuer avec Google » + séparateur « ou ».
 * N'affiche rien tant que VITE_GOOGLE_CLIENT_ID n'est pas défini.
 */
export default function SocialLogin({
  onError,
}: {
  onError: (message: string) => void;
}) {
  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div className="mb-6">
      <GoogleButton onError={onError} />

      <div className="mt-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted">
        <span className="h-px flex-1 bg-line" />
        ou
        <span className="h-px flex-1 bg-line" />
      </div>
    </div>
  );
}
