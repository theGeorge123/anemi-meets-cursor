import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../supabaseClient";
import FormStatus from "../components/FormStatus";

const CheckEmail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  const handleCheckConfirmed = async () => {
    setStatus("loading");
    setMessage("");
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      setStatus("error");
      setMessage(t("checkEmail.error"));
      return;
    }
    if (data?.user?.email_confirmed_at) {
      setStatus("success");
      setMessage(t("checkEmail.confirmed"));
      setTimeout(() => navigate("/dashboard"), 1800);
    } else {
      setStatus("error");
      setMessage(t("checkEmail.notConfirmed"));
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
          {t("checkEmail.title")}
        </h1>
        <p className="text-gray-700 mb-4 text-base sm:text-lg">
          {t("checkEmail.description")}
        </p>
        <button
          className="btn-secondary w-full mb-2"
          onClick={openEmailApp}
        >
          {t("checkEmail.openApp")}
        </button>
        <button
          className="btn-primary w-full"
          onClick={handleCheckConfirmed}
          disabled={status === "loading"}
        >
          {status === "loading"
            ? t("checkEmail.checking")
            : t("checkEmail.cta")}
        </button>
        <FormStatus status={status} message={message} />
        <div className="mt-6 text-xs text-gray-500">
          {t("checkEmail.notReceived")}
        </div>
      </div>
    </main>
  );
};

export default CheckEmail; 