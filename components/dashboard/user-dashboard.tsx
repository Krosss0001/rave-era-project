"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Copy, Share2 } from "lucide-react";
import { getCurrentRole, type AuthProfile } from "@/lib/auth/get-role";
import { useLanguage } from "@/lib/i18n/use-language";
import { getPaymentPlaceholderCopy } from "@/lib/payment-placeholder";
import { buildReferralUrl } from "@/lib/referral";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { TicketQr } from "@/components/shared/ticket-qr";
import { SolanaDevnetPayment } from "@/components/payments/solana-devnet-payment";
import { StatusBadge, getStatusBadgeVariant } from "@/components/shared/status-badge";
import { formatShortWalletAddress } from "@/components/shared/web3-utils";
import { WalletConnect } from "@/components/shared/wallet-connect";

type RegistrationRow = Database["public"]["Tables"]["registrations"]["Row"];
type TicketRow = Database["public"]["Tables"]["tickets"]["Row"];
type ReferralRow = Database["public"]["Tables"]["referrals"]["Row"];
type EventSummary = Pick<Database["public"]["Tables"]["events"]["Row"], "id" | "slug" | "title" | "date" | "city" | "price">;

function isString(value: string | null): value is string {
  return Boolean(value);
}

function getQrLockedMessage(ticket: TicketRow, language: "ua" | "en") {
  if (ticket.status === "used" || ticket.checked_in || ticket.checked_in_at) {
    return language === "ua"
      ? "Цей квиток уже використано для входу."
      : "This ticket has already been used for entry.";
  }

  return getPaymentPlaceholderCopy(language);
}

