import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const ChangeEmailConfirm = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  return (
    <main className="max-w-md mx-auto px-2 sm:px-0 py-8">
      <div className="card bg-white rounded-xl shadow-md p-6 flex flex-col items-center text-center">
        <div className="text-5xl mb-4">📧</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary-700 mb-2">
          {i18n.language === "nl"
            ? "Je e-mailadres is gewijzigd!"
            : "Your email address has been changed!"}
        </h1>
        <p className="text-gray-700 mb-4 text-base sm:text-lg">
          {i18n.language === "nl"
            ? "Je kunt nu inloggen met je nieuwe e-mailadres. Welkom terug bij Anemi Meets!"
            : "You can now log in with your new email address. Welcome back to Anemi Meets!"}
        </p>
        <button
          className="btn-primary w-full"
          onClick={() => navigate("/login")}
        >
          {i18n.language === "nl" ? "Inloggen" : "Log in"}
        </button>
      </div>
    </main>
  );
};

export default ChangeEmailConfirm; 