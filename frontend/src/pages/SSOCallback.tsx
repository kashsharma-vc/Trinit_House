import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/api";
import trinityLogo from "@/assets/trinity-house-logo.png";

// Fixed internal destinations - prevent open redirect attacks
const ALLOWED_DESTINATIONS = {
  ADMIN: "/dashboard",
  TECHNICIAN: "/technician/requests",
} as const;

export default function SSOCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Guard against duplicate execution in React 18 StrictMode
  const hasExecutedRef = useRef(false);

  useEffect(() => {
    if (hasExecutedRef.current) return;
    hasExecutedRef.current = true;

    const code = searchParams.get("code");
    const state = searchParams.get("state");

    // Clean sensitive authorization code and state from browser address bar immediately
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch {
      // Safe fallback if history API is restricted in test environments
    }

    if (!code || !state) {
      setIsLoading(false);
      setErrorMessage("Missing authorization code or state parameter from SSO launch request.");
      return;
    }

    const exchangeCode = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/setups/auth/sso/callback/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({ code, state }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Single Sign-On authentication failed.");
        }

        if (!data.token || !data.user) {
          throw new Error("Invalid session data received from authentication server.");
        }

        // Store standard Trinity Workshop session
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Determine destination exclusively from verified user role (enforce allowlist)
        const destination = data.user.is_superuser
          ? ALLOWED_DESTINATIONS.ADMIN
          : ALLOWED_DESTINATIONS.TECHNICIAN;

        navigate(destination, { replace: true });
      } catch (err: unknown) {
        setIsLoading(false);
        const message = err instanceof Error ? err.message : "An unexpected error occurred during SSO.";
        setErrorMessage(message);
      }
    };

    exchangeCode();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl text-center"
      >
        <div className="flex justify-center mb-6">
          <img src={trinityLogo} alt="Trinity Workshop" className="h-12 w-auto object-contain" />
        </div>

        {isLoading ? (
          <div className="py-8 flex flex-col items-center">
            <Loader2 className="h-10 w-10 text-emerald-400 animate-spin mb-4" />
            <h2 className="text-xl font-semibold text-slate-100">Authenticating with VibeConnect...</h2>
            <p className="text-sm text-slate-400 mt-2">
              Validating your secure launch ticket. You will be redirected shortly.
            </p>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-red-950/60 border border-red-500/30 flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-100">SSO Authentication Failed</h2>
            <p className="text-sm text-red-300/90 mt-2 mb-6 px-4">
              {errorMessage || "Unable to complete single sign-on. Please try again."}
            </p>
            <Button
              variant="outline"
              onClick={() => navigate("/login", { replace: true })}
              className="border-slate-700 hover:bg-slate-800 text-slate-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Return to Login
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
