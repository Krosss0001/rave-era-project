"use client";

import { useLanguage } from "@/lib/i18n/use-language";

type LocalizedEventDateProps = {
  date: string;
};

export function LocalizedEventDate({ date }: LocalizedEventDateProps) {
  const { language } = useLanguage();
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return <>{language === "ua" ? "Дата уточнюється" : "Date TBA"}</>;
  }

  return (
    <>
      {new Intl.DateTimeFormat(language === "ua" ? "uk-UA" : "en", {
        month: "short",
        day: "numeric",
        year: "numeric"
      }).format(parsedDate)}
    </>
  );
}