export function UserDashboard() {
  const { dictionary, language } = useLanguage();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [email, setEmail] = useState("");
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [ticketEvents, setTicketEvents] = useState<Record<string, EventSummary>>({});
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [visibleQrTicketId, setVisibleQrTicketId] = useState<string | null>(null);
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      if (!supabase) {
        setLoading(false);
        setErrorMessage("Supabase is not configured.");
        return;
      }

      const roleState = await getCurrentRole(supabase);

      if (!roleState.user) {
        setLoading(false);
        setErrorMessage(dictionary.dashboard.signIn);
        return;
      }

      setErrorMessage(null);

      const [registrationResult, ticketResult, referralResult] = await Promise.all([
        supabase
          .from("registrations")
          .select("id,event_id,user_id,name,email,phone,instagram_nickname,telegram_username,telegram_user_id,referral_code,status,created_at")
          .eq("user_id", roleState.user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("tickets")
          .select("id,registration_id,event_id,user_id,ticket_code,qr_payload,status,payment_status,checked_in,checked_in_at,checked_in_by,created_at")
          .eq("user_id", roleState.user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("referrals")
          .select("id,event_id,owner_user_id,created_by,code,source,label,clicks,telegram_starts,registrations,confirmed,paid,checked_in,created_at,updated_at")
          .eq("owner_user_id", roleState.user.id)
          .order("created_at", { ascending: false })
      ]);

      if (!mounted) {
        return;
      }

      if (registrationResult.error || ticketResult.error || referralResult.error) {
        setErrorMessage(dictionary.dashboard.dataError);
        setLoading(false);
        return;
      }

      const visibleRegistrations = registrationResult.data ?? [];
      const visibleTickets = ticketResult.data ?? [];
      const visibleReferrals = referralResult.data ?? [];
      const eventIds = Array.from(
        new Set(
          [
            ...visibleRegistrations.map((registration) => registration.event_id),
            ...visibleTickets.map((ticket) => ticket.event_id),
            ...visibleReferrals.map((referral) => referral.event_id)
          ].filter(isString)
        )
      );
      const eventResult =
        eventIds.length > 0
          ? await supabase
              .from("events")
              .select("id,slug,title,date,city,price")
              .in("id", eventIds)
          : { data: [] };

      if (!mounted) {
        return;
      }

      setProfile(roleState.profile);
      setEmail(roleState.user.email ?? roleState.profile?.email ?? "");
      setRegistrations(visibleRegistrations);
      setTickets(visibleTickets);
      setTicketEvents(
        (eventResult.data ?? []).reduce<Record<string, EventSummary>>((items, event) => {
          items[event.id] = event;
          return items;
        }, {})
      );
      setReferrals(visibleReferrals);
      setErrorMessage(eventResult && "error" in eventResult && eventResult.error ? dictionary.dashboard.eventDetailsError : null);
      setLoading(false);
    }

    loadDashboard();

    const { data: listener } = supabase?.auth.onAuthStateChange(() => {
      loadDashboard();
    }) ?? { data: null };

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, [dictionary.dashboard.dataError, dictionary.dashboard.eventDetailsError, dictionary.dashboard.signIn, supabase]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="border border-white/[0.05] bg-[#020202] p-4">
            <div className="h-3 w-24 bg-primary/15 motion-safe:animate-pulse" />
            <div className="mt-5 h-8 w-3/4 bg-white/[0.04] motion-safe:animate-pulse" />
            <div className="mt-4 h-4 w-full bg-white/[0.035] motion-safe:animate-pulse" />
            <div className="mt-2 h-4 w-2/3 bg-white/[0.035] motion-safe:animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  const primaryReferral = referrals[0] ?? null;
  const primaryReferralEvent = primaryReferral?.event_id ? ticketEvents[primaryReferral.event_id] : null;
  const primaryReferralPath =
    primaryReferral?.code && primaryReferralEvent?.slug
      ? `/events/${primaryReferralEvent.slug}?ref=${primaryReferral.code}`
      : language === "ua"
        ? "Реферальне посилання ще не створено"
        : "No referral link yet";
  const primaryReferralUrl =
    primaryReferral?.code && primaryReferralEvent?.slug
      ? buildReferralUrl(`/events/${primaryReferralEvent.slug}`, primaryReferral.code)
      : "";
  const invitedCount = referrals.reduce((total, referral) => total + Number(referral.registrations ?? 0), 0);
  const walletAddress = profile?.wallet_address?.trim() ?? "";
  const hasConnectedWallet = Boolean(walletAddress);

  async function copyPrimaryReferral() {
    if (!primaryReferralUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(primaryReferralUrl);
      setCopiedReferral(true);
      window.setTimeout(() => setCopiedReferral(false), 1400);
    } catch {
      setCopiedReferral(false);
    }
  }

  function handleSolanaPaymentConfirmed(input: { ticketId: string; signature: string | null }) {
    setTickets((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket.id === input.ticketId
          ? { ...ticket, payment_status: "paid", status: "active" }
          : ticket
      )
    );
    setRegistrations((currentRegistrations) =>
      currentRegistrations.map((registration) =>
        tickets.find((ticket) => ticket.id === input.ticketId)?.registration_id === registration.id
          ? { ...registration, status: "confirmed" }
          : registration
      )
    );
    setVisibleQrTicketId(input.ticketId);
  }

  return (
    <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.72fr)] lg:gap-10">
      <section className="border-y border-white/[0.05] bg-[#020202] py-8">
        <div className="flex flex-col justify-between gap-5 px-1 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.26em] text-primary">{dictionary.dashboard.profile}</p>
            <h2 className="mt-3 text-[clamp(2rem,10vw,3rem)] font-black uppercase leading-none text-white">
              {dictionary.dashboard.accessDashboard}
            </h2>
          </div>
          <span className="border border-primary/25 bg-primary/[0.03] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
            {profile?.role ?? "user"}
          </span>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[
            [email || (language === "ua" ? "Вхід не виконано" : "Not signed in"), "email"],
            [registrations.length.toString(), dictionary.dashboard.registeredEvents],
            [tickets.length.toString(), dictionary.dashboard.tickets]
          ].map(([value, label]) => (
            <div key={label} className="min-w-0 border border-white/[0.05] bg-[#030303] p-4">
              <p className="truncate font-mono text-lg font-semibold text-white">{value}</p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 border border-white/[0.05] bg-[#030303] p-4">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Web3 profile</p>
              <p className="mt-2 text-sm leading-6 text-white/50">Connect Phantom to unlock Web3-ready access.</p>
            </div>
            {hasConnectedWallet ? (
              <div className="shrink-0 border border-primary/25 bg-primary/[0.035] px-3 py-2">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-primary">Wallet connected</p>
                <p className="mt-1 font-mono text-sm font-semibold text-white" title={walletAddress}>
                  {formatShortWalletAddress(walletAddress)}
                </p>
              </div>
            ) : (
              <WalletConnect />
            )}
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-6 border border-red-400/25 bg-red-400/[0.035] px-4 py-3 text-sm text-red-100">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-10 border-t border-white/[0.05]">
          <div className="flex items-center justify-between gap-3 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">{dictionary.dashboard.registeredEvents}</p>
            <StatusBadge label={`${registrations.length}`} variant={registrations.length > 0 ? "success" : "neutral"} size="sm" />
          </div>
          {registrations.length > 0 ? (
            registrations.map((registration) => (
              <div key={registration.id} className="grid gap-3 border-b border-white/[0.05] py-5 md:grid-cols-[minmax(0,1fr)_160px] md:items-center">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
                    {ticketEvents[registration.event_id]?.title ?? `Event ${registration.event_id.slice(0, 8)}`}
                  </p>
                  <p className="mt-2 text-xl font-black uppercase text-white">{registration.name || dictionary.events.registration}</p>
                </div>
                <StatusBadge label={registration.status} variant={getStatusBadgeVariant(registration.status)} size="sm" />
              </div>
            ))
          ) : (
            <div className="border border-white/[0.05] bg-[#030303] p-6">
              <p className="text-xl font-black uppercase text-white">{dictionary.dashboard.noRegistrationsTitle}</p>
              <p className="mt-3 max-w-lg text-sm leading-6 text-white/45">
                {dictionary.dashboard.noRegistrationsCopy}
              </p>
              <Link
                href="/events"
                className="focus-ring mt-5 inline-flex min-h-11 items-center border border-primary/45 bg-primary/[0.025] px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-primary motion-safe:transition-[background-color,color,transform] motion-safe:duration-300 hover:bg-primary hover:text-black active:scale-[0.98]"
              >
                {dictionary.common.openEvents}
              </Link>
            </div>
          )}
        </div>
      </section>

      <aside className="grid min-w-0 gap-6">
        <section className="border-y border-white/[0.05] bg-[#020202] py-8">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary sm:tracking-[0.26em]">{dictionary.dashboard.myTickets}</p>
            <StatusBadge label={`${tickets.length}`} variant={tickets.length > 0 ? "success" : "neutral"} size="sm" />
          </div>
          <div className="mt-6 grid gap-3">
            {tickets.length > 0 ? (
              tickets.map((ticket) => {
                const event = ticketEvents[ticket.event_id];
                const isQrVisible = visibleQrTicketId === ticket.id;
                const isQrLocked = ticket.status !== "active" || ticket.payment_status !== "paid" || ticket.checked_in || Boolean(ticket.checked_in_at);
                const isFreeTicket = Number(event?.price ?? 1) <= 0;
                const paymentLabel = isFreeTicket && ticket.payment_status === "paid" ? "paid/free" : ticket.payment_status;
                const canPayWithSolanaDevnet =
                  ticket.payment_status === "pending" &&
                  ticket.status === "reserved" &&
                  hasConnectedWallet &&
                  Boolean(event) &&
                  !isFreeTicket;

                return (
                <div key={ticket.id} className="group relative min-w-0 overflow-hidden border border-white/[0.06] bg-[#030303] p-4 shadow-[0_0_44px_rgba(0,255,136,0.035)] transition-[border-color,background-color,transform] duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/[0.018]">
                  <span className="absolute left-0 top-0 h-px w-0 bg-primary transition-[width] duration-500 group-hover:w-full" aria-hidden="true" />
                  <div className="flex flex-col gap-3 border-b border-white/[0.05] pb-4 min-[390px]:flex-row min-[390px]:items-start min-[390px]:justify-between">
                    <div className="min-w-0">
                      {event?.slug ? (
                        <Link
                          href={`/events/${event.slug}`}
                          className="focus-ring block break-words text-lg font-black uppercase leading-tight text-white underline decoration-transparent underline-offset-4 motion-safe:transition-colors motion-safe:duration-300 hover:text-primary hover:decoration-primary/40"
                        >
                          {event.title}
                        </Link>
                      ) : (
                        <p className="text-lg font-black uppercase leading-tight text-white">Event ticket</p>
                      )}
                      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
                        {event?.date ? new Date(event.date).toLocaleDateString(language === "ua" ? "uk-UA" : "en-US", { month: "short", day: "numeric", year: "numeric" }) : language === "ua" ? "Дата уточнюється" : "Date TBA"} / {event?.city ?? (language === "ua" ? "Місто уточнюється" : "City TBA")}
                      </p>
                    </div>
                    <StatusBadge label={ticket.status} variant={getStatusBadgeVariant(ticket.status)} size="sm" className="shrink-0" />
                  </div>
                  <div className="mt-4 grid gap-3 min-[380px]:grid-cols-2">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">{language === "ua" ? "Код квитка" : "Ticket code"}</p>
                      <p className="mt-1 font-mono text-sm font-semibold text-white">{ticket.ticket_code}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">{language === "ua" ? "Оплата" : "Payment"}</p>
                      <StatusBadge label={paymentLabel} variant={getStatusBadgeVariant(ticket.payment_status)} size="sm" className="mt-1" />
                    </div>
                  </div>
                  <div className="mt-4 border border-white/[0.05] bg-black px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {hasConnectedWallet ? <StatusBadge label="On-chain ready" variant="success" size="sm" /> : null}
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/42">NFT pass coming soon</span>
                    </div>
                  </div>
                  {ticket.payment_status === "pending" ? (
                    <p className="mt-4 border border-white/[0.05] bg-black px-3 py-2 text-sm leading-6 text-white/58">
                      {getPaymentPlaceholderCopy(language)}
                    </p>
                  ) : null}
                  {canPayWithSolanaDevnet ? (
                    <SolanaDevnetPayment
                      ticketId={ticket.id}
                      onConfirmed={handleSolanaPaymentConfirmed}
                    />
                  ) : null}
                  <div className="mt-4 grid gap-2 min-[380px]:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setVisibleQrTicketId((current) => (current === ticket.id ? null : ticket.id))}
                      className="focus-ring min-h-12 border border-primary/35 px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-primary motion-safe:transition-[background-color,color,transform] motion-safe:duration-300 hover:bg-primary hover:text-black active:scale-[0.98]"
                      aria-expanded={isQrVisible}
                    >
                      {isQrVisible ? (language === "ua" ? "Сховати QR" : "Hide QR") : (language === "ua" ? "Показати QR" : "Show QR")}
                    </button>
                    <Link
                      href={event?.slug ? `/events/${event.slug}` : "/events"}
                      className="focus-ring inline-flex min-h-12 items-center justify-center border border-white/[0.08] px-4 py-2.5 text-center font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-white/58 motion-safe:transition-[border-color,color,background-color,transform] motion-safe:duration-300 hover:border-primary/35 hover:bg-primary/[0.035] hover:text-primary active:scale-[0.98]"
                    >
                      {language === "ua" ? "Подія" : "Event"}
                    </Link>
                  </div>
                  {isQrVisible ? (
                    <div className="mt-4 border border-primary/20 bg-black p-3 shadow-[0_0_34px_rgba(0,255,136,0.045)]">
                      <TicketQr
                        ticket={ticket}
                        locked={isQrLocked}
                        lockedMessage={getQrLockedMessage(ticket, language)}
                      />
                    </div>
                  ) : null}
                </div>
                );
              })
            ) : (
              <div className="border border-white/[0.05] bg-[#030303] p-5">
                <p className="text-sm leading-6 text-white/48">{dictionary.dashboard.noTickets}</p>
                <Link
                  href="/events"
                  className="focus-ring mt-4 inline-flex min-h-11 items-center border border-white/[0.08] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-white/58 motion-safe:transition-[border-color,color,background-color] motion-safe:duration-300 hover:border-primary/35 hover:bg-primary/[0.035] hover:text-primary"
                >
                  {dictionary.common.openEvents}
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="border-y border-white/[0.05] bg-[#020202] py-8">
          <p className="font-mono text-xs uppercase tracking-[0.26em] text-primary">{dictionary.dashboard.referralLink}</p>
          <div className="mt-4 border border-primary/25 bg-primary/[0.035] px-4 py-3">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              {language === "ua" ? `Ви запросили ${invitedCount} людей` : `You invited ${invitedCount} people`}
            </p>
          </div>
          <div className="mt-6 border border-white/[0.05] bg-[#030303] p-4">
            <p className="break-all font-mono text-xs text-white/50">
              {primaryReferralUrl || primaryReferralPath}
            </p>
          </div>
          <button
            type="button"
            onClick={copyPrimaryReferral}
            disabled={!primaryReferralUrl}
            className="focus-ring mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 border border-primary/45 bg-primary/[0.025] px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-primary transition-[border-color,background-color,color,opacity] hover:bg-primary hover:text-black disabled:cursor-not-allowed disabled:border-white/[0.08] disabled:text-white/[0.28] disabled:hover:bg-transparent disabled:hover:text-white/[0.28]"
          >
            {copiedReferral ? <Copy className="h-4 w-4" aria-hidden="true" /> : <Share2 className="h-4 w-4" aria-hidden="true" />}
            {copiedReferral ? (language === "ua" ? "Скопійовано" : "Copied") : (language === "ua" ? "Копіювати посилання" : "Copy referral link")}
          </button>
          <p className="mt-4 text-sm leading-6 text-white/45">
            {dictionary.dashboard.referralCopy}
          </p>
        </section>
      </aside>
    </div>
  );
}
