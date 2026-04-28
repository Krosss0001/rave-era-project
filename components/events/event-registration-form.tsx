"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CheckCircle2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/use-language";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isFreePrice } from "@/lib/format";
import { buildQrPayload, generateTicketCode } from "@/lib/tickets";
import { buildTelegramUrl } from "@/lib/telegram";
import type { Database } from "@/lib/supabase/types";
import { TicketQr } from "@/components/shared/ticket-qr";
import { StatusBadge, getStatusBadgeVariant } from "@/components/shared/status-badge";

type EventRegistrationFormProps = {
  eventId: string;
  eventSlug: string;
  eventPrice: number;
  referralCode?: string | null;
};

type RegistrationRow = Pick<Database["public"]["Tables"]["registrations"]["Row"], "id" | "event_id" | "user_id" | "status">;
type TicketPreview = Pick<Database["public"]["Tables"]["tickets"]["Row"], "ticket_code" | "qr_payload" | "status" | "payment_status">;

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

export function EventRegistrationForm({ eventId, eventSlug, eventPrice, referralCode }: EventRegistrationFormProps) {
  const { language } = useLanguage();
  const isFreeEvent = isFreePrice(eventPrice);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const telegramUrl = useMemo(() => buildTelegramUrl(eventSlug, referralCode), [eventSlug, referralCode]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [ticket, setTicket] = useState<TicketPreview | null>(null);
  const copy =
    language === "ua"
      ? {
          title: "Резервна веб-реєстрація",
          description: isFreeEvent ? "Безкоштовна подія: реєстрацію буде збережено, а квиток зʼявиться у вашому кабінеті." : "Оплату буде підключено наступним етапом.",
          open: "Веб-реєстрація",
          registered: "Ви зареєстровані",
          nextTelegram: "Наступний крок: продовжити в Telegram",
          ticketCode: "Код квитка",
          payment: "Оплата",
          name: "Ім'я",
          email: "Email",
          telegramUsername: "Telegram username",
          signInRequired: "Увійдіть, щоб зареєструватися.",
          missingEvent: "ID події відсутній. Оновіть сторінку і спробуйте ще раз.",
          nameRequired: "Вкажіть ім'я.",
          invalidEmail: "Вкажіть коректний email.",
          alreadyRegistered: "Ви вже зареєстровані на цю подію.",
          registrationReceived: "Реєстрацію отримано. Квиток збережено у вашому кабінеті.",
          soldOut: "Подію вже розпродано.",
          genericError: "Не вдалося завершити реєстрацію. Спробуйте ще раз.",
          continueTelegram: "Продовжити в Telegram",
          dashboard: "Мої квитки",
          submit: "Надіслати",
          submitting: "Надсилання"
        }
      : {
          title: "Web fallback registration",
          description: isFreeEvent ? "Free event: registration is saved and the ticket appears in your dashboard." : "Payment will be connected next.",
          open: "Web fallback registration",
          registered: "You are registered",
          nextTelegram: "Next step: continue in Telegram",
          ticketCode: "Ticket code",
          payment: "Payment",
          name: "Name",
          email: "Email",
          telegramUsername: "Telegram username",
          signInRequired: "Sign in to register.",
          missingEvent: "Event ID is missing. Refresh this page and try again.",
          nameRequired: "Name is required.",
          invalidEmail: "Enter a valid email address.",
          alreadyRegistered: "You are already registered for this event.",
          registrationReceived: "Registration received. The ticket is saved in your dashboard.",
          soldOut: "Event is sold out.",
          genericError: "Registration could not be completed. Try again.",
          continueTelegram: "Continue in Telegram",
          dashboard: "My tickets",
          submit: "Submit",
          submitting: "Submitting"
        };

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
      .select("ticket_code,qr_payload,status,payment_status")
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
        .select("ticket_code,qr_payload,status,payment_status")
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
      setMessage({ type: "error", text: copy.missingEvent });
      return;
    }

    if (!name) {
      setMessage({ type: "error", text: copy.nameRequired });
      return;
    }

    if (!email || !isValidEmail(email)) {
      setMessage({ type: "error", text: copy.invalidEmail });
      return;
    }

    if (!supabase) {
      setMessage({ type: "error", text: "Supabase is not configured for registrations." });
      return;
    }

    if (!userId) {
      setMessage({
        type: "error",
        text: copy.signInRequired
      });
      return;
    }

    setLoading(true);

    try {
      const existingRegistration = await getExistingRegistration(userId);

      if (existingRegistration) {
        if (isFreeEvent && existingRegistration.status !== "confirmed") {
          await supabase
            .from("registrations")
            .update({ status: "confirmed" })
            .eq("id", existingRegistration.id);
        }

        const existingTicket = await createTicketForRegistration(existingRegistration, userId);

        setTicket(existingTicket);
        setMessage({ type: "success", text: copy.alreadyRegistered });
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
          status: isFreeEvent ? "confirmed" : "pending"
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
            setMessage({ type: "success", text: copy.alreadyRegistered });
            return;
          }
        }

        throw new Error(registrationError?.message || "Registration could not be saved.");
      }

      const nextTicket = await createTicketForRegistration(registration, userId);

      setTicket(nextTicket);
      setMessage({ type: "success", text: copy.registrationReceived });
      setForm((current) => ({
        ...initialForm,
        email: current.email
      }));
    } catch (error) {
      const cleanMessage = getCleanErrorMessage(error, copy.genericError);
      setMessage({ type: "error", text: cleanMessage === "sold_out" ? copy.soldOut : cleanMessage });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="group relative border border-white/[0.06] bg-[#020202] p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/42">{copy.title}</p>
          <p className="mt-2 text-sm leading-6 text-white/45">{copy.description}</p>
        </div>
        <span className="shrink-0 border border-white/[0.06] bg-[#030303] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">
          Web
        </span>
      </div>

      {ticket ? (
        <div className="mt-5 border border-[#00FF88]/30 bg-[#00FF88]/[0.04] p-4">
          <div className="flex items-start gap-2 text-[#00FF88]">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em]">{copy.registered}</p>
              <p className="mt-2 text-sm leading-6 text-white/65">{copy.nextTelegram}</p>
            </div>
          </div>
          <div className="mt-4 border border-white/[0.05] bg-black px-3 py-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">{copy.ticketCode}</p>
            <p className="mt-1 break-words font-mono text-xl font-semibold text-white">{ticket.ticket_code}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge label={ticket.status} variant={getStatusBadgeVariant(ticket.status)} size="sm" />
              <StatusBadge label={`${copy.payment} ${ticket.payment_status}`} variant={getStatusBadgeVariant(ticket.payment_status)} size="sm" />
            </div>
          </div>
          <div className="mt-4">
            <TicketQr
              ticket={ticket}
              locked={ticket.status !== "active" || ticket.payment_status !== "paid"}
              lockedMessage={language === "ua" ? "QR відкриється, коли квиток стане активним і підтвердженим." : "QR unlocks when this ticket is active and paid."}
            />
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <a
              href={telegramUrl}
              target="_blank"
              rel="noreferrer"
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 border border-[#00FF88] px-5 py-2.5 text-center font-mono text-[11px] font-bold uppercase leading-5 tracking-[0.16em] text-[#00FF88] transition duration-200 hover:bg-[#00FF88] hover:text-black active:scale-[0.99] sm:tracking-widest"
            >
              <span className="min-w-0">{copy.continueTelegram}</span>
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
            <Link
              href="/dashboard"
              className="focus-ring inline-flex min-h-11 items-center justify-center border border-white/[0.08] px-5 py-2.5 text-center font-mono text-[11px] font-bold uppercase leading-5 tracking-[0.16em] text-white/55 transition duration-200 hover:border-[#00FF88]/30 hover:text-[#00FF88] active:scale-[0.99] sm:tracking-widest"
            >
              {copy.dashboard}
            </Link>
          </div>
        </div>
      ) : !open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="focus-ring mt-5 min-h-11 w-full border border-primary/35 bg-primary/[0.025] px-5 py-2.5 text-center font-mono text-[11px] font-bold uppercase leading-5 tracking-[0.14em] text-primary transition duration-200 hover:bg-primary hover:text-black active:scale-[0.99]"
        >
          {copy.open}
        </button>
      ) : (
        <form onSubmit={submitRegistration} className="mt-5 grid gap-4">
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">{copy.name}</span>
            <input
              type="text"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              autoComplete="name"
              required
              className="mt-2 min-h-11 w-full border border-white/[0.08] bg-black px-3 text-sm text-white outline-none transition duration-200 focus:border-[#00FF88]"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">{copy.email}</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              autoComplete="email"
              required
              className="mt-2 min-h-11 w-full border border-white/[0.08] bg-black px-3 font-mono text-sm text-white outline-none transition duration-200 focus:border-[#00FF88]"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">{copy.telegramUsername}</span>
            <input
              type="text"
              value={form.telegramUsername}
              onChange={(event) => updateField("telegramUsername", event.target.value)}
              placeholder="@username"
              autoComplete="username"
              className="mt-2 min-h-11 w-full border border-white/[0.08] bg-black px-3 font-mono text-sm text-white outline-none transition duration-200 focus:border-[#00FF88]"
            />
          </label>

          {!userId && authChecked ? (
            <p className="border border-white/[0.05] bg-[#030303] px-3 py-2 text-xs leading-5 text-white/45">
              {copy.signInRequired}
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
            className="focus-ring min-h-11 border border-[#00FF88]/55 bg-[#00FF88]/[0.025] px-5 py-2.5 text-center font-mono text-[11px] font-bold uppercase leading-5 tracking-[0.14em] text-[#00FF88] transition duration-200 hover:bg-[#00FF88] hover:text-black active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {loading ? copy.submitting : copy.submit}
          </button>
        </form>
      )}
    </section>
  );
}
