"use client";

import { useLanguage } from "@/lib/i18n/use-language";
import type { Language } from "@/lib/i18n/dictionaries";

const options: { value: Language; label: string }[] = [
  { value: "ua", label: "UA" },
  { value: "en", label: "EN" }
];

type LanguageToggleProps = {
  mobile?: boolean;
};

export function LanguageToggle({ mobile = false }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage();

  if (mobile) {
    return (
      <div className="grid gap-2" aria-label="Language">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white/42">
          Language / Мова
        </p>
        <div className="grid grid-cols-2 gap-2">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setLanguage(option.value)}
              aria-pressed={language === option.value}
              className={`focus-ring min-h-12 border px-4 py-3 font-mono text-[12px] font-black uppercase tracking-[0.16em] motion-safe:transition-[background-color,border-color,color,transform] motion-safe:duration-200 active:scale-[0.98] ${
                language === option.value
                  ? "border-primary bg-primary text-black shadow-[0_0_28px_rgba(0,255,136,0.16)]"
                  : "border-white/[0.08] bg-[#050505] text-white/64 hover:border-primary/45 hover:text-primary"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

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
