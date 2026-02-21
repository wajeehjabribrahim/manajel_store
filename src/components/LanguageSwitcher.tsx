"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { COLORS } from "@/constants/store";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex gap-1">
      <button
        onClick={() => setLanguage("en")}
        className={`px-2 py-1 md:px-3 rounded-lg font-semibold text-xs md:text-sm transition-all ${
          language === "en"
            ? "text-white"
            : "text-white/70 hover:text-white"
        }`}
        style={{
          backgroundColor: language === "en" ? COLORS.secondary : "transparent",
        }}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage("ar")}
        className={`px-2 py-1 md:px-3 rounded-lg font-semibold text-xs md:text-sm transition-all ${
          language === "ar"
            ? "text-white"
            : "text-white/70 hover:text-white"
        }`}
        style={{
          backgroundColor: language === "ar" ? COLORS.secondary : "transparent",
        }}
      >
        ع
      </button>
    </div>
  );
}
