"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CheckCircle2, ExternalLink, UserPlus } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/use-language";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { buildQrPayload, generateTicketCode } from "@/lib/tickets";
import { buildTelegramUrl } from "@/lib/telegram";
import type { Database } from "@/lib/supabase/types";

type EventRegistrationFormProps = {
  eventId: string;
  eventSlug: string;
  referralCode?: string | null;
};

type RegistrationRow = Pick<Database["public"]["Tables"]["registrations"]["Row"], "id" | "event_id" | "user_id" | "status">;
type TicketPreview = Pick<Database["public"]["Tables"]["tickets"]["Row"], "ticket_code" | "status" | "payment_status">;

type FormState = {
  name: string;
  email: string;
  telegramUsername: string;
};

const initialForm: FormState = {
  name: "",
  email: "",
  telegramUsername: ""
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isTicketCodeCollision(error: { code?: string; message?: string } | null) {
  return error?.code === "23505" || Boolean(error?.message?.toLowerCase().includes("ticket_code"));
}

function isMissingRow(error: { code?: string } | null) {
  return error?.code === "PGRST116";
}

function isUniqueCollision(error: { code?: string } | null) {
  return error?.code === "23505";
}

function isSoldOutError(error: { message?: string } | null) {
  return Boolean(error?.message?.toLowerCase().includes("sold out") || error?.message === "sold_out");
}

function getCleanErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    if (error.message.toLowerCase().includes("sold out") || error.message === "sold_out") {
      return "sold_out";
    }
  }

  return fallback;
}

