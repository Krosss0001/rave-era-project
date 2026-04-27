"use client";

import { formatPriceForLanguage } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/use-language";

type LocalizedPriceProps = {
  price: number;
  currency: string;
};

export function LocalizedPrice({ price, currency }: LocalizedPriceProps) {
  const { language } = useLanguage();

  return <>{formatPriceForLanguage(price, currency, language)}</>;
}
