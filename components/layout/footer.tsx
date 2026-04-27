"use client";

import { useLanguage } from "@/lib/i18n/use-language";

export function Footer() {
  const { language } = useLanguage();

  return (
    <footer className="border-t border-white/[0.05] bg-[#020202]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-12 text-sm text-white/35 sm:px-6 md:flex-row md:items-center md:justify-between md:px-10 lg:px-12 2xl:max-w-[1500px]">
        <p>
          {language === "ua" ? (
            <>Rave<span className="text-primary">&apos;</span>era Group. Преміальні події, системи зростання та операційні інструменти.</>
          ) : (
            <>Rave<span className="text-primary">&apos;</span>era Group. Premium events, growth systems, and execution layers.</>
          )}
        </p>
        <p className="border-t border-white/[0.05] pt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/25 md:border-l md:border-t-0 md:pl-6 md:pt-0">
          {language === "ua" ? "Demo-ready архітектура" : "Demo-ready architecture"}
        </p>
      </div>
    </footer>
  );
}
