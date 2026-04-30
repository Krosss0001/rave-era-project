"use client";

import Link from "next/link";
import { ArrowUpRight, Send } from "lucide-react";
import { useLanguage } from "@/lib/i18n/use-language";
import { buildTelegramUrl } from "@/lib/telegram";

type TelegramCtaProps = {
  eventSlug: string;
  referralCode?: string | null;
};

export function TelegramCta({ eventSlug, referralCode }: TelegramCtaProps) {
  const { language } = useLanguage();
  const telegramUrl = buildTelegramUrl(eventSlug, referralCode);
  const copy =
    language === "ua"
      ? {
          kicker: "Основний шлях",
          title: "Підтвердження в Telegram",
          body: "Відкрийте бот, щоб завершити підтвердження, стежити за статусом квитка та отримати QR.",
          button: "Відкрити Telegram bot",
          referral: "Реферал застосовано",
          newTab: "Telegram відкриється в новій вкладці. Бот зберігає підтвердження та оновлення квитка в одному місці."
        }
      : {
          kicker: "Primary path",
          title: "Confirm in Telegram",
          body: "Open the bot to finish confirmation, track payment status, and receive the QR when the ticket is ready.",
          button: "Open Telegram bot",
          referral: "Referral applied",
          newTab: "Telegram opens in a new tab. The bot keeps confirmation and ticket updates together."
        };

  return (
    <section className="group relative overflow-hidden border border-[#00FF88]/28 bg-[#020202] p-4 shadow-[0_0_56px_rgba(0,255,136,0.07)] transition duration-200 hover:border-[#00FF88]/45">
      <span className="absolute left-0 top-0 h-px w-full bg-[#00FF88]" aria-hidden="true" />
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#00FF88]/30 bg-black text-[#00FF88]">
          <Send className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#00FF88] sm:tracking-[0.18em]">{copy.kicker}</p>
          <h2 className="mt-2 text-xl font-black uppercase leading-none text-white">{copy.title}</h2>
          <p className="mt-2 text-sm leading-6 text-white/58">{copy.body}</p>
        </div>
      </div>
      <Link
        href={telegramUrl}
        target="_blank"
        rel="noreferrer"
        className="focus-ring mt-4 inline-flex min-h-12 w-full items-center justify-between gap-3 bg-[#00FF88] px-4 py-3 font-mono text-[11px] font-black uppercase tracking-[0.13em] text-black transition duration-200 hover:scale-[1.01] hover:brightness-110 hover:shadow-[0_0_32px_rgba(0,255,136,0.16)] active:scale-[0.99] sm:tracking-[0.16em]"
      >
        <span className="min-w-0 text-left leading-5">{copy.button}</span>
        <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
      </Link>
      <p className="mt-3 text-xs leading-5 text-white/58">{copy.newTab}</p>
      {referralCode ? (
        <p className="mt-3 break-anywhere font-mono text-[10px] uppercase tracking-[0.14em] text-white/38">
          {copy.referral}: <span className="text-[#00FF88]">{referralCode}</span>
        </p>
      ) : null}
    </section>
  );
}
