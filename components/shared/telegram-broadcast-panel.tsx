"use client";

import { useMemo, useState, type FormEvent } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { BroadcastAudience } from "@/lib/supabase/types";

type BroadcastEventOption = {
  id: string;
  title: string;
  slug?: string | null;
};

type AudienceOption = {
  value: BroadcastAudience;
  label: string;
};

type PreviewResponse = {
  ok: boolean;
  audienceLabel?: string;
  estimatedRecipientCount?: number;
  sampleRecipients?: Array<{ telegram_user_id: string; chat_id: string }>;
  error?: string;
};

type SendResponse = {
  ok: boolean;
  broadcastId?: string;
  audienceLabel?: string;
  total?: number;
  sent?: number;
  failed?: number;
  error?: string;
};

type TelegramBroadcastPanelProps = {
  title: string;
  eyebrow: string;
  description: string;
  events: BroadcastEventOption[];
  audienceOptions: AudienceOption[];
  requireEvent: boolean;
  defaultAudience: BroadcastAudience;
};

const languageLabels = {
  uk: "UA",
  en: "EN"
} as const;

function isEventAudience(audience: BroadcastAudience) {
  return audience !== "all_telegram_users" && audience !== "bot_interacted_not_registered";
}

function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://rave-era-project.vercel.app").replace(/\/+$/, "");
}

function formatPreviewMessage(input: {
  language: keyof typeof languageLabels;
  message: string;
  event: BroadcastEventOption | null;
}) {
  const header = input.language === "en" ? "Message from Rave'era Group" : "Повідомлення від Rave'era Group";
  const footer = input.language === "en" ? "/stop to unsubscribe" : "/stop щоб відписатися";
  const eventUrl = input.event?.slug ? `${getAppUrl()}/events/${input.event.slug}` : `${getAppUrl()}/events`;
  const eventLines = input.event ? [input.event.title, eventUrl] : [eventUrl];

  return [header, "", ...eventLines, "", input.message || "Message preview", "", footer].join("\n");
}

