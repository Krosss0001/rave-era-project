"use client";

import { useEffect, useMemo, useState } from "react";
import { dictionaries, type Language } from "@/lib/i18n/dictionaries";

const STORAGE_KEY = "raveera-language";

function detectLanguage(): Language {
  if (typeof window === "undefined") {
    return "en";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (stored === "ua" || stored === "en") {
    return stored;
  }

  return window.navigator.language.toLowerCase().startsWith("uk") ? "ua" : "en";
}

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    setLanguageState(detectLanguage());
  }, []);

  function setLanguage(nextLanguage: Language) {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
  }

  const dictionary = useMemo(() => dictionaries[language], [language]);

  return { language, setLanguage, dictionary };
}
