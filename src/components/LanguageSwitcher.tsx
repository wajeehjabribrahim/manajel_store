"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { COLORS } from "@/constants/store";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setLanguage("en")}
        className={`px-3 py-1 rounded-lg font-semibold transition-all ${
          language === "en"
            ? "text-white"
            : "text-gray-600 hover:text-gray-900"
        }`}
        style={{
          backgroundColor: language === "en" ? COLORS.primary : "transparent",
        }}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage("ar")}
        className={`px-3 py-1 rounded-lg font-semibold transition-all ${
          language === "ar"
            ? "text-white"
            : "text-gray-600 hover:text-gray-900"
        }`}
        style={{
          backgroundColor: language === "ar" ? COLORS.primary : "transparent",
        }}
      >
        العربية
      </button>
    </div>
  );
}
