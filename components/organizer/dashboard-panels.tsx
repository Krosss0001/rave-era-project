"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleDot, RadioTower, WalletCards } from "lucide-react";
import { metrics, referrals, registrations } from "@/data/dashboard";
import { useLanguage } from "@/lib/i18n/use-language";
import { StatusBadge, getStatusBadgeVariant } from "@/components/shared/status-badge";

function CountUpValue({ value }: { value: string }) {
  const target = useMemo(() => Number(value.replace(/[^0-9.]/g, "")) || 0, [value]);
  const suffix = value.replace(/[0-9.,\s]/g, "");
  const prefix = value.match(/^[^\d]+/)?.[0] ?? "";
  const hasDecimal = value.includes(".");
  const hasComma = value.includes(",");
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame = 0;
    const total = 38;
    let raf = 0;

    function tick() {
      frame += 1;
      const progress = 1 - Math.pow(1 - frame / total, 3);
      setDisplay(target * Math.min(progress, 1));
      if (frame < total) {
        raf = window.requestAnimationFrame(tick);
      }
    }

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [target]);

  const formatted = hasDecimal
    ? display.toFixed(1)
    : Math.round(display).toLocaleString("en-US", { useGrouping: hasComma });

  const separator = suffix && suffix !== "%" ? " " : "";

  return <>{prefix}{formatted}{suffix ? `${separator}${suffix}` : ""}</>;
}

export function MetricGrid() {
  const { language } = useLanguage();
  const items = [
    [language === "ua" ? "Дохід" : "Revenue", metrics.revenue],
    [language === "ua" ? "Реєстрації" : "Registrations", metrics.registrations.toString()],
    [language === "ua" ? "Конверсія" : "Conversion", metrics.conversionRate],
    [language === "ua" ? "Telegram підтвердження" : "Telegram confirmations", metrics.telegramConfirmations.toString()]
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(([label, value]) => (
        <div
          key={label}
          className="group relative min-w-0 border border-white/[0.05] bg-[#020202] p-4 motion-safe:transition-[border-color,box-shadow,transform] motion-safe:duration-500 motion-safe:ease-out hover:border-primary/[0.35] hover:shadow-[0_0_28px_rgba(0,255,136,0.06)] motion-safe:hover:-translate-y-0.5 sm:p-5 lg:p-6"
        >
          <span className="absolute left-0 top-0 h-px w-0 bg-primary motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out group-hover:w-full" aria-hidden="true" />
          <p className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-white/[0.45] sm:text-xs sm:tracking-[0.2em]">
            {label}
            <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_12px_rgba(0,255,136,0.45)] motion-safe:animate-pulse" aria-hidden="true" />
          </p>
          <p className="mt-5 font-mono text-[clamp(2rem,10vw,3rem)] font-semibold tabular-nums text-white">
            <CountUpValue value={value} />
          </p>
        </div>
      ))}
    </div>
  );
}

export function SystemStatusRow() {
  const { language } = useLanguage();
  const items = [
    ["Telegram", "connected"],
    [language === "ua" ? "Оплати" : "Payments", "standby"],
    [language === "ua" ? "Реферали" : "Referral system", "active"]
  ];

  return (
    <div className="grid gap-3 border-y border-white/[0.05] bg-[#020202] py-4 sm:grid-cols-3">
      {items.map(([label, status]) => (
        <div key={label} className="flex min-h-14 min-w-0 items-center justify-between gap-3 border border-white/[0.05] bg-[#030303] px-3 font-mono text-[10px] uppercase tracking-[0.11em] text-white/[0.52] sm:px-4 sm:tracking-[0.16em]">
          <span className="min-w-0 break-words">{label}</span>
          <StatusBadge label={status} variant={getStatusBadgeVariant(status)} size="sm" />
        </div>
      ))}
    </div>
  );
}

