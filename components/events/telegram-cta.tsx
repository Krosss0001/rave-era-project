"use client";

import Link from "next/link";
import { ArrowUpRight, Send, UserPlus } from "lucide-react";
import { useLanguage } from "@/lib/i18n/use-language";
import { buildTelegramUrl } from "@/lib/telegram";

type TelegramCtaProps = {
  eventSlug: string;
  referralCode?: string | null;
};

export function TelegramCta({ eventSlug, referralCode }: TelegramCtaProps) {
  const { dictionary } = useLanguage();
  const telegramUrl = buildTelegramUrl(eventSlug, referralCode);

  return (
    <section className="group relative overflow-hidden border border-white/[0.08] bg-[#020202] p-5 shadow-[0_0_60px_rgba(0,255,136,0.035)]">
      <span className="absolute left-0 top-0 h-px w-full bg-[#00FF88]" aria-hidden="true" />
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-[#00FF88]/30 bg-[#030303] text-[#00FF88]">
          <Send className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00FF88]">{dictionary.events.telegramChoice}</p>
          <h2 className="mt-2 text-2xl font-black uppercase leading-none">{dictionary.events.telegramTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-white/45">
            {dictionary.events.telegramCopy}
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-2 border-y border-white/[0.05] py-3">
        <div className="flex min-h-12 items-center justify-between gap-3 border border-white/[0.05] bg-[#030303] px-4 text-sm text-white/60">
          <span className="inline-flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-white/35" aria-hidden="true" />
            {dictionary.events.registerWeb}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/30">{dictionary.common.available}</span>
        </div>
        <Link
          href={telegramUrl}
          target="_blank"
          rel="noreferrer"
          className="focus-ring inline-flex min-h-12 items-center justify-between gap-3 border border-[#00FF88] bg-[#00FF88] px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-black motion-safe:transition-[transform,filter,box-shadow] motion-safe:duration-500 motion-safe:ease-out hover:brightness-110 hover:shadow-[0_0_34px_rgba(0,255,136,0.16)] active:scale-[0.98] motion-safe:hover:-translate-y-0.5"
        >
          {dictionary.events.continueTelegram}
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      {referralCode ? (
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
          {dictionary.events.referralApplied}: <span className="text-[#00FF88]">{referralCode}</span>
        </p>
      ) : null}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes fadeUp {
              from { opacity: 0; transform: translateY(8px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `
        }}
      />
    </section>
  );
}
