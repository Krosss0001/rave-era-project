"use client";

import { useLanguage } from "@/lib/i18n/use-language";
import type { Language } from "@/lib/i18n/dictionaries";

const options: { value: Language; label: string }[] = [
  { value: "ua", label: "UA" },
  { value: "en", label: "EN" }
];

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex min-h-11 border border-white/[0.06] bg-[#020202]" aria-label="Language">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setLanguage(option.value)}
          aria-pressed={language === option.value}
          className={`focus-ring min-h-11 w-11 font-mono text-[10px] font-bold uppercase tracking-[0.12em] motion-safe:transition-[background-color,color,transform] motion-safe:duration-300 active:scale-[0.98] ${
            language === option.value ? "bg-[#00FF88] text-black" : "text-white/35 hover:text-[#00FF88]"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
