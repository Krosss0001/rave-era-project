"use client";

import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { dictionaries, type Language } from "@/lib/i18n/dictionaries";

const STORAGE_KEY = "raveera-language";
const LANGUAGE_CHANGE_EVENT = "raveera-language-change";
const DEFAULT_LANGUAGE: Language = "ua";

type LanguageContextValue = {
  language: Language;
  setLanguage: (nextLanguage: Language) => void;
  dictionary: (typeof dictionaries)[Language];
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function isLanguage(value: unknown): value is Language {
  return value === "ua" || value === "en";
}

function readStoredLanguage(): Language {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isLanguage(stored) ? stored : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function persistLanguage(language: Language) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Storage may be blocked in private or embedded browser contexts.
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    setLanguageState(readStoredLanguage());
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "ua" ? "uk" : "en";
  }, [language]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    if (!isLanguage(nextLanguage)) {
      return;
    }

    setLanguageState(nextLanguage);
    persistLanguage(nextLanguage);
    window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: nextLanguage }));
  }, []);

  useEffect(() => {
    function syncLanguage(nextLanguage: Language) {
      setLanguageState((currentLanguage) => (currentLanguage === nextLanguage ? currentLanguage : nextLanguage));
    }

    function handleStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY || !isLanguage(event.newValue)) {
        return;
      }

      syncLanguage(event.newValue);
    }

    function handleLanguageChange(event: Event) {
      const nextLanguage = event instanceof CustomEvent ? event.detail : readStoredLanguage();

      if (isLanguage(nextLanguage)) {
        syncLanguage(nextLanguage);
      }
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange);
    };
  }, []);

  const dictionary = useMemo(() => dictionaries[language], [language]);
  const value = useMemo(() => ({ language, setLanguage, dictionary }), [dictionary, language, setLanguage]);

  return createElement(LanguageContext.Provider, { value }, children);
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider.");
  }

  return context;
}
