import { useTranslation } from "react-i18next";
import { useMemo } from "react";

export default function Success() {
  const { t } = useTranslation();

  // Voeg meerdere gifs toe
  const gifs = [
    "/assets/confetti.gif",
    "/assets/party.gif",
    "/assets/fireworks.gif",
    "/assets/celebrate.gif"
  ];
  // Kies random één gif bij laden
  const selectedGif = useMemo(() => gifs[Math.floor(Math.random() * gifs.length)], []);

  return (
    <div className="flex flex-col items-center justify-center h-screen px-4 text-center bg-[#fdfcfa]">
      {/* Willekeurige confetti/feest gif */}
      <img
        src={selectedGif}
        alt="Confetti"
        className="w-32 h-32 mb-6 animate-bounce"
      />
      <h1 className="text-2xl font-semibold text-[#1a1a1a]">
        🎉 {t("success.title")}
      </h1>
      <p className="text-[#444] mt-2 mb-6">{t("success.description")}</p>
      <a
        href="/"
        className="bg-[#aadfd4] text-[#1a1a1a] px-6 py-3 rounded-2xl font-medium hover:bg-[#98cfc4] transition"
      >
        {t("success.button")}
      </a>
    </div>
  );
} 