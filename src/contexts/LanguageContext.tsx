"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Language, translations } from "@/constants/translations";
import { resolveInitialLanguage, storeLanguage } from "@/lib/languagePreference";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en & ((path: string) => string);
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Arabic on the server so the initial HTML matches the <html lang="ar"> in
  // the root layout; the real preference is resolved after mount below.
  const [language, setLanguageState] = useState<Language>("ar");

  // A saved choice wins; otherwise follow the browser/phone language.
  useEffect(() => {
    setLanguageState(resolveInitialLanguage());
  }, []);

  // Keep document language and direction in sync
  useEffect(() => {
    const currentDir = language === "ar" ? "rtl" : "ltr";
    try {
      document.documentElement.lang = language === "ar" ? "ar" : "en";
      document.documentElement.dir = currentDir;
    } catch (e) {
      // ignore in environments without document
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    storeLanguage(lang);
  };

  // Create hybrid t that works both as object and function
  const baseTranslations = translations[language];
  const tFunction = (path: string): string => {
    try {
      const keys = path.split(".");
      let value: any = baseTranslations;
      for (const key of keys) {
        value = value[key];
      }
      return typeof value === "string" ? value : path;
    } catch {
      return path;
    }
  };
  
  // Merge object properties with function
  const t = Object.assign(tFunction, baseTranslations) as typeof baseTranslations & ((path: string) => string);

  const dir = language === "ar" ? "rtl" : "ltr";

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
