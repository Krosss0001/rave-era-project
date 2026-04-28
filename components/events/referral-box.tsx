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
  const copy =
    language === "ua"
      ? {
          title: "Реферал",
          body: "Поділіться персональним посиланням на подію.",
          action: "Копіювати",
          copied: "Скопійовано"
        }
      : {
          title: "Referral",
          body: "Share a personal tracked event link.",
          action: "Copy link",
          copied: "Copied"
        };

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
    <section className="group relative border border-white/[0.06] bg-[#020202] p-4 transition duration-200 hover:border-[#00FF88]/25">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#00FF88]/25 bg-black text-[#00FF88]">
          <Share2 className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[#00FF88]">{copy.title}</h2>
          <p className="mt-2 text-sm leading-6 text-white/50">{copy.body}</p>
        </div>
      </div>
      <div className="mt-4 border border-white/[0.06] bg-black p-3">
        <p className="break-all font-mono text-xs leading-5 text-white/38">
          <span className="text-[#00FF88]">{code}</span> / {referralUrl}
        </p>
      </div>
      <button
        type="button"
        onClick={copyReferral}
        className={`focus-ring mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 border px-4 py-2.5 text-center font-mono text-[11px] font-bold uppercase tracking-[0.14em] transition duration-200 active:scale-[0.99] ${
          copied
            ? "border-[#00FF88] bg-[#00FF88] text-black"
            : "border-white/[0.1] text-white/58 hover:border-[#00FF88]/35 hover:text-[#00FF88]"
        }`}
      >
        <Copy className="h-4 w-4" aria-hidden="true" />
        <span className="min-w-0">{copied ? copy.copied : copy.action}</span>
      </button>
    </section>
  );
}
