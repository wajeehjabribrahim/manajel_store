"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { COLORS } from "@/constants/store";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === "en" ? "ar" : "en")}
      // Full word in a pill rather than a two-letter code in a circle: the
      // store serves a local market where "AR" is not self-explanatory. Matches
      // the landing page's language button.
      aria-label={language === "ar" ? "Switch to English" : "التبديل إلى العربية"}
      className="h-9 md:h-10 px-3 md:px-4 rounded-full font-semibold text-xs md:text-sm leading-none whitespace-nowrap inline-flex items-center justify-center border-2 border-white/30 text-white transition-transform active:scale-95"
      style={{
        backgroundColor: COLORS.secondary,
      }}
    >
      {language === "ar" ? "English" : "عربي"}
    </button>
  );
}
