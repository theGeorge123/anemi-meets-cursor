import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import LoadingIndicator from "../components/LoadingIndicator";
import FormStatus from "../components/FormStatus";
import ErrorBoundary from "../components/ErrorBoundary";

const UPDATES_EMAIL_KEY = "anemi-updates-email";

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Prefill email if saved
    const savedEmail = localStorage.getItem(UPDATES_EMAIL_KEY);
    if (savedEmail) {
      setFormData((prev) => ({ ...prev, email: savedEmail }));
    }
  }, []);

  useEffect(() => {
    const viewport = document.querySelector("meta[name=viewport]");
    if (viewport) {
      const content = viewport.getAttribute("content");
      if (content && !content.includes("maximum-scale")) {
        viewport.setAttribute("content", content + ", maximum-scale=1.0");
      }
    }
  }, []);

  interface AuthError {
    code?: string;
    message?: string;
  }
  function normalizeAuthError(t: TFunction, error: AuthError) {
    let msg = t("error_generic");
    const code = error.code || "";
    switch (code) {
      case "user_not_found":
        msg = t("login.error_user_not_found", "Can't find that email. Did you type it right? 🕵️‍♂️");
        break;
      case "invalid_login_credentials":
        msg = t("login.error_invalid_password", "That combo doesn't look right. Try again! 🤔");
        break;
      case "email_address_invalid":
      case "invalid_email":
        msg = t("login.error_invalid_email", "That email looks a bit off. Double-check it! 🧐");
        break;
      case "user_banned":
        msg = t("login.error_user_banned", "This account is blocked. Need help? Contact us! 🚫");
        break;
      case "email_not_confirmed":
        msg = t("login.error_email_not_confirmed", "Check your inbox to confirm your email first! 📧");
        break;
      case "over_email_send_rate_limit":
      case "over_request_rate_limit":
        msg = t("login.errorRateLimit", "Whoa, slow down! Too many tries. Wait a sec and try again. 🐢");
        break;
      default:
        const errMsg = error.message?.toLowerCase() || "";
        if (errMsg.includes("invalid login credentials")) {
          msg = t("login.error_invalid_password", "That combo doesn't look right. Try again! 🤔");
        } else if (errMsg.includes("user not found")) {
          msg = t("login.error_user_not_found", "Can't find that email. Did you type it right? 🕵️‍♂️");
        } else if (errMsg.includes("email")) {
          msg = t("login.error_invalid_email", "That email looks a bit off. Double-check it! 🧐");
        } else if (errMsg.includes("banned")) {
          msg = t("login.error_user_banned", "This account is blocked. Need help? Contact us! 🚫");
        } else if (errMsg.includes("not confirmed")) {
          msg = t("login.error_email_not_confirmed", "Check your inbox to confirm your email first! 📧");
        } else if (errMsg.includes("rate limit")) {
          msg = t("login.errorRateLimit", "Whoa, slow down! Too many tries. Wait a sec and try again. 🐢");
        }
    }
    return msg;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });
    if (error) {
      setError(normalizeAuthError(t, error));
    } else {
      navigate("/dashboard");
    }
    setLoading(false);
  };

  const handlePasswordReset = async () => {
    setResetMsg(null);
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(
      resetEmail || formData.email,
    );
    if (error) {
      setResetMsg(normalizeAuthError(t, error));
    } else {
      setResetMsg(t("reset_success"));
    }
    setResetLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) setError(normalizeAuthError(t, error));
  };

  return (
    <main className="max-w-md mx-auto px-2 sm:px-0 py-6">
      <h1 className="mobile-heading text-primary-600 mb-6 text-center">
        {t("login.title")}
      </h1>
      <div className="bg-[#fff7f3] rounded-2xl shadow p-4 sm:p-6 mb-6 text-center">
        <div className="text-2xl mb-2">👋✨</div>
        <div className="text-lg font-semibold text-primary-700 mb-1">
          {t("login.welcomeBack")}
        </div>
        <div className="text-gray-700 text-base">{t("login.welcomeDesc")}</div>
      </div>
      <form
        onSubmit={handleSubmit}
        className="space-y-5 sm:space-y-6 bg-white/90 p-4 sm:p-6 rounded-xl shadow-2xl border border-primary-100 flex flex-col justify-between"
      >
        <div>
          <label
            htmlFor="email"
            className="block mobile-text font-medium text-gray-700 mb-2"
          >
            {t("login.emailLabel")}
          </label>
          <input
            type="email"
            id="email"
            className="input-field mt-1 min-h-[48px] text-base"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            required
            autoFocus
            placeholder={t("login.emailPlaceholder")}
            inputMode="email"
            autoComplete="email"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block mobile-text font-medium text-gray-700 mb-2"
          >
            {t("login.passwordLabel")}
          </label>
          <input
            type="password"
            id="password"
            className="input-field mt-1 min-h-[48px] text-base"
            value={formData.password}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, password: e.target.value }))
            }
            required
            placeholder={t("login.passwordPlaceholder")}
            inputMode="text"
            autoComplete="current-password"
          />
          <button
            type="button"
            className="text-primary-600 underline text-xs mt-2 ml-1 hover:text-primary-800"
            onClick={() => setShowReset((v) => !v)}
          >
            {t("login.forgotPassword")}
          </button>
        </div>

        {showReset && (
          <div className="mt-2 space-y-2 bg-white/80 p-3 rounded-xl border border-primary-100">
            <input
              type="email"
              className="input-field"
              placeholder={t("login.emailPlaceholder")}
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={handlePasswordReset}
              className="btn-secondary w-full flex items-center justify-center py-2 text-base rounded-xl font-medium"
              disabled={resetLoading}
            >
              {resetLoading ? (
                <LoadingIndicator
                  size="sm"
                  label={t("common.loading")}
                  className="mr-2"
                />
              ) : null}
              {resetLoading ? t("common.loading") : t("login.forgotPassword")}
            </button>
            {resetMsg && (
              <div className="text-xs mt-1 text-green-700">{resetMsg}</div>
            )}
          </div>
        )}

        <FormStatus
          status={loading ? "loading" : error ? "error" : "idle"}
          message={error || ""}
        />

        <button
          type="submit"
          className="btn-primary w-full py-3 px-6 text-lg rounded-lg disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-primary-500"
          disabled={loading}
        >
          {t("login.loginButton")}
        </button>
      </form>

      <button
        type="button"
        onClick={handleGoogleLogin}
        className="btn-secondary w-full mt-4 py-3 px-6 text-lg rounded-lg flex justify-center"
      >
        {t("login.googleButton")}
      </button>

      <div className="text-center mt-4">
        <button
          className="text-primary-600 underline hover:text-primary-800 text-sm"
          onClick={() => navigate("/signup")}
        >
          {t("login.noAccountCta")}
        </button>
      </div>

      {error && (
        <div className="text-red-600 text-sm mt-2" aria-live="assertive">
          {error}
        </div>
      )}
    </main>
  );
};

const LoginPageWithBoundary = () => (
  <ErrorBoundary>
    <Login />
  </ErrorBoundary>
);

export default LoginPageWithBoundary;
