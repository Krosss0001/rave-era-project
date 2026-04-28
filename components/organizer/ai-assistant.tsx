"use client";

import { useState } from "react";
import { Bot, CornerDownRight, Sparkles } from "lucide-react";
import { aiSuggestions } from "@/data/dashboard";

const commandLabels: Record<string, string> = {
  "How do I sell the last 100 tickets?": "/sell_last_100_tickets",
  "Draft a Telegram announcement": "/write_telegram_post",
  "Which referral source is strongest?": "/analyze_referrals",
  "Summarize event performance": "/summarize_event_performance"
};

export function AiAssistant() {
  const [selected, setSelected] = useState(aiSuggestions[0]);
  const [loading, setLoading] = useState(false);
  const [responseKey, setResponseKey] = useState(0);

  function chooseSuggestion(suggestion: (typeof aiSuggestions)[number]) {
    setLoading(true);
    window.setTimeout(() => {
      setSelected(suggestion);
      setLoading(false);
      setResponseKey((value) => value + 1);
    }, 600);
  }

  return (
    <section className="border-y border-white/[0.05] bg-[#020202] py-8">
      <div className="flex items-start gap-4 px-1">
        <span className="flex h-11 w-11 items-center justify-center border border-primary/30 bg-[#030303] text-primary">
          <Bot className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.26em] text-primary">AI operator console</p>
          <h2 className="mt-2 text-[clamp(2rem,10vw,3rem)] font-black uppercase leading-none text-white">Campaign OS</h2>
        </div>
      </div>
      <div className="mt-10 border-y border-white/[0.05]">
        {aiSuggestions.map((suggestion) => (
          <button
            key={suggestion.prompt}
            type="button"
            onClick={() => chooseSuggestion(suggestion)}
            className="focus-ring group flex min-h-12 w-full items-center justify-between gap-4 border-b border-white/[0.05] bg-[#020202] px-1 py-4 text-left motion-safe:transition-[background-color,padding-left] motion-safe:duration-500 motion-safe:ease-out last:border-b-0 hover:bg-primary/[0.04] hover:pl-3"
          >
            <span className="min-w-0 break-words font-mono text-xs leading-5 text-white/[0.58] motion-safe:transition-colors motion-safe:duration-500 group-hover:text-primary sm:text-sm">
              {commandLabels[suggestion.prompt] ?? suggestion.prompt}
            </span>
            <CornerDownRight className="h-4 w-4 shrink-0 text-white/20 motion-safe:transition-colors motion-safe:duration-500 group-hover:text-primary" aria-hidden="true" />
          </button>
        ))}
      </div>
      <div className="mt-8 border border-primary/30 bg-[#030303] p-5 shadow-[0_0_28px_rgba(0,255,136,0.04)]">
        <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Response stream
        </div>
        <p
          key={responseKey}
          className="mt-5 min-h-28 overflow-hidden font-mono text-sm leading-7 text-white/[0.68] motion-safe:animate-[typeIn_700ms_steps(46,end)_both]"
          aria-live="polite"
          aria-busy={loading}
        >
          {loading ? "Reading event metrics and referral performance..." : selected.response}
          <span className="ml-1 inline-block h-4 w-1 translate-y-0.5 bg-primary motion-safe:animate-[cursorBlink_1s_steps(1,end)_infinite]" aria-hidden="true" />
        </p>
      </div>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes typeIn {
              from { max-width: 0; opacity: 0.72; }
              to { max-width: 100%; opacity: 1; }
            }
            @keyframes cursorBlink {
              0%, 49% { opacity: 1; }
              50%, 100% { opacity: 0; }
            }
          `
        }}
      />
    </section>
  );
}
