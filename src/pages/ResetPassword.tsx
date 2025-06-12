import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../supabaseClient";
import FormStatus from "../components/FormStatus";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ResetPassword = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const query = useQuery();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  const accessToken = query.get("access_token") || query.get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (!password || password.length < 8) {
      setMessage(
        i18n.language === "nl"
          ? "Je wachtwoord moet minstens 8 tekens zijn. Maak er iets moois van! ✨"
          : "Password must be at least 8 characters. Make it a good one! ✨"
      );
      setStatus("error");
      return;
    }
    if (password !== confirm) {
      setMessage(
        i18n.language === "nl"
          ? "Oeps! Je wachtwoorden komen niet overeen. Probeer het nog eens. 🤔"
          : "Oops! Your passwords don't match. Try again! 🤔"
      );
      setStatus("error");
      return;
    }
    if (!accessToken) {
      setMessage(
        i18n.language === "nl"
          ? "Geen geldige reset-link gevonden. Klik opnieuw op de link in je e-mail! 📧"
          : "No valid reset link found. Please try again from your email! 📧"
      );
      setStatus("error");
      return;
    }
    setStatus("loading");
    // Set the access token for this session
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: accessToken,
    });
    if (error) {
      setMessage(
        i18n.language === "nl"
          ? "Kon je sessie niet herstellen. Probeer de link opnieuw! 🔄"
          : "Could not restore your session. Please try the link again! 🔄"
      );
      setStatus("error");
      return;
    }
    // Now update the password
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setMessage(
        i18n.language === "nl"
          ? "Wachtwoord wijzigen is niet gelukt. Probeer het nog eens! 😅"
          : "Couldn't update your password. Try again! 😅"
      );
      setStatus("error");
      return;
    }
    setStatus("success");
    setMessage(
      i18n.language === "nl"
        ? "Yes! Je wachtwoord is veranderd. Je kunt nu inloggen en weer koffie drinken ☕️🎉"
        : "Yes! Your password has been changed. You can now log in and grab a coffee ☕️🎉"
    );
    setTimeout(() => navigate("/login"), 2500);
  };

  return (
    <main className="max-w-md mx-auto px-2 sm:px-0 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-primary-700 mb-6 text-center">
        {i18n.language === "nl"
          ? "Nieuw wachtwoord instellen"
          : "Set a new password"}
      </h1>
      <div className="card bg-white rounded-xl shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-4 flex flex-col justify-between mt-2">
          <div>
            <label htmlFor="new-password" className="block text-lg font-medium text-gray-700 mb-2">
              <span className="text-2xl">🔒</span>{" "}
              {i18n.language === "nl"
                ? "Nieuw wachtwoord"
                : "New password"}
            </label>
            <input
              type="password"
              id="new-password"
              className="w-full p-3 rounded-xl border-2 border-gray-200 mb-4 text-base"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder={i18n.language === "nl" ? "Nieuw wachtwoord" : "New password"}
              autoFocus
              autoComplete="new-password"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-lg font-medium text-gray-700 mb-2">
              <span className="text-2xl">🔒</span>{" "}
              {i18n.language === "nl"
                ? "Herhaal wachtwoord"
                : "Repeat password"}
            </label>
            <input
              type="password"
              id="confirm-password"
              className="w-full p-3 rounded-xl border-2 border-gray-200 mb-4 text-base"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              placeholder={i18n.language === "nl" ? "Herhaal wachtwoord" : "Repeat password"}
              autoComplete="new-password"
            />
          </div>
          <FormStatus status={status} message={message} />
          <button
            type="submit"
            className="btn-primary w-full py-3 px-6 text-lg rounded-lg"
            disabled={status === "loading"}
          >
            {status === "loading"
              ? i18n.language === "nl"
                ? "Bezig..."
                : "Working..."
              : i18n.language === "nl"
                ? "Wachtwoord instellen"
                : "Set password"}
          </button>
        </form>
      </div>
    </main>
  );
};

export default ResetPassword; 