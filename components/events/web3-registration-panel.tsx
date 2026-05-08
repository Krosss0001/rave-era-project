"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Wallet } from "lucide-react";
import { getCurrentRole, type AuthProfile } from "@/lib/auth/get-role";
import { useLanguage } from "@/lib/i18n/use-language";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { SolanaDevnetPayment } from "@/components/payments/solana-devnet-payment";
import { TicketQr } from "@/components/shared/ticket-qr";
import { StatusBadge, getStatusBadgeVariant } from "@/components/shared/status-badge";
import { WalletConnect } from "@/components/shared/wallet-connect";
import { formatShortWalletAddress } from "@/components/shared/web3-utils";

type RegistrationRow = Database["public"]["Tables"]["registrations"]["Row"];
type TicketRow = Database["public"]["Tables"]["tickets"]["Row"];

type Web3RegistrationPanelProps = {
  eventId: string;
  eventPrice: number;
  referralCode?: string | null;
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  instagram: string;
  telegramUsername: string;
};

const emptyForm: FormState = {
  name: "",
  email: "",
  phone: "",
  instagram: "",
  telegramUsername: ""
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Registration failed.";
}

async function parseApiResponse(response: Response) {
  const data = await response.json();

  if (!response.ok || data?.ok === false) {
    throw new Error(data?.error || "Registration failed.");
  }

  return data as { registration: RegistrationRow; ticket: TicketRow; reused: boolean };
}

