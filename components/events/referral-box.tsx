"use client";

import { useMemo, useState } from "react";
import { Copy, Share2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/use-language";
import { buildReferralUrl } from "@/lib/referral";

type ReferralBoxProps = {
  path: string;
  activeReferral?: string | null;
};

const defaultCode = "RAVE-CREW";

export function ReferralBox({ path, activeReferral }: ReferralBoxProps) {
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const code = activeReferral || defaultCode;
  const referralUrl = useMemo(() => buildReferralUrl(path, code), [path, code]);

  async function copyReferral() {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="group relative border border-white/[0.05] bg-[#020202] p-5 motion-safe:transition-colors motion-safe:duration-500 hover:border-[#00FF88]/25">
      <span className="absolute left-0 top-0 h-px w-0 bg-[#00FF88] motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out group-hover:w-full" aria-hidden="true" />
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-[#00FF88]/30 bg-[#030303] text-[#00FF88]">
          <Share2 className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00FF88]">
            {language === "ua" ? "Контур дистрибуції" : "Distribution loop"}
          </p>
          <h2 className="mt-2 text-2xl font-black uppercase leading-none">
            {language === "ua" ? "Реферальне зростання" : "Referral growth loop"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/45">
            {language === "ua"
              ? "Поділіться трекінговим посиланням. У MVP атрибуція базується на URL і показується в кабінеті організатора з demo-статистикою."
              : "Share a tracked invite link. For MVP, attribution is URL-based and shown in the organizer dashboard with demo stats."}
          </p>
        </div>
      </div>
      <div className="mt-5 border border-white/[0.05] bg-[#030303] p-3 motion-safe:transition-[border-color,box-shadow] motion-safe:duration-500 hover:border-[#00FF88]/25 hover:shadow-[0_0_26px_rgba(0,255,136,0.08)]">
        <p className="break-all font-mono text-xs text-white/35">
          <span className="text-[#00FF88]">{code}</span> / {referralUrl}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 border-y border-white/[0.05] py-3">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">{language === "ua" ? "Топ джерело" : "Top source"}</p>
          <p className="mt-1 font-mono text-sm font-semibold text-[#00FF88]">RAVE-ANNA</p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">{language === "ua" ? "Сигнал" : "Signal"}</p>
          <p className="mt-1 font-mono text-sm font-semibold text-white motion-safe:animate-[numberPop_520ms_cubic-bezier(0.16,1,0.3,1)_both]">
            {language === "ua" ? "31 підтверджено" : "31 confirmed"}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={copyReferral}
        className={`focus-ring mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 border border-[#00FF88] px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest text-[#00FF88] motion-safe:transition-[transform,color,background-color,box-shadow] motion-safe:duration-500 motion-safe:ease-out hover:bg-[#00FF88] hover:text-black hover:shadow-[0_0_40px_rgba(0,255,136,0.12)] active:scale-[0.98] motion-safe:hover:-translate-y-0.5 ${
          copied ? "bg-[#00FF88] text-black shadow-[0_0_34px_rgba(0,255,136,0.16)] motion-safe:animate-[copyFlash_420ms_cubic-bezier(0.16,1,0.3,1)_both]" : ""
        }`}
      >
        <Copy className="h-4 w-4" aria-hidden="true" />
        {copied ? (language === "ua" ? "Скопійовано" : "Copied") : (language === "ua" ? "Копіювати реферал" : "Copy referral link")}
      </button>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes copyFlash {
              from { transform: translateY(-2px) scale(0.985); }
              to { transform: translateY(0) scale(1); }
            }
            @keyframes numberPop {
              from { opacity: 0; transform: translateY(6px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `
        }}
      />
    </section>
  );
}
