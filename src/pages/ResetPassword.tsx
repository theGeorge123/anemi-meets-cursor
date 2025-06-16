import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../supabaseClient";
import FormStatus from "../components/FormStatus";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ResetPassword = () => {
  const { t } = useTranslation();
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
      setMessage(t("resetPassword.errorShort"));
      setStatus("error");
      return;
    }
    if (password !== confirm) {
      setMessage(t("resetPassword.errorMismatch"));
      setStatus("error");
      return;
    }
    if (!accessToken) {
      setMessage(t("resetPassword.errorNoToken"));
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
      setMessage(t("resetPassword.errorSession"));
      setStatus("error");
      return;
    }
    // Now update the password
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setMessage(t("resetPassword.errorUpdate"));
      setStatus("error");
      return;
    }
    setStatus("success");
    setMessage(t("resetPassword.success"));
    setTimeout(() => navigate("/login"), 2500);
  };

  return (
    <main className="max-w-md mx-auto px-2 sm:px-0 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-primary-700 mb-6 text-center">
        {t("resetPassword.title")}
      </h1>
      <div className="card bg-white rounded-xl shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-4 flex flex-col justify-between mt-2">
          <div>
            <label htmlFor="new-password" className="block text-lg font-medium text-gray-700 mb-2">
              <span className="text-2xl">🔒</span>{" "}
              {t("resetPassword.newPassword")}
            </label>
            <input
              type="password"
              id="new-password"
              className="w-full p-3 rounded-xl border-2 border-gray-200 mb-4 text-base"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder={t("resetPassword.newPassword")}
              autoFocus
              autoComplete="new-password"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-lg font-medium text-gray-700 mb-2">
              <span className="text-2xl">🔒</span>{" "}
              {t("resetPassword.repeatPassword")}
            </label>
            <input
              type="password"
              id="confirm-password"
              className="w-full p-3 rounded-xl border-2 border-gray-200 mb-4 text-base"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              placeholder={t("resetPassword.repeatPassword")}
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
              ? t("resetPassword.working")
              : t("resetPassword.setPassword")}
          </button>
        </form>
      </div>
    </main>
  );
};

export default ResetPassword; 