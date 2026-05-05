"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Send, UsersRound } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getTelegramBotDisplayName } from "@/lib/telegram";
import type { BroadcastAudience } from "@/lib/supabase/types";
import { StatusBadge } from "@/components/shared/status-badge";

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
  skippedCount?: number;
  firstFailureReasons?: string[];
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
  skipped?: number;
  firstFailureReasons?: string[];
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

function isEventAudience(audience: BroadcastAudience) {
  return audience !== "all_telegram_users" && audience !== "bot_interacted_not_registered";
}

function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://rave-era-project.vercel.app").replace(/\/+$/, "");
}

function formatPreviewMessage(input: {
  message: string;
  event: BroadcastEventOption | null;
}) {
  const header = "Повідомлення від Rave'era Group";
  const footer = "/stop щоб відписатися";
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
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [sendResult, setSendResult] = useState<SendResponse | null>(null);
  const [busy, setBusy] = useState<"preview" | "send" | null>(null);
  const [error, setError] = useState("");

  const selectedEvent = events.find((event) => event.id === eventId) ?? null;
  const eventRequired = requireEvent || isEventAudience(audience);
  const previewMessage = formatPreviewMessage({ message, event: eventRequired ? selectedEvent : null });
  const previewCount = preview?.estimatedRecipientCount ?? 0;
  const botDisplayName = getTelegramBotDisplayName();

  useEffect(() => {
    if (eventRequired && !selectedEvent && events[0]) {
      setEventId(events[0].id);
    }
  }, [eventRequired, events, selectedEvent]);

  async function callBroadcastApi<T>(path: string): Promise<T> {
    if (!supabase) {
      throw new Error("Supabase is not configured.");
    }

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Sign in to use broadcasts.");
    }

    const response = await fetch(path, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        audience,
        eventId: eventRequired ? selectedEvent?.id ?? null : null,
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
      throw new Error("Enter a message.");
    }

    if (eventRequired && !selectedEvent) {
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
      setError(requestError instanceof Error ? requestError.message : "Preview could not be prepared.");
    } finally {
      setBusy(null);
    }
  }

  async function sendBroadcast() {
    setError("");

    try {
      validateForm();
      if (!preview?.ok) {
        throw new Error("Preview the audience before sending.");
      }

      if (!window.confirm(`Are you sure you want to send to ${previewCount} users?`)) {
        return;
      }

      setBusy("send");
      setSendResult(await callBroadcastApi<SendResponse>("/api/telegram/broadcast/send"));
    } catch (requestError) {
      setSendResult(null);
      setError(requestError instanceof Error ? requestError.message : "Broadcast could not be sent.");
    } finally {
      setBusy(null);
    }
  }

  function formatPercent(value: number | undefined, total: number | undefined) {
    const denominator = total ?? 0;

    if (!denominator) {
      return "0%";
    }

    return `${Math.round(((value ?? 0) / denominator) * 100)}%`;
  }

  function getReadableError(reason: string) {
    const normalized = reason.toLowerCase();

    if (normalized.includes("token")) {
      return "Telegram bot token missing or invalid.";
    }

    if (normalized.includes("/start") || normalized.includes("chat_id") || normalized.includes("blocked")) {
      return "User has not started the bot or cannot receive messages.";
    }

    if (normalized.includes("telegram api")) {
      return reason;
    }

    return reason;
  }

  return (
    <section className="border-y border-white/[0.05] bg-[#020202] py-8">
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary sm:tracking-[0.26em]">{eyebrow}</p>
          <h2 className="mt-3 text-[clamp(1.85rem,9vw,3rem)] font-black uppercase leading-[0.98] text-white">{title}</h2>
          <p className="mt-5 max-w-xl text-sm leading-6 text-white/58">{description}</p>
          <p className="mt-4 max-w-xl border border-white/[0.06] bg-[#030303] px-4 py-3 text-xs leading-5 text-white/50">
            Users must press /start in {botDisplayName} before broadcasts can reach them.
          </p>
          <div className="mt-8 border border-white/[0.06] bg-[#030303] p-4">
            <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/52 sm:tracking-[0.18em]">
              <Send className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Message preview
            </p>
            <pre className="mt-4 whitespace-pre-wrap break-words font-sans text-sm leading-6 text-white/70">{previewMessage}</pre>
          </div>
        </div>

        <form onSubmit={previewAudience} className="min-w-0 border border-white/[0.06] bg-[#030303] p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">Audience</span>
              <select
                value={audience}
                onChange={(event) => {
                  setAudience(event.target.value as BroadcastAudience);
                  setPreview(null);
                  setSendResult(null);
                  setError("");
                }}
                className="mt-2 min-h-12 w-full border border-white/[0.08] bg-[#020202] px-3 font-mono text-xs uppercase text-white outline-none motion-safe:transition-colors motion-safe:duration-300 focus:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {audienceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {eventRequired ? (
              <label className="block md:col-span-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">Event</span>
                <select
                  value={selectedEvent?.id ?? ""}
                  onChange={(event) => {
                    setEventId(event.target.value);
                    setPreview(null);
                    setSendResult(null);
                    setError("");
                  }}
                  className="mt-2 min-h-12 w-full border border-white/[0.08] bg-[#020202] px-3 text-sm text-white outline-none motion-safe:transition-colors motion-safe:duration-300 focus:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {events.length === 0 ? <option value="">No available events</option> : null}
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
                className="mt-2 w-full resize-y border border-white/[0.08] bg-[#020202] px-3 py-3 text-sm leading-6 text-white outline-none motion-safe:transition-colors motion-safe:duration-300 focus:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              />
            </label>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="submit"
              disabled={busy !== null}
              className="focus-ring min-h-12 border border-primary px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-primary motion-safe:transition-[background-color,color,transform,opacity] motion-safe:duration-300 hover:bg-primary hover:text-black active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {busy === "preview" ? "Preparing" : "Preview audience"}
            </button>
            <button
              type="button"
              onClick={sendBroadcast}
              disabled={busy !== null || !preview?.ok}
              className="focus-ring min-h-12 bg-primary px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-black motion-safe:transition-[filter,transform,opacity] motion-safe:duration-300 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {busy === "send" ? "Sending" : "Send broadcast"}
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
                <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/42">
                  <UsersRound className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  {preview.audienceLabel}
                </p>
                <p className="font-mono text-2xl font-semibold tabular-nums text-white">{preview.estimatedRecipientCount ?? 0}</p>
              </div>
              <p className="text-xs leading-5 text-white/45">
                Sample: {(preview.sampleRecipients ?? []).map((recipient) => recipient.chat_id).join(", ") || "No recipients yet"}
              </p>
              <p className="text-xs leading-5 text-white/45">
                Preview count before send: {preview.estimatedRecipientCount ?? 0}. Skipped: {preview.skippedCount ?? 0}.
              </p>
              {(preview.firstFailureReasons ?? []).length > 0 ? (
                <ul className="grid gap-1 text-xs leading-5 text-red-100/80">
                  {preview.firstFailureReasons?.map((reason) => (
                    <li key={reason}>{getReadableError(reason)}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {sendResult?.ok ? (
            <div className="mt-5 grid gap-3 border border-primary/25 bg-primary/[0.035] p-4" aria-live="polite">
              <StatusBadge label="Send result" variant="success" size="sm" className="justify-self-start" />
              <p className="text-sm leading-6 text-white/70">
                Sent: {sendResult.sent ?? 0} ({formatPercent(sendResult.sent, sendResult.total)}). Failed: {sendResult.failed ?? 0} ({formatPercent(sendResult.failed, sendResult.total)}). Skipped: {sendResult.skipped ?? 0} ({formatPercent(sendResult.skipped, sendResult.total)}). Total: {sendResult.total ?? 0}.
              </p>
              {(sendResult.firstFailureReasons ?? []).length > 0 ? (
                <ul className="grid gap-1 text-xs leading-5 text-red-100/80">
                  {sendResult.firstFailureReasons?.map((reason) => (
                    <li key={reason}>{getReadableError(reason)}</li>
                  ))}
                </ul>
              ) : null}
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