export function EventRegistrationForm({ eventId, eventSlug, referralCode }: EventRegistrationFormProps) {
  const { dictionary } = useLanguage();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const telegramUrl = useMemo(() => buildTelegramUrl(eventSlug, referralCode), [eventSlug, referralCode]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [ticket, setTicket] = useState<TicketPreview | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      if (!supabase) {
        setAuthChecked(true);
        return;
      }

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!mounted) {
        return;
      }

      setUserId(user?.id ?? null);
      setForm((current) => ({
        ...current,
        email: current.email || user?.email || ""
      }));
      setAuthChecked(true);
    }

    loadSession();

    const { data: listener } = supabase?.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      setForm((current) => ({
        ...current,
        email: current.email || session?.user.email || ""
      }));
      setAuthChecked(true);
    }) ?? { data: null };

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, [supabase]);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function getExistingRegistration(currentUserId: string): Promise<RegistrationRow | null> {
    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from("registrations")
      .select("id,event_id,user_id,status")
      .eq("event_id", eventId)
      .eq("user_id", currentUserId)
      .maybeSingle();

    if (error && !isMissingRow(error)) {
      throw new Error("Registration status could not be checked.");
    }

    return data;
  }

  async function checkCapacity() {
    if (!supabase) {
      throw new Error("Supabase is not configured for registrations.");
    }

    const [eventResult, countResult] = await Promise.all([
      supabase.from("events").select("capacity").eq("id", eventId).maybeSingle(),
      supabase.rpc("get_event_registration_count", { event_id_input: eventId })
    ]);

    if (eventResult.error || !eventResult.data) {
      throw new Error("Event is not available.");
    }

    if (countResult.error) {
      throw new Error("Event capacity could not be checked.");
    }

    if ((countResult.data ?? 0) >= eventResult.data.capacity) {
      throw new Error("Event is sold out");
    }
  }

  async function getTicketForRegistration(registrationId: string): Promise<TicketPreview | null> {
    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from("tickets")
      .select("ticket_code,status,payment_status")
      .eq("registration_id", registrationId)
      .maybeSingle();

    if (error && !isMissingRow(error)) {
      throw new Error("Ticket status could not be checked.");
    }

    return data;
  }

  async function createTicketForRegistration(registration: RegistrationRow, currentUserId: string): Promise<TicketPreview> {
    if (!supabase) {
      throw new Error("Supabase is not configured for tickets.");
    }

    const existingTicket = await getTicketForRegistration(registration.id);

    if (existingTicket) {
      return existingTicket;
    }

    let lastError: { code?: string; message?: string } | null = null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const nextTicketCode = generateTicketCode();
      const { data, error } = await supabase
        .from("tickets")
        .insert({
          registration_id: registration.id,
          event_id: registration.event_id,
          user_id: currentUserId,
          ticket_code: nextTicketCode,
          qr_payload: buildQrPayload(nextTicketCode, registration.event_id, currentUserId),
          status: "reserved",
          payment_status: "pending"
        })
        .select("ticket_code,status,payment_status")
        .single();

      if (!error && data) {
        return data;
      }

      lastError = error;

      if (isUniqueCollision(error) && !isTicketCodeCollision(error)) {
        const recoveredTicket = await getTicketForRegistration(registration.id);

        if (recoveredTicket) {
          return recoveredTicket;
        }
      }

      if (!isTicketCodeCollision(error)) {
        break;
      }
    }

    throw new Error(lastError?.message || "Ticket could not be created.");
  }

  async function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setTicket(null);

    const name = form.name.trim();
    const email = form.email.trim();
    const telegramUsername = form.telegramUsername.trim();

    if (!eventId) {
      setMessage({ type: "error", text: dictionary.events.missingEvent });
      return;
    }

    if (!name) {
      setMessage({ type: "error", text: dictionary.events.nameRequired });
      return;
    }

    if (!email || !isValidEmail(email)) {
      setMessage({ type: "error", text: dictionary.events.invalidEmail });
      return;
    }

    if (!supabase) {
      setMessage({ type: "error", text: "Supabase is not configured for registrations." });
      return;
    }

    if (!userId) {
      setMessage({
        type: "error",
        text: dictionary.events.signInRequired
      });
      return;
    }

    setLoading(true);

    try {
      const existingRegistration = await getExistingRegistration(userId);

      if (existingRegistration) {
        const existingTicket = await createTicketForRegistration(existingRegistration, userId);

        setTicket(existingTicket);
        setMessage({ type: "success", text: dictionary.events.alreadyRegistered });
        return;
      }

      await checkCapacity();

      const { data: registration, error: registrationError } = await supabase
        .from("registrations")
        .insert({
          event_id: eventId,
          user_id: userId,
          name,
          email,
          telegram_username: telegramUsername || null,
          status: "pending"
        })
        .select("id,event_id,user_id,status")
        .single();

      if (registrationError || !registration) {
        if (isSoldOutError(registrationError)) {
          throw new Error("sold_out");
        }

        if (isUniqueCollision(registrationError)) {
          const recoveredRegistration = await getExistingRegistration(userId);

          if (recoveredRegistration) {
            const recoveredTicket = await createTicketForRegistration(recoveredRegistration, userId);

            setTicket(recoveredTicket);
            setMessage({ type: "success", text: dictionary.events.alreadyRegistered });
            return;
          }
        }

        throw new Error(registrationError?.message || "Registration could not be saved.");
      }

      const nextTicket = await createTicketForRegistration(registration, userId);

      setTicket(nextTicket);
      setMessage({ type: "success", text: dictionary.events.registrationReceived });
      setForm((current) => ({
        ...initialForm,
        email: current.email
      }));
    } catch (error) {
      const cleanMessage = getCleanErrorMessage(error, dictionary.events.genericError);
      setMessage({ type: "error", text: cleanMessage === "sold_out" ? dictionary.events.soldOut : cleanMessage });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="group relative border border-[#00FF88]/20 bg-[#020202] p-5 shadow-[0_0_90px_rgba(0,255,136,0.07)]">
      <span className="absolute left-0 top-0 h-px w-full bg-[#00FF88]" aria-hidden="true" />
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-[#00FF88]/30 bg-[#030303] text-[#00FF88]">
          <UserPlus className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00FF88]">{dictionary.events.registration}</p>
          <h2 className="mt-2 text-2xl font-black uppercase leading-none">{dictionary.events.reserveAccess}</h2>
          <p className="mt-2 text-sm leading-6 text-white/45">
            {dictionary.events.submitDetails}
          </p>
        </div>
      </div>

      {ticket ? (
        <div className="mt-5 border border-[#00FF88]/30 bg-[#00FF88]/[0.04] p-4">
          <div className="flex items-start gap-2 text-[#00FF88]">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em]">{dictionary.events.registered}</p>
              <p className="mt-2 text-sm leading-6 text-white/65">{dictionary.events.nextTelegram}</p>
            </div>
          </div>
          <div className="mt-4 border border-white/[0.05] bg-black px-3 py-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">{dictionary.events.ticketCode}</p>
            <p className="mt-1 font-mono text-xl font-semibold text-white">{ticket.ticket_code}</p>
            <div className="mt-3 flex flex-wrap gap-2 font-mono text-[9px] uppercase tracking-[0.16em]">
              <span className="border border-[#00FF88]/25 bg-[#00FF88]/[0.035] px-2 py-1 text-[#00FF88]">{ticket.status}</span>
              <span className="border border-white/[0.06] bg-[#020202] px-2 py-1 text-white/45">{dictionary.events.payment} {ticket.payment_status}</span>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <a
              href={telegramUrl}
              target="_blank"
              rel="noreferrer"
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 border border-[#00FF88] px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest text-[#00FF88] motion-safe:transition-[background-color,color,transform] motion-safe:duration-500 hover:bg-[#00FF88] hover:text-black active:scale-[0.98]"
            >
              {dictionary.events.continueTelegram}
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
            <Link
              href="/dashboard"
              className="focus-ring inline-flex min-h-11 items-center justify-center border border-white/[0.08] px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest text-white/55 motion-safe:transition-[border-color,color,transform] motion-safe:duration-500 hover:border-[#00FF88]/30 hover:text-[#00FF88] active:scale-[0.98]"
            >
              {dictionary.nav.dashboard}
            </Link>
          </div>
        </div>
      ) : !open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="focus-ring mt-5 min-h-11 w-full bg-[#00FF88] px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest text-black motion-safe:transition-[filter,transform,box-shadow] motion-safe:duration-500 motion-safe:ease-out hover:brightness-110 hover:shadow-[0_0_34px_rgba(0,255,136,0.16)] active:scale-[0.98]"
        >
          {dictionary.nav.registration}
        </button>
      ) : (
        <form onSubmit={submitRegistration} className="mt-5 grid gap-4">
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">{dictionary.events.name}</span>
            <input
              type="text"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              autoComplete="name"
              required
              className="mt-2 min-h-11 w-full border border-white/[0.08] bg-black px-3 text-sm text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-[#00FF88]"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">{dictionary.events.email}</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              autoComplete="email"
              required
              className="mt-2 min-h-11 w-full border border-white/[0.08] bg-black px-3 font-mono text-sm text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-[#00FF88]"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">{dictionary.events.telegramUsername}</span>
            <input
              type="text"
              value={form.telegramUsername}
              onChange={(event) => updateField("telegramUsername", event.target.value)}
              placeholder="@username"
              autoComplete="username"
              className="mt-2 min-h-11 w-full border border-white/[0.08] bg-black px-3 font-mono text-sm text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-[#00FF88]"
            />
          </label>

          {!userId && authChecked ? (
            <p className="border border-white/[0.05] bg-[#030303] px-3 py-2 text-xs leading-5 text-white/45">
              {dictionary.events.signInRequired}
            </p>
          ) : null}

          {message ? (
            <div
              className={message.type === "success" ? "border border-[#00FF88]/30 bg-[#00FF88]/[0.04] p-4 text-sm text-[#00FF88]" : "border border-red-400/25 bg-red-400/[0.035] p-4 text-sm text-red-100"}
              aria-live="polite"
            >
              <div className="flex items-start gap-2">
                {message.type === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : null}
                <span>{message.text}</span>
              </div>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="focus-ring min-h-11 bg-[#00FF88] px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest text-black motion-safe:transition-[filter,transform,opacity] motion-safe:duration-500 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {loading ? dictionary.events.submitting : dictionary.events.submitRegistration}
          </button>
        </form>
      )}
    </section>
  );
}
