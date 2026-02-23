"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Language, translations } from "@/constants/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en & ((path: string) => string);
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Default to Arabic for first-time visitors
  const [language, setLanguageState] = useState<Language>("ar");

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem("manajel-language") as Language;
    if (savedLang && (savedLang === "en" || savedLang === "ar")) {
      setLanguageState(savedLang);
    } else {
      // Default to Arabic for first-time visitors
      setLanguageState("ar");
    }
  }, []);

  // Keep document language and direction in sync
  useEffect(() => {
    const currentDir = language === "ar" ? "rtl" : "ltr";
    try {
      document.documentElement.lang = language;
      document.documentElement.dir = currentDir;
    } catch (e) {
      // ignore in environments without document
    }
    // small debug to help confirm language changes in the browser console
    // remove later if not needed
    // eslint-disable-next-line no-console
    console.log("Language set to:", language, "dir:", currentDir);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("manajel-language", lang);
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