export function TelegramBroadcastPanel({
  title,
  eyebrow,
  description,
  events,
  audienceOptions,
  requireEvent,
  defaultAudience
}: TelegramBroadcastPanelProps) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [audience, setAudience] = useState<BroadcastAudience>(defaultAudience);
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const [language, setLanguage] = useState<keyof typeof languageLabels>("uk");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [sendResult, setSendResult] = useState<SendResponse | null>(null);
  const [busy, setBusy] = useState<"preview" | "send" | null>(null);
  const [error, setError] = useState("");

  const selectedEvent = events.find((event) => event.id === eventId) ?? null;
  const eventRequired = requireEvent || isEventAudience(audience);
  const previewMessage = formatPreviewMessage({ language, message, event: eventRequired ? selectedEvent : null });

  async function callBroadcastApi<T>(path: string): Promise<T> {
    if (!supabase) {
      throw new Error("Supabase is not configured.");
    }

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Sign in before using broadcasts.");
    }

    const response = await fetch(path, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        audience,
        eventId: eventRequired ? eventId : null,
        language,
        message
      })
    });
    const result = (await response.json()) as T & { error?: string };

    if (!response.ok) {
      throw new Error(result.error || "Broadcast request failed.");
    }

    return result;
  }

  function validateForm() {
    if (!message.trim()) {
      throw new Error("Message is required.");
    }

    if (eventRequired && !eventId) {
      throw new Error("Select an event.");
    }
  }

  async function previewAudience(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSendResult(null);

    try {
      validateForm();
      setBusy("preview");
      setPreview(await callBroadcastApi<PreviewResponse>("/api/telegram/broadcast/preview"));
    } catch (requestError) {
      setPreview(null);
      setError(requestError instanceof Error ? requestError.message : "Preview failed.");
    } finally {
      setBusy(null);
    }
  }

  async function sendBroadcast() {
    setError("");

    try {
      validateForm();
      setBusy("send");
      setSendResult(await callBroadcastApi<SendResponse>("/api/telegram/broadcast/send"));
    } catch (requestError) {
      setSendResult(null);
      setError(requestError instanceof Error ? requestError.message : "Send failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="border-y border-white/[0.05] bg-[#020202] py-8">
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.26em] text-primary">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-black uppercase leading-none text-white md:text-5xl">{title}</h2>
          <p className="mt-5 max-w-xl text-sm leading-6 text-white/50">{description}</p>
          <div className="mt-8 border border-white/[0.06] bg-[#030303] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">Preview message</p>
            <pre className="mt-4 whitespace-pre-wrap break-words font-sans text-sm leading-6 text-white/70">{previewMessage}</pre>
          </div>
        </div>

        <form onSubmit={previewAudience} className="border border-white/[0.06] bg-[#030303] p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">Audience</span>
              <select
                value={audience}
                onChange={(event) => setAudience(event.target.value as BroadcastAudience)}
                className="mt-2 min-h-11 w-full border border-white/[0.08] bg-[#020202] px-3 font-mono text-xs uppercase text-white outline-none motion-safe:transition-colors motion-safe:duration-300 focus:border-primary"
              >
                {audienceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">Language</span>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as keyof typeof languageLabels)}
                className="mt-2 min-h-11 w-full border border-white/[0.08] bg-[#020202] px-3 font-mono text-xs uppercase text-white outline-none motion-safe:transition-colors motion-safe:duration-300 focus:border-primary"
              >
                {Object.entries(languageLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            {eventRequired ? (
              <label className="block md:col-span-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">Event</span>
                <select
                  value={eventId}
                  onChange={(event) => setEventId(event.target.value)}
                  className="mt-2 min-h-11 w-full border border-white/[0.08] bg-[#020202] px-3 text-sm text-white outline-none motion-safe:transition-colors motion-safe:duration-300 focus:border-primary"
                >
                  {events.length === 0 ? <option value="">No events available</option> : null}
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className="block md:col-span-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">Message</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={6}
                required
                className="mt-2 w-full resize-y border border-white/[0.08] bg-[#020202] px-3 py-3 text-sm leading-6 text-white outline-none motion-safe:transition-colors motion-safe:duration-300 focus:border-primary"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={busy !== null}
              className="focus-ring min-h-11 border border-primary px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-primary motion-safe:transition-[background-color,color,transform,opacity] motion-safe:duration-300 hover:bg-primary hover:text-black active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {busy === "preview" ? "Previewing" : "Preview"}
            </button>
            <button
              type="button"
              onClick={sendBroadcast}
              disabled={busy !== null}
              className="focus-ring min-h-11 bg-primary px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-black motion-safe:transition-[filter,transform,opacity] motion-safe:duration-300 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {busy === "send" ? "Sending" : "Send"}
            </button>
          </div>

          {error ? (
            <p className="mt-5 border border-red-400/25 bg-red-400/[0.04] px-4 py-3 text-sm leading-6 text-red-100" aria-live="polite">
              {error}
            </p>
          ) : null}

          {preview?.ok ? (
            <div className="mt-5 grid gap-3 border border-white/[0.06] bg-[#020202] p-4" aria-live="polite">
              <div className="flex items-center justify-between gap-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">{preview.audienceLabel}</p>
                <p className="font-mono text-2xl font-semibold tabular-nums text-white">{preview.estimatedRecipientCount ?? 0}</p>
              </div>
              <p className="text-xs leading-5 text-white/45">
                Sample: {(preview.sampleRecipients ?? []).map((recipient) => recipient.chat_id).join(", ") || "No recipients"}
              </p>
            </div>
          ) : null}

          {sendResult?.ok ? (
            <div className="mt-5 grid gap-3 border border-primary/25 bg-primary/[0.035] p-4" aria-live="polite">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Send result</p>
              <p className="text-sm leading-6 text-white/70">
                Sent {sendResult.sent ?? 0} of {sendResult.total ?? 0}. Failed {sendResult.failed ?? 0}.
              </p>
              <p className="break-all font-mono text-[10px] uppercase tracking-[0.12em] text-white/35">
                {sendResult.broadcastId}
              </p>
            </div>
          ) : null}
        </form>
      </div>
    </section>
  );
}
