"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Language, translations } from "@/constants/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string) => string;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem("manajel-language") as Language;
    if (savedLang && (savedLang === "en" || savedLang === "ar")) {
      setLanguageState(savedLang);
    } else {
      // Detect browser language
      const browserLang = navigator.language.startsWith("ar") ? "ar" : "en";
      setLanguageState(browserLang);
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

  const t = (path: string): string => {
    try {
      const keys = path.split(".");
      let value: any = translations[language];
      for (const key of keys) {
        value = value[key];
      }
      return typeof value === "string" ? value : path;
    } catch {
      return path;
    }
  };

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
