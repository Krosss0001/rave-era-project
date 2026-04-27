"use client";

import { useLanguage } from "@/lib/i18n/use-language";

type LocalizedTextProps = {
  ua: string;
  en: string;
};

export function LocalizedText({ ua, en }: LocalizedTextProps) {
  const { language } = useLanguage();
  return <>{language === "ua" ? ua : en}</>;
}