export function RegistrationTable() {
  const { language } = useLanguage();
  return (
    <section className="border-y border-white/[0.05] bg-[#020202] py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary sm:tracking-[0.26em]">{language === "ua" ? "Реєстрації" : "Registrations"}</p>
          <h2 className="mt-3 text-[clamp(1.85rem,9vw,3rem)] font-black uppercase leading-[0.98] text-white">
            {language === "ua" ? "Операції з гостями" : "Attendee operations"}
          </h2>
        </div>
        <span className="border border-white/[0.05] bg-[#030303] px-3 py-1.5 font-mono text-xs uppercase tracking-[0.16em] text-white/[0.45]">
          {language === "ua" ? "Demo дані" : "Demo data"}
        </span>
      </div>
      <div className="-mx-3 mt-8 overflow-x-auto border-t border-white/[0.05] px-3 [scrollbar-width:thin] sm:mx-0 sm:mt-10 sm:px-0">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="font-mono text-xs uppercase tracking-[0.18em] text-white/[0.34]">
            <tr>
              <th className="w-px py-4 font-medium" aria-label="Row indicator" />
              <th className="py-4 font-medium">{language === "ua" ? "Ім'я" : "Name"}</th>
              <th className="py-4 font-medium">Telegram</th>
              <th className="py-4 font-medium">{language === "ua" ? "Подія" : "Event"}</th>
              <th className="py-4 font-medium">{language === "ua" ? "Джерело" : "Source"}</th>
              <th className="py-4 font-medium">{language === "ua" ? "Статус" : "Status"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {registrations.map((registration) => (
              <tr key={registration.id} className="group relative motion-safe:transition-colors motion-safe:duration-500 hover:bg-primary/[0.018]">
                <td className="w-px bg-transparent p-0">
                  <span className="block h-14 w-px bg-primary opacity-0 motion-safe:transition-opacity motion-safe:duration-500 group-hover:opacity-100" aria-hidden="true" />
                </td>
                <td className="py-4 font-medium text-white/[0.82]">{registration.name}</td>
                <td className="py-4 font-mono text-white/[0.42]">{registration.telegram}</td>
                <td className="py-4 text-white/[0.42]">{registration.event}</td>
                <td className="py-4 font-mono text-white/[0.42]">{registration.source}</td>
                <td className="py-4">
                  <StatusBadge label={registration.status} variant={getStatusBadgeVariant(registration.status)} size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ReferralPanel() {
  const { language } = useLanguage();
  const topReferral = referrals.reduce((top, referral) => (referral.confirmed > top.confirmed ? referral : top), referrals[0]);

  return (
    <section className="border-y border-white/[0.05] bg-[#020202] py-8">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary sm:tracking-[0.26em]">{language === "ua" ? "Реферальний рушій" : "Referral engine"}</p>
      <h2 className="mt-3 text-[clamp(1.85rem,9vw,3rem)] font-black uppercase leading-[0.98] text-white">{language === "ua" ? "Топ джерела зростання" : "Top growth sources"}</h2>
      <div className="mt-8 border border-primary/25 bg-[#030303] p-5">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">{language === "ua" ? "Найкращий результат" : "Best performer"}</p>
        <div className="mt-4 flex flex-col gap-4 min-[380px]:flex-row min-[380px]:items-end min-[380px]:justify-between">
          <div className="min-w-0">
            <p className="text-2xl font-black uppercase text-white">{topReferral.ownerName}</p>
            <p className="mt-2 font-mono text-sm text-white/[0.45]">{topReferral.code}</p>
          </div>
          <p className="font-mono text-[clamp(2.5rem,13vw,3rem)] font-semibold tabular-nums text-primary">{topReferral.confirmed}</p>
        </div>
      </div>
      <div className="mt-6 grid gap-0 border-t border-white/[0.05]">
        {referrals.map((referral) => (
          <div
            key={referral.code}
            className="border-b border-white/[0.05] bg-[#020202] py-5 motion-safe:transition-colors motion-safe:duration-500 hover:bg-primary/[0.018]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-white/[0.82]">{referral.ownerName}</p>
                <p className="mt-1 font-mono text-xs uppercase tracking-[0.16em] text-white/[0.38]">{referral.code}</p>
              </div>
              <p className="font-mono text-3xl font-semibold tabular-nums text-white">{referral.confirmed}</p>
            </div>
            <p className="mt-3 font-mono text-xs uppercase tracking-[0.14em] text-white/[0.34]">
              {referral.clicks} clicks / {referral.registrations} registrations
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TelegramStatusPanel() {
  const { language } = useLanguage();
  const items = language === "ua"
    ? ["Telegram handoff активний", "Оплата в demo-режимі", "Підтвердження готові"]
    : ["Registration handoff active", "Payment status mocked", "Confirmation messages ready"];

  return (
    <section className="border-y border-white/[0.05] bg-[#020202] py-8">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 items-center justify-center border border-primary/30 bg-[#030303] text-primary">
          <RadioTower className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.26em] text-primary">{language === "ua" ? "Шар підтримки" : "Support layer"}</p>
          <h2 className="mt-2 text-[clamp(1.75rem,9vw,2rem)] font-black uppercase leading-none text-white">Telegram execution</h2>
        </div>
      </div>
      <div className="mt-7 border-y border-white/[0.05]">
        {items.map((item, index) => (
          <div
            key={item}
            className="flex min-h-12 items-center gap-3 border-b border-white/[0.05] bg-[#020202] py-3 font-mono text-sm text-white/[0.58] motion-safe:animate-[logFade_420ms_cubic-bezier(0.16,1,0.3,1)_both] last:border-b-0"
            style={{ animationDelay: `${index * 90}ms` }}
          >
            <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="uppercase tracking-[0.12em]">{item}</span>
          </div>
        ))}
      </div>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes logFade {
              from { opacity: 0; transform: translateY(8px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `
        }}
      />
    </section>
  );
}

export function SolanaReadinessPanel() {
  const { language } = useLanguage();
  const items = language === "ua"
    ? ["Phantom connect placeholder", "NFT pass заплановано", "Token-gated події заплановано", "On-chain attendance proof заплановано"]
    : ["Phantom connect placeholder", "NFT pass support planned", "Token-gated events planned", "On-chain attendance proof planned"];

  return (
    <section className="border-y border-white/[0.05] bg-[#020202] py-8">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 items-center justify-center border border-primary/30 bg-[#030303] text-primary">
          <WalletCards className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.26em] text-primary">Solana-ready</p>
          <h2 className="mt-2 text-[clamp(1.75rem,9vw,2rem)] font-black uppercase leading-none text-white">
            {language === "ua" ? "Майбутня utility логіка" : "Future utility path"}
          </h2>
        </div>
      </div>
      <div className="mt-8 grid gap-0 border-l border-primary/[0.35] text-sm">
        {items.map(
          (item, index) => (
            <div key={item} className="relative border-b border-white/[0.05] bg-[#020202] py-4 pl-6 last:border-b-0">
              <CircleDot className="absolute -left-2 top-4 h-4 w-4 bg-[#020202] text-primary" aria-hidden="true" />
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/[0.35]">Phase 0{index + 1}</p>
              <p className="mt-2 text-white/[0.62]">{item}</p>
            </div>
          )
        )}
      </div>
    </section>
  );
}