export function Web3RegistrationPanel({ eventId, eventPrice, referralCode }: Web3RegistrationPanelProps) {
  const { language } = useLanguage();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [registration, setRegistration] = useState<RegistrationRow | null>(null);
  const [ticket, setTicket] = useState<TicketRow | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const copy =
    language === "ua"
      ? {
          kicker: "Web3 реєстрація",
          lockedTitle: "Реєстрація через сайт",
          signedOut: "Реєстрація через сайт доступна після входу та підключення Phantom.",
          signedOutHint: "Sign in and connect Phantom to register with crypto on the website.",
          connectHint: "Connect Phantom to unlock on-site crypto registration.",
          connectBody: "Реєстрація через сайт доступна після входу та підключення Phantom.",
          readyTitle: "Register on website",
          readyBody: "Заповніть дані для квитка. Telegram залишається альтернативним шляхом.",
          walletConnected: "Phantom підключено",
          name: "Повне ім'я",
          email: "Email",
          phone: "Телефон",
          instagram: "Instagram nickname",
          telegram: "Telegram username (optional)",
          submit: "Зареєструватися на сайті",
          submitting: "Створення",
          reserved: "Reserved ticket",
          confirmed: "Квиток активний",
          payTitle: "Оплатити через Solana Devnet",
          payNote: "Після підтвердження оплати QR стане активним.",
          paymentConfirmed: "Оплату підтверджено. QR активний.",
          freeReady: "Безкоштовну реєстрацію підтверджено. QR активний.",
          reused: "Знайшли вашу існуючу реєстрацію і квиток.",
          required: "Заповніть ім'я, email, телефон та Instagram."
        }
      : {
          kicker: "Web3 registration",
          lockedTitle: "On-site registration",
          signedOut: "On-site registration is available after sign-in and Phantom connection.",
          signedOutHint: "Sign in and connect Phantom to register with crypto on the website.",
          connectHint: "Connect Phantom to unlock on-site crypto registration.",
          connectBody: "On-site registration is available after sign-in and Phantom connection.",
          signInPrompt: "Sign in or create an account to register on the website. Telegram remains available.",
          freeRule: "Free event: on-site registration is available after sign-in. Phantom is optional.",
          paidRule: "Paid event: connect Phantom to pay with Solana Devnet.",
          readyTitle: "Register on website",
          readyBody: "Fill in ticket details. Telegram remains the alternative path.",
          walletConnected: "Phantom connected",
          name: "Full name",
          email: "Email",
          phone: "Phone",
          instagram: "Instagram nickname",
          telegram: "Telegram username (optional)",
          submit: "Register on website",
          submitting: "Creating",
          reserved: "Reserved ticket",
          confirmed: "Ticket active",
          payTitle: "Pay with Solana Devnet",
          payNote: "After payment confirmation, QR will become active.",
          paymentConfirmed: "Payment confirmed. QR is active.",
          freeReady: "Free registration confirmed. QR is active.",
          reused: "Existing registration and ticket reused.",
          required: "Fill in name, email, phone, and Instagram."
        };

  useEffect(() => {
    let mounted = true;

    async function loadState() {
      if (!supabase) {
        setLoading(false);
        setErrorMessage("Supabase is not configured.");
        return;
      }

      const roleState = await getCurrentRole(supabase);

      if (!mounted) {
        return;
      }

      setSignedIn(Boolean(roleState.user));
      setProfile(roleState.profile);
      setForm((current) => ({
        ...current,
        name: current.name || roleState.profile?.full_name || "",
        email: current.email || roleState.user?.email || roleState.profile?.email || "",
        telegramUsername: current.telegramUsername || roleState.profile?.telegram_username || ""
      }));

      if (!roleState.user) {
        setRegistration(null);
        setTicket(null);
        setLoading(false);
        return;
      }

      const registrationResult = await supabase
        .from("registrations")
        .select("id,event_id,user_id,name,email,phone,instagram_nickname,telegram_username,telegram_user_id,referral_code,status,created_at")
        .eq("event_id", eventId)
        .eq("user_id", roleState.user.id)
        .maybeSingle();

      if (!mounted) {
        return;
      }

      if (registrationResult.error) {
        setErrorMessage("Could not load registration state.");
        setLoading(false);
        return;
      }

      const existingRegistration = registrationResult.data ?? null;
      setRegistration(existingRegistration);

      if (existingRegistration) {
        setForm((current) => ({
          name: current.name || existingRegistration.name || "",
          email: current.email || existingRegistration.email || "",
          phone: current.phone || existingRegistration.phone || "",
          instagram: current.instagram || existingRegistration.instagram_nickname || "",
          telegramUsername: current.telegramUsername || existingRegistration.telegram_username || ""
        }));

        const ticketResult = await supabase
          .from("tickets")
          .select("id,registration_id,event_id,user_id,ticket_code,qr_payload,status,payment_status,checked_in,checked_in_at,checked_in_by,created_at")
          .eq("registration_id", existingRegistration.id)
          .maybeSingle();

        if (!mounted) {
          return;
        }

        if (ticketResult.error) {
          setErrorMessage("Could not load ticket state.");
        } else {
          setTicket(ticketResult.data ?? null);
        }
      }

      setLoading(false);
    }

    loadState();

    const { data: listener } = supabase?.auth.onAuthStateChange(() => {
      loadState();
    }) ?? { data: null };

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, [eventId, supabase]);

  const walletAddress = profile?.wallet_address?.trim() ?? "";
  const isPaidEvent = Number(eventPrice) > 0;
  const canShowRegistrationFlow = signedIn && (!isPaidEvent || Boolean(walletAddress));
  const signInPrompt =
    language === "ua"
      ? "Увійдіть або створіть акаунт, щоб зареєструватися на сайті. Telegram залишається доступним."
      : "Sign in or create an account to register on the website. Telegram remains available.";
  const freeRule =
    language === "ua"
      ? "Безкоштовна подія: реєстрація на сайті доступна після входу. Phantom не обовʼязковий."
      : "Free event: on-site registration is available after sign-in. Phantom is optional.";
  const paidRule =
    language === "ua"
      ? "Платна подія: підключіть Phantom для оплати через Solana Devnet."
      : "Paid event: connect Phantom to pay with Solana Devnet.";
  const registrationRule = isPaidEvent ? paidRule : freeRule;
  const isQrUnlocked = ticket?.status === "active" && ticket.payment_status === "paid" && !ticket.checked_in && !ticket.checked_in_at;

  async function getAccessToken() {
    const { data } = await supabase?.auth.getSession() ?? { data: { session: null } };
    const token = data.session?.access_token;

    if (!token) {
      throw new Error("Sign in again before registration.");
    }

    return token;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setMessage("");

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.instagram.trim()) {
      setErrorMessage(copy.required);
      return;
    }

    setSubmitting(true);

    try {
      const token = await getAccessToken();
      const response = await fetch("/api/web3/registrations", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          event_id: eventId,
          name: form.name,
          email: form.email,
          phone: form.phone,
          instagram: form.instagram,
          telegram_username: form.telegramUsername,
          referral_code: referralCode
        })
      });
      const data = await parseApiResponse(response);
      setRegistration(data.registration);
      setTicket(data.ticket);
      setMessage(data.reused ? copy.reused : data.ticket.payment_status === "paid" ? copy.freeReady : copy.payNote);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  function handleSolanaPaymentConfirmed(input: { ticketId: string; signature: string | null }) {
    setTicket((currentTicket) =>
      currentTicket?.id === input.ticketId
        ? { ...currentTicket, payment_status: "paid", status: "active" }
        : currentTicket
    );
    setRegistration((currentRegistration) =>
      currentRegistration ? { ...currentRegistration, status: "confirmed" } : currentRegistration
    );
    setMessage(copy.paymentConfirmed);
  }

  function updateField(key: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="app-native-panel border-primary/15 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-primary/20 bg-primary/[0.035] text-primary">
          <Wallet className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">{copy.kicker}</p>
          <h2 className="mt-2 text-xl font-black uppercase leading-tight text-white">{canShowRegistrationFlow ? copy.readyTitle : copy.lockedTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-white/58">
            {canShowRegistrationFlow ? copy.readyBody : !signedIn ? signInPrompt : registrationRule}
          </p>
        </div>
      </div>

      <div className="mt-4 border-t border-white/[0.05] pt-4">
        {loading ? (
          <div className="grid gap-2" aria-label="Loading Web3 registration state">
            <div className="h-10 bg-white/[0.035] motion-safe:animate-pulse" />
            <div className="h-10 bg-white/[0.025] motion-safe:animate-pulse" />
          </div>
        ) : !signedIn ? (
          <p className="border border-white/[0.06] bg-black px-3 py-2 text-sm leading-6 text-white/58">{signInPrompt}</p>
        ) : isPaidEvent && !walletAddress ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-white/58">{paidRule}</p>
            <WalletConnect onWalletSaved={(address) => setProfile((current) => current ? { ...current, wallet_address: address } : current)} />
          </div>
        ) : (
          <div>
            {walletAddress ? (
              <div className="mb-4 border border-primary/25 bg-primary/[0.03] px-3 py-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">{copy.walletConnected}</p>
                <p className="mt-1 break-all font-mono text-sm text-white" title={walletAddress}>{formatShortWalletAddress(walletAddress)}</p>
              </div>
            ) : (
              <p className="mb-4 border border-primary/20 bg-primary/[0.025] px-3 py-2 text-sm leading-6 text-white/62">{freeRule}</p>
            )}

            {ticket ? (
              <div className="grid gap-4">
                <div className="border border-primary/20 bg-black p-4 shadow-[0_0_40px_rgba(0,255,136,0.055)]">
                  <div className="flex flex-col gap-3 min-[380px]:flex-row min-[380px]:items-start min-[380px]:justify-between">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">{isQrUnlocked ? copy.confirmed : copy.reserved}</p>
                      <p className="mt-2 font-mono text-lg font-semibold text-white">{ticket.ticket_code}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge label={ticket.status} variant={getStatusBadgeVariant(ticket.status)} size="sm" />
                      <StatusBadge label={ticket.payment_status} variant={getStatusBadgeVariant(ticket.payment_status)} size="sm" />
                    </div>
                  </div>
                </div>

                {isPaidEvent && ticket.status === "reserved" && ticket.payment_status === "pending" ? (
                  <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-primary">{copy.payTitle}</p>
                    <p className="mt-2 text-sm leading-6 text-white/58">{copy.payNote}</p>
                    <SolanaDevnetPayment ticketId={ticket.id} onConfirmed={handleSolanaPaymentConfirmed} title={copy.payTitle} />
                  </div>
                ) : (
                  <div className="border border-primary/20 bg-black p-3 shadow-[0_0_36px_rgba(0,255,136,0.055)]">
                    <TicketQr
                      ticket={ticket}
                      locked={!isQrUnlocked}
                      lockedMessage={copy.payNote}
                    />
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-3" noValidate>
                {[
                  { key: "name", label: copy.name, type: "text", autoComplete: "name", required: true },
                  { key: "email", label: copy.email, type: "email", autoComplete: "email", required: true },
                  { key: "phone", label: copy.phone, type: "tel", autoComplete: "tel", required: true },
                  { key: "instagram", label: copy.instagram, type: "text", autoComplete: "username", required: true },
                  { key: "telegramUsername", label: copy.telegram, type: "text", autoComplete: "username", required: false }
                ].map((field) => (
                  <label key={field.key} className="grid gap-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/42">
                      {field.label}{field.required ? " *" : ""}
                    </span>
                    <input
                      value={form[field.key as keyof FormState]}
                      onChange={(changeEvent) => updateField(field.key as keyof FormState, changeEvent.target.value)}
                      type={field.type}
                      required={field.required}
                      autoComplete={field.autoComplete}
                      spellCheck={false}
                      className="focus-ring min-h-11 border border-white/[0.08] bg-black px-3 py-2 text-sm text-white transition duration-200 placeholder:text-white/25 hover:border-primary/25"
                    />
                  </label>
                ))}
                <button
                  type="submit"
                  disabled={submitting}
                  aria-busy={submitting}
                  className="focus-ring mt-2 inline-flex min-h-12 items-center justify-center gap-2 bg-primary px-4 py-3 font-mono text-[11px] font-black uppercase tracking-[0.13em] text-black transition duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                  {submitting ? copy.submitting : copy.submit}
                </button>
              </form>
            )}
          </div>
        )}

        {message ? <p className="mt-3 text-sm leading-6 text-white/58" aria-live="polite">{message}</p> : null}
        {errorMessage ? <p className="mt-3 border border-red-400/25 bg-red-400/[0.035] px-3 py-2 text-sm leading-6 text-red-100" aria-live="polite">{errorMessage}</p> : null}
      </div>
    </section>
  );
}
