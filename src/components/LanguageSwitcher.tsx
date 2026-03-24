"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { COLORS } from "@/constants/store";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === "en" ? "ar" : "en")}
      className={`w-9 h-9 md:w-10 rounded-full font-semibold text-xs md:text-sm leading-none inline-flex items-center justify-center transition-all border-2 ${
        language === "en"
          ? "text-white border-white/30"
          : "text-white border-white/30"
      }`}
      style={{
        backgroundColor: COLORS.secondary,
      }}
    >
      {language === "ar" ? "En" : "AR"}
    </button>
  );
}
