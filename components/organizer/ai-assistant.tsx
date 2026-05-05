"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Bot, CornerDownRight, Send, Sparkles } from "lucide-react";
import { aiSuggestions, metrics, referrals, registrations } from "@/data/dashboard";

const commandLabels: Record<string, string> = {
  "How to increase registrations?": "/increase_registrations",
  "Draft a Telegram announcement": "/write_telegram_post",
  "Write Telegram post": "/write_telegram_post",
  "Best referral strategy?": "/referral_strategy",
  "Summarize event performance": "/summarize_event_performance"
};

type AiSuggestion = {
  prompt: string;
  response: string;
};

export function AiAssistant() {
  const [selected, setSelected] = useState<AiSuggestion>(aiSuggestions[0]);
  const [prompt, setPrompt] = useState("");
  const [responseKey, setResponseKey] = useState(0);
  const topReferral = useMemo(
    () => referrals.reduce((top, referral) => (referral.confirmed > top.confirmed ? referral : top), referrals[0]),
    []
  );
  const eventNames = useMemo(() => Array.from(new Set(registrations.map((registration) => registration.event))).join(", "), []);

  function buildResponse(input: string) {
    const normalized = input.toLowerCase();

    if (normalized.includes("telegram") || normalized.includes("post")) {
      return `Telegram draft: ${eventNames || "Active event"} is moving fast with ${metrics.registrations} registrations and ${metrics.telegramConfirmations} Telegram confirmations. Final wave is live. Open the event, register in Telegram, and share your invite link with your crew.`;
    }

    if (normalized.includes("referral") || normalized.includes("invite")) {
      return `Best referral move: start with ${topReferral.code}. It has ${topReferral.clicks} clicks, ${topReferral.registrations} registrations, and ${topReferral.confirmed} confirmed guests. Give that audience a short invite window and ask every confirmed guest to forward their tracked link.`;
    }

    if (normalized.includes("registration") || normalized.includes("increase") || normalized.includes("sell")) {
      return `Registration plan: spotlight the event with the highest capacity pressure, send one Telegram reminder, pin the referral link copy, and use ${metrics.conversionRate} conversion as the benchmark. The fastest lift should come from confirmed guests sharing again.`;
    }

    return `Snapshot: ${metrics.registrations} registrations, ${metrics.referralRegistrations} referral-led registrations, and ${metrics.telegramConfirmations} Telegram confirmations. Focus the next action on Telegram CTA clarity and the strongest referral source, ${topReferral.code}.`;
  }

  function chooseSuggestion(suggestion: AiSuggestion) {
    setPrompt(suggestion.prompt);
    setSelected(suggestion);
    setResponseKey((value) => value + 1);
  }

  function submitPrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanPrompt = prompt.trim();

    if (!cleanPrompt) {
      return;
    }

    setSelected({
      prompt: cleanPrompt,
      response: buildResponse(cleanPrompt)
    });
    setResponseKey((value) => value + 1);
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
      <form onSubmit={submitPrompt} className="mt-8 grid gap-3 border border-white/[0.06] bg-black p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <label className="sr-only" htmlFor="ai-organizer-prompt">Ask AI assistant</label>
        <input
          id="ai-organizer-prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Ask about registrations, Telegram copy, or referrals"
          className="focus-ring min-h-12 w-full border border-white/[0.08] bg-[#020202] px-4 font-mono text-xs text-white outline-none placeholder:text-white/28 focus:border-primary"
        />
        <button
          type="submit"
          className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 bg-primary px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-black transition duration-200 hover:brightness-110 active:scale-[0.99]"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          Ask
        </button>
      </form>
      <div className="mt-5 border-y border-white/[0.05]">
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
        >
          {selected.response}
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
