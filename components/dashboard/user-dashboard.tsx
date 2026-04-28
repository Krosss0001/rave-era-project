"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getCurrentRole, type AuthProfile } from "@/lib/auth/get-role";
import { useLanguage } from "@/lib/i18n/use-language";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { TicketQr } from "@/components/shared/ticket-qr";

type RegistrationRow = Database["public"]["Tables"]["registrations"]["Row"];
type TicketRow = Database["public"]["Tables"]["tickets"]["Row"];
type ReferralRow = Database["public"]["Tables"]["referrals"]["Row"];
type EventSummary = Pick<Database["public"]["Tables"]["events"]["Row"], "id" | "slug" | "title" | "date" | "city">;

function getBadgeClass(value: string) {
  if (value === "active" || value === "paid" || value === "confirmed") {
    return "border-[#00FF88]/30 bg-[#00FF88]/[0.04] text-[#00FF88]";
  }

  if (value === "failed" || value === "cancelled") {
    return "border-red-400/25 bg-red-400/[0.035] text-red-100";
  }

  return "border-white/[0.08] bg-white/[0.025] text-white/60";
}

export function UserDashboard() {
  const { dictionary } = useLanguage();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [email, setEmail] = useState("");
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [ticketEvents, setTicketEvents] = useState<Record<string, EventSummary>>({});
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [visibleQrTicketId, setVisibleQrTicketId] = useState<string | null>(null);
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
          .select("id,event_id,user_id,name,email,telegram_username,telegram_user_id,referral_code,status,created_at")
          .eq("user_id", roleState.user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("tickets")
          .select("id,registration_id,event_id,user_id,ticket_code,qr_payload,status,payment_status,checked_in,checked_in_at,checked_in_by,created_at")
          .eq("user_id", roleState.user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("referrals")
          .select("id,event_id,owner_user_id,code,clicks,registrations,confirmed,created_at")
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

      const visibleTickets = ticketResult.data ?? [];
      const eventIds = Array.from(new Set(visibleTickets.map((ticket) => ticket.event_id).filter(Boolean)));
      const eventResult =
        eventIds.length > 0
          ? await supabase
              .from("events")
              .select("id,slug,title,date,city")
              .in("id", eventIds)
          : { data: [] };

      if (!mounted) {
        return;
      }

      setProfile(roleState.profile);
      setEmail(roleState.user.email ?? roleState.profile?.email ?? "");
      setRegistrations(registrationResult.data ?? []);
      setTickets(visibleTickets);
      setTicketEvents(
        (eventResult.data ?? []).reduce<Record<string, EventSummary>>((items, event) => {
          items[event.id] = event;
          return items;
        }, {})
      );
      setReferrals(referralResult.data ?? []);
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
          <div key={item} className="h-32 border border-white/[0.05] bg-[#020202] motion-safe:animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_0.72fr]">
      <section className="border-y border-white/[0.05] bg-[#020202] py-8">
        <div className="flex flex-col justify-between gap-5 px-1 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.26em] text-primary">{dictionary.dashboard.profile}</p>
            <h2 className="mt-3 text-4xl font-black uppercase leading-none text-white md:text-5xl">
              {dictionary.dashboard.accessDashboard}
            </h2>
          </div>
          <span className="border border-primary/25 bg-primary/[0.03] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
            {profile?.role ?? "user"}
          </span>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {[
            [email || "Not signed in", "email"],
            [registrations.length.toString(), dictionary.dashboard.registeredEvents],
            [tickets.length.toString(), dictionary.dashboard.tickets]
          ].map(([value, label]) => (
            <div key={label} className="border border-white/[0.05] bg-[#030303] p-4">
              <p className="truncate font-mono text-lg font-semibold text-white">{value}</p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">{label}</p>
            </div>
          ))}
        </div>

        {errorMessage ? (
          <div className="mt-6 border border-red-400/25 bg-red-400/[0.035] px-4 py-3 text-sm text-red-100">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-10 border-t border-white/[0.05]">
          {registrations.length > 0 ? (
            registrations.map((registration) => (
              <div key={registration.id} className="grid gap-3 border-b border-white/[0.05] py-5 md:grid-cols-[1fr_160px] md:items-center">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
                    Event {registration.event_id.slice(0, 8)}
                  </p>
                  <p className="mt-2 text-xl font-black uppercase text-white">{registration.name || dictionary.events.registration}</p>
                </div>
                <span className={`border px-3 py-2 text-center font-mono text-[10px] uppercase tracking-[0.16em] ${getBadgeClass(registration.status)}`}>
                  {registration.status}
                </span>
              </div>
            ))
          ) : (
            <div className="py-10">
              <p className="text-xl font-black uppercase text-white">{dictionary.dashboard.noRegistrationsTitle}</p>
              <p className="mt-3 max-w-lg text-sm leading-6 text-white/45">
                {dictionary.dashboard.noRegistrationsCopy}
              </p>
              <Link
                href="/events"
                className="focus-ring mt-5 inline-flex min-h-11 items-center border border-primary px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest text-primary motion-safe:transition-[background-color,color,transform] motion-safe:duration-500 hover:bg-primary hover:text-black active:scale-[0.98]"
              >
                {dictionary.common.openEvents}
              </Link>
            </div>
          )}
        </div>
      </section>

      <aside className="grid gap-6">
        <section className="border-y border-white/[0.05] bg-[#020202] py-8">
          <p className="font-mono text-xs uppercase tracking-[0.26em] text-primary">{dictionary.dashboard.myTickets}</p>
          <div className="mt-6 grid gap-3">
            {tickets.length > 0 ? (
              tickets.map((ticket) => {
                const event = ticketEvents[ticket.event_id];
                const isQrVisible = visibleQrTicketId === ticket.id;
                const isQrLocked = ticket.status !== "active" || ticket.payment_status !== "paid";

                return (
                <div key={ticket.id} className="border border-white/[0.05] bg-[#030303] p-4">
                  <div className="flex items-start justify-between gap-3 border-b border-white/[0.05] pb-4">
                    <div className="min-w-0">
                      {event?.slug ? (
                        <Link
                          href={`/events/${event.slug}`}
                          className="focus-ring block text-lg font-black uppercase leading-none text-white underline decoration-transparent underline-offset-4 motion-safe:transition-colors motion-safe:duration-500 hover:text-primary hover:decoration-primary/40"
                        >
                          {event.title}
                        </Link>
                      ) : (
                        <p className="text-lg font-black uppercase leading-none text-white">Event ticket</p>
                      )}
                      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
                        {event?.date ? new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Date TBA"} / {event?.city ?? "City TBA"}
                      </p>
                    </div>
                    <span className={`shrink-0 border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] ${getBadgeClass(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">Ticket code</p>
                      <p className="mt-1 font-mono text-sm font-semibold text-white">{ticket.ticket_code}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">Payment</p>
                      <span className={`mt-1 inline-flex border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] ${getBadgeClass(ticket.payment_status)}`}>
                        {ticket.payment_status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setVisibleQrTicketId((current) => (current === ticket.id ? null : ticket.id))}
                      className="focus-ring min-h-11 border border-primary/35 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-primary motion-safe:transition-[background-color,color,transform] motion-safe:duration-500 hover:bg-primary hover:text-black active:scale-[0.98]"
                      aria-expanded={isQrVisible}
                    >
                      {isQrVisible ? "Hide QR" : "Show QR"}
                    </button>
                  </div>
                  {isQrVisible ? (
                    <div className="mt-4">
                      <TicketQr
                        ticket={ticket}
                        locked={isQrLocked}
                        lockedMessage="QR unlocks when this ticket is active and paid."
                      />
                    </div>
                  ) : null}
                </div>
                );
              })
            ) : (
              <p className="text-sm leading-6 text-white/45">{dictionary.dashboard.noTickets}</p>
            )}
          </div>
        </section>

        <section className="border-y border-white/[0.05] bg-[#020202] py-8">
          <p className="font-mono text-xs uppercase tracking-[0.26em] text-primary">{dictionary.dashboard.referralLink}</p>
          <div className="mt-6 border border-white/[0.05] bg-[#030303] p-4">
            <p className="break-all font-mono text-xs text-white/50">
              {referrals[0]?.code ? `/events/noir-signal?ref=${referrals[0].code}` : "/events/noir-signal?ref=RAVE-CREW"}
            </p>
          </div>
          <p className="mt-4 text-sm leading-6 text-white/45">
            {dictionary.dashboard.referralCopy}
          </p>
        </section>
      </aside>
    </div>
  );
}
