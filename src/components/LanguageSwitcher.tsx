"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { COLORS } from "@/constants/store";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setLanguage("en")}
        className={`w-10 h-10 md:w-11 rounded-lg font-semibold text-xs md:text-sm leading-none inline-flex items-center justify-center transition-all ${
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
        className={`w-10 h-10 md:w-11 rounded-lg font-semibold text-xs md:text-sm leading-none inline-flex items-center justify-center transition-all ${
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
