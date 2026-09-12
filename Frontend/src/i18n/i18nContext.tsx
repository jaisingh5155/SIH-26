import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import type { LanguageCode, LanguageInfo } from "./types";
import { SUPPORTED_LANGUAGES } from "./types";

import enDict from "../locales/en.json";
import hiDict from "../locales/hi.json";
import asDict from "../locales/as.json";
import bnDict from "../locales/bn.json";
import mniDict from "../locales/mni.json";
import khaDict from "../locales/kha.json";
import lusDict from "../locales/lus.json";
import nagDict from "../locales/nag.json";

const STORAGE_KEY = "smritisetu_ui_language";
const DEFAULT_LANG: LanguageCode = "en";

const DICTIONARIES: Record<LanguageCode, Record<string, any>> = {
  en: enDict,
  hi: hiDict,
  as: asDict,
  bn: bnDict,
  mni: mniDict,
  kha: khaDict,
  lus: lusDict,
  nag: nagDict,
};

interface I18nContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  languages: LanguageInfo[];
  currentLanguageInfo: LanguageInfo;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function resolveKey(obj: any, path: string): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const parts = path.split(".");
  let current: any = obj;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return typeof current === "string" ? current : undefined;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
        if (saved && saved in DICTIONARIES) {
          return saved;
        }
      } catch {
        // localStorage not available
      }
    }
    return DEFAULT_LANG;
  });

  const setLanguage = (newLang: LanguageCode) => {
    if (newLang in DICTIONARIES) {
      setLanguageState(newLang);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, newLang);
        } catch {
          // ignore
        }
      }
    }
  };

  const currentLanguageInfo = useMemo(
    () => SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0]!,
    [language],
  );

  const t = useMemo(() => {
    return (key: string, fallback?: string): string => {
      // 1. Check current language dictionary
      const activeDict = DICTIONARIES[language];
      const match = resolveKey(activeDict, key);
      if (match) return match;

      // 2. Fall back to English dictionary if not English
      if (language !== "en") {
        const enMatch = resolveKey(DICTIONARIES.en, key);
        if (enMatch) return enMatch;
      }

      // 3. Fallback parameter or key
      return fallback !== undefined ? fallback : key;
    };
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      languages: SUPPORTED_LANGUAGES,
      currentLanguageInfo,
      t,
    }),
    [language, currentLanguageInfo, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return ctx;
}
