"use client";

import type { ReactNode } from "react";
import { useLanguage } from "@/lib/i18n/use-language";

type LocalizedTextProps = {
  ua: ReactNode;
  en: ReactNode;
};

export function LocalizedText({ ua, en }: LocalizedTextProps) {
  const { language } = useLanguage();
  return <>{language === "ua" ? ua : en}</>;
}
