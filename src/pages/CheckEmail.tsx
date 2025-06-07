import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../supabaseClient";
import FormStatus from "../components/FormStatus";

const CheckEmail = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  const handleCheckConfirmed = async () => {
    setStatus("loading");
    setMessage("");
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      setStatus("error");
      setMessage(i18n.language === "nl"
        ? "Kon je status niet controleren. Probeer het opnieuw."
        : "Could not check your status. Please try again.");
      return;
    }
    if (data?.user?.email_confirmed_at) {
      setStatus("success");
      setMessage(i18n.language === "nl"
        ? "Je account is bevestigd! Je wordt doorgestuurd..."
        : "Your account is confirmed! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 1800);
    } else {
      setStatus("error");
      setMessage(i18n.language === "nl"
        ? "Je account is nog niet bevestigd. Klik op de link in je e-mail!"
        : "Your account is not confirmed yet. Please click the link in your email!");
    }
  };

  const openEmailApp = () => {
    // Try to open Gmail, fallback to mailto
    window.open("https://mail.google.com", "_blank");
  };

  return (
    <main className="max-w-md mx-auto px-2 sm:px-0 py-8">
      <div className="card bg-white rounded-xl shadow-md p-6 flex flex-col items-center text-center">
        <div className="text-5xl mb-4">📬</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary-700 mb-2">
          {i18n.language === "nl"
            ? "Bevestig je e-mailadres!"
            : "Confirm your email!"}
        </h1>
        <p className="text-gray-700 mb-4 text-base sm:text-lg">
          {i18n.language === "nl"
            ? "We hebben je een e-mail gestuurd. Klik op de link in je inbox om je account te activeren."
            : "We've sent you an email. Click the link in your inbox to activate your account."}
        </p>
        <button
          className="btn-secondary w-full mb-2"
          onClick={openEmailApp}
        >
          {i18n.language === "nl"
            ? "Open je e-mail app"
            : "Open your email app"}
        </button>
        <button
          className="btn-primary w-full"
          onClick={handleCheckConfirmed}
          disabled={status === "loading"}
        >
          {status === "loading"
            ? i18n.language === "nl"
              ? "Controleren..."
              : "Checking..."
            : i18n.language === "nl"
              ? "Ik heb bevestigd!"
              : "I have confirmed!"}
        </button>
        <FormStatus status={status} message={message} />
        <div className="mt-6 text-xs text-gray-500">
          {i18n.language === "nl"
            ? "Geen mail ontvangen? Kijk in je spam of probeer opnieuw aan te melden."
            : "Didn't get the email? Check your spam or try signing up again."}
        </div>
      </div>
    </main>
  );
};

export default CheckEmail; 