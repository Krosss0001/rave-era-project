"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Copy, Link2, Plus, Send, type LucideIcon } from "lucide-react";
import { getCurrentRole } from "@/lib/auth/get-role";
import { useLanguage } from "@/lib/i18n/use-language";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getTelegramBotBaseUrl } from "@/lib/telegram";
import type { BroadcastAudience, Database } from "@/lib/supabase/types";
import { TelegramBroadcastPanel } from "@/components/shared/telegram-broadcast-panel";
import { StatusBadge } from "@/components/shared/status-badge";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type EventOption = Pick<Database["public"]["Tables"]["events"]["Row"], "id" | "title" | "slug">;
type ReferralRow = Pick<
  Database["public"]["Tables"]["referrals"]["Row"],
  "id" | "event_id" | "code" | "source" | "label" | "clicks" | "telegram_starts" | "registrations" | "confirmed" | "paid" | "checked_in" | "created_at" | "updated_at"
>;
type RegistrationReferralRow = Pick<Database["public"]["Tables"]["registrations"]["Row"], "id" | "event_id" | "referral_code" | "status">;
type TicketReferralRow = Pick<Database["public"]["Tables"]["tickets"]["Row"], "registration_id" | "event_id" | "payment_status" | "checked_in" | "checked_in_at" | "status">;

type ReferralForm = {
  eventId: string;
  code: string;
  label: string;
};

const superadminAudienceOptions: Array<{ value: BroadcastAudience; label: string }> = [
  { value: "all_telegram_users", label: "All Telegram users" },
  { value: "event_registered", label: "Registered" },
  { value: "event_confirmed", label: "Confirmed" },
  { value: "event_pending_payment", label: "Pending payment" },
  { value: "event_paid", label: "Paid" },
  { value: "event_checked_in", label: "Checked-in" },
  { value: "bot_interacted_not_registered", label: "Bot users not registered" }
];

const initialReferralForm: ReferralForm = {
  eventId: "",
  code: "",
  label: ""
};

type GeneratedLinkItem = ["website" | "telegram", string, string, LucideIcon];

function cleanReferralCode(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 80);
}

function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://rave-era-project.vercel.app").replace(/\/+$/, "");
}

function buildReferralLinks(event: EventOption, code: string) {
  const payload = `event_${event.slug}_ref_${code}`;

  return {
    website: `${getAppUrl()}/events/${event.slug}?ref=${encodeURIComponent(code)}`,
    telegram: `${getTelegramBotBaseUrl()}?start=${encodeURIComponent(payload)}`
  };
}

export function SuperadminPanel() {
  const { dictionary } = useLanguage();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationReferralRow[]>([]);
  const [tickets, setTickets] = useState<TicketReferralRow[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [referralForm, setReferralForm] = useState(initialReferralForm);
  const [createdLinks, setCreatedLinks] = useState<{ website: string; telegram: string } | null>(null);
  const [referralError, setReferralError] = useState("");
  const [referralSuccess, setReferralSuccess] = useState("");
  const [copiedLink, setCopiedLink] = useState<"website" | "telegram" | null>(null);
  const [creatingReferral, setCreatingReferral] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProfiles() {
      if (!supabase) {
        setLoading(false);
        setMessage("Supabase is not configured.");
        return;
      }

      const [roleState, profileResult, eventResult, referralResult, registrationResult, ticketResult] = await Promise.all([
        getCurrentRole(supabase),
        supabase
          .from("profiles")
          .select("id,email,full_name,role,wallet_address,telegram_username,created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("events")
          .select("id,title,slug")
          .order("date", { ascending: true, nullsFirst: false }),
        supabase
          .from("referrals")
          .select("id,event_id,code,source,label,clicks,telegram_starts,registrations,confirmed,paid,checked_in,created_at,updated_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("registrations")
          .select("id,event_id,referral_code,status")
          .not("referral_code", "is", null),
        supabase
          .from("tickets")
          .select("registration_id,event_id,payment_status,checked_in,checked_in_at,status")
      ]);

      if (!mounted) {
        return;
      }

      setCurrentUserId(roleState.user?.id ?? null);
      setProfiles(profileResult.data ?? []);
      setEvents(eventResult.data ?? []);
      setReferrals(referralResult.data ?? []);
      setRegistrations(registrationResult.data ?? []);
      setTickets(ticketResult.data ?? []);
      setMessage(
        profileResult.error || eventResult.error || referralResult.error || registrationResult.error || ticketResult.error
          ? "Some superadmin data is not visible. Confirm the signed-in profile has the superadmin role and patch 013 is applied."
          : ""
      );
      setLoading(false);
    }

    loadProfiles();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  const roleCounts = profiles.reduce<Record<string, number>>((counts, profile) => {
    counts[profile.role] = (counts[profile.role] ?? 0) + 1;
    return counts;
  }, {});
  const referralStatsByKey = useMemo(() => {
    const ticketMap = tickets.reduce<Record<string, TicketReferralRow[]>>((items, ticket) => {
      if (ticket.registration_id) {
        items[ticket.registration_id] = [...(items[ticket.registration_id] ?? []), ticket];
      }

      return items;
    }, {});

    return registrations.reduce<Record<string, { registrations: number; confirmed: number; paid: number; checkedIn: number }>>((items, registration) => {
      if (!registration.referral_code) {
        return items;
      }

      const key = `${registration.event_id}:${registration.referral_code}`;
      const current = items[key] ?? { registrations: 0, confirmed: 0, paid: 0, checkedIn: 0 };
      const registrationTickets = ticketMap[registration.id] ?? [];

      items[key] = {
        registrations: current.registrations + 1,
        confirmed: current.confirmed + (registration.status === "confirmed" ? 1 : 0),
        paid: current.paid + (registrationTickets.some((ticket) => ticket.payment_status === "paid") ? 1 : 0),
        checkedIn: current.checkedIn + (registrationTickets.some((ticket) => ticket.checked_in || ticket.checked_in_at || ticket.status === "used") ? 1 : 0)
      };

      return items;
    }, {});
  }, [registrations, tickets]);
  const selectedReferralEvent = events.find((event) => event.id === referralForm.eventId) ?? null;
  const previewLinks = selectedReferralEvent && referralForm.code ? buildReferralLinks(selectedReferralEvent, referralForm.code) : null;

  function updateReferralCode(value: string) {
    setReferralForm((current) => ({
      ...current,
      code: cleanReferralCode(value)
    }));
    setReferralError("");
    setReferralSuccess("");
    setCreatedLinks(null);
  }

  async function copyLink(type: "website" | "telegram", value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedLink(type);
      window.setTimeout(() => setCopiedLink(null), 1600);
    } catch {
      setReferralError("Copy failed. Select the link text and copy it manually.");
    }
  }

  async function createReferralLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setReferralError("Supabase is not configured.");
      return;
    }

    const selectedEvent = events.find((item) => item.id === referralForm.eventId);
    const code = cleanReferralCode(referralForm.code);
    const label = referralForm.label.trim().slice(0, 120);

    if (!selectedEvent) {
      setReferralError("Select an event first.");
      return;
    }

    if (!code) {
      setReferralError("Enter a lowercase referral code.");
      return;
    }

    const duplicate = referrals.some((referral) => referral.event_id === selectedEvent.id && referral.code === code);

    if (duplicate) {
      setReferralError("This event already has that referral code.");
      return;
    }

    setCreatingReferral(true);
    setReferralError("");
    setReferralSuccess("");

    const { data, error } = await supabase
      .from("referrals")
      .insert({
        event_id: selectedEvent.id,
        code,
        source: label || "superadmin",
        label: label || null,
        created_by: currentUserId,
        clicks: 0,
        telegram_starts: 0,
        registrations: 0,
        confirmed: 0,
        paid: 0,
        checked_in: 0
      })
      .select("id,event_id,code,source,label,clicks,telegram_starts,registrations,confirmed,paid,checked_in,created_at,updated_at")
      .single();

    setCreatingReferral(false);

    if (error || !data) {
      setReferralError(error?.code === "23505" ? "This event already has that referral code." : error?.message || "Referral link could not be created.");
      return;
    }

    const nextLinks = buildReferralLinks(selectedEvent, code);
    setReferrals((current) => [data, ...current]);
    setReferralForm({ eventId: selectedEvent.id, code, label });
    setCreatedLinks(nextLinks);
    setReferralSuccess("Referral link created.");
  }

  return (
    <div className="grid gap-10">
      <TelegramBroadcastPanel
        title="Telegram Broadcast Center"
        eyebrow="Broadcast operations"
        description="Create a targeted Telegram message, estimate its audience, and send it from the server-side bot integration."
        events={events}
        audienceOptions={superadminAudienceOptions}
        requireEvent={false}
        defaultAudience="all_telegram_users"
      />

      <section className="border-y border-white/[0.05] bg-[#020202] py-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary sm:tracking-[0.26em]">Referral operations</p>
            <h2 className="mt-3 text-[clamp(1.85rem,9vw,3rem)] font-black uppercase leading-[0.98] text-white">Unique Referral Links / Унікальні реферальні посилання</h2>
          </div>
          <StatusBadge label={`${referrals.length} links`} variant={referrals.length > 0 ? "success" : "neutral"} size="sm" />
        </div>

        <form onSubmit={createReferralLink} className="mt-8 grid gap-4 border border-white/[0.05] bg-[#030303] p-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <fieldset className="grid min-w-0 gap-4" disabled={creatingReferral} aria-busy={creatingReferral}>
            <legend className="sr-only">Create referral link</legend>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Event *</span>
              <select
                value={referralForm.eventId}
                onChange={(changeEvent) => {
                  setReferralForm((current) => ({ ...current, eventId: changeEvent.target.value }));
                  setCreatedLinks(null);
                  setReferralError("");
                  setReferralSuccess("");
                }}
                className="focus-ring mt-2 min-h-12 w-full border border-white/[0.08] bg-black px-3 py-2 text-sm text-white"
                required
              >
                <option value="">Select event</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title} / {event.slug}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Custom code / nickname *</span>
              <input
                value={referralForm.code}
                onChange={(changeEvent) => updateReferralCode(changeEvent.target.value)}
                type="text"
                inputMode="text"
                autoComplete="off"
                spellCheck={false}
                pattern="[a-z0-9_-]+"
                placeholder="dj-nika"
                aria-invalid={referralError ? "true" : undefined}
                aria-describedby={referralError ? "referral-builder-error" : "referral-code-help"}
                className="focus-ring mt-2 min-h-12 w-full border border-white/[0.08] bg-black px-3 py-2 font-mono text-sm lowercase text-white placeholder:text-white/25"
                required
              />
              <span id="referral-code-help" className="mt-2 block text-xs leading-5 text-white/42">
                Lowercase letters, numbers, dash, and underscore only.
              </span>
            </label>

            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Optional label / source</span>
              <input
                value={referralForm.label}
                onChange={(changeEvent) => {
                  setReferralForm((current) => ({ ...current, label: changeEvent.target.value }));
                  setCreatedLinks(null);
                }}
                type="text"
                autoComplete="off"
                spellCheck={false}
                placeholder="Artist, partner, influencer"
                className="focus-ring mt-2 min-h-12 w-full border border-white/[0.08] bg-black px-3 py-2 text-sm text-white placeholder:text-white/25"
              />
            </label>

            {referralError ? (
              <p id="referral-builder-error" className="border border-red-400/30 bg-red-400/[0.04] px-3 py-2 text-sm leading-6 text-red-100" aria-live="polite">
                {referralError}
              </p>
            ) : null}
            {referralSuccess ? (
              <p className="border border-primary/25 bg-primary/[0.035] px-3 py-2 text-sm leading-6 text-primary" aria-live="polite">
                {referralSuccess}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={creatingReferral}
              className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 border border-primary/55 px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-primary transition-[background-color,color,transform,opacity] hover:bg-primary hover:text-black active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {creatingReferral ? "Creating..." : "Create referral link"}
            </button>
          </fieldset>

          <div className="min-w-0 border border-white/[0.05] bg-black p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Generated links</p>
            {createdLinks || previewLinks ? (
              <div className="mt-4 grid gap-4">
                {([
                  ["website" as const, "Website link", (createdLinks ?? previewLinks)!.website, Link2],
                  ["telegram" as const, "Telegram link", (createdLinks ?? previewLinks)!.telegram, Send]
                ] satisfies GeneratedLinkItem[]).map(([type, label, value, Icon]) => (
                  <div key={type} className="min-w-0 border border-white/[0.05] bg-[#030303] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/38">{label}</p>
                      <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                    </div>
                    <p className="mt-3 break-all font-mono text-xs leading-5 text-white/58">{value}</p>
                    <button
                      type="button"
                      onClick={() => copyLink(type, value)}
                      className="focus-ring mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 border border-primary/35 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-primary transition-[background-color,color,transform] hover:bg-primary hover:text-black active:scale-[0.98]"
                    >
                      <Copy className="h-4 w-4" aria-hidden="true" />
                      {copiedLink === type ? "Copied" : `Copy ${type} link`}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 border border-white/[0.05] bg-[#020202] p-4">
                <p className="text-sm leading-6 text-white/45">Select an event and enter a code to preview both links.</p>
              </div>
            )}
          </div>
        </form>

        <div className="mt-6 overflow-x-auto border border-white/[0.05] bg-[#030303] [scrollbar-width:thin]">
          {loading ? (
            <div className="grid gap-3 p-4 md:grid-cols-4">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="h-20 bg-white/[0.035] motion-safe:animate-pulse" />
              ))}
            </div>
          ) : referrals.length > 0 ? (
            <table className="w-full min-w-[1180px] text-left text-xs">
              <thead className="border-b border-white/[0.05] font-mono uppercase tracking-[0.13em] text-white/[0.34]">
                <tr>
                  <th className="px-4 py-3 font-medium">Event</th>
                  <th className="px-4 py-3 font-medium">Code / source</th>
                  <th className="px-4 py-3 font-medium">Website clicks</th>
                  <th className="px-4 py-3 font-medium">Telegram starts</th>
                  <th className="px-4 py-3 font-medium">Registrations</th>
                  <th className="px-4 py-3 font-medium">Confirmed</th>
                  <th className="px-4 py-3 font-medium">Paid</th>
                  <th className="px-4 py-3 font-medium">Checked-in</th>
                  <th className="px-4 py-3 font-medium">Conversion</th>
                  <th className="px-4 py-3 font-medium">Website link</th>
                  <th className="px-4 py-3 font-medium">Telegram link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {referrals.map((referral) => {
                  const event = events.find((item) => item.id === referral.event_id);
                  const starts = referral.clicks + referral.telegram_starts;
                  const calculatedStats = referral.event_id ? referralStatsByKey[`${referral.event_id}:${referral.code}`] : null;
                  const registrationsCount = calculatedStats?.registrations ?? referral.registrations;
                  const confirmedCount = calculatedStats?.confirmed ?? referral.confirmed;
                  const paidCount = calculatedStats?.paid ?? referral.paid;
                  const checkedInCount = calculatedStats?.checkedIn ?? referral.checked_in;
                  const conversion = starts > 0 ? Math.round((registrationsCount / starts) * 100) : 0;
                  const links = event ? buildReferralLinks(event, referral.code) : null;

                  return (
                    <tr key={referral.id} className="transition-colors hover:bg-primary/[0.018]">
                      <td className="px-4 py-4">
                        <p className="font-medium text-white">{event?.title ?? "Unknown event"}</p>
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-white/35">{event?.slug ?? referral.event_id?.slice(0, 8) ?? "-"}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-mono text-sm font-semibold text-white">{referral.code}</p>
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-white/35">{referral.label || referral.source || "superadmin"}</p>
                      </td>
                      <td className="px-4 py-4 font-mono tabular-nums text-white/65">{referral.clicks}</td>
                      <td className="px-4 py-4 font-mono tabular-nums text-white/65">{referral.telegram_starts}</td>
                      <td className="px-4 py-4 font-mono tabular-nums text-white/65">{registrationsCount}</td>
                      <td className="px-4 py-4 font-mono tabular-nums text-primary">{confirmedCount}</td>
                      <td className="px-4 py-4 font-mono tabular-nums text-white/65">{paidCount}</td>
                      <td className="px-4 py-4 font-mono tabular-nums text-white/65">{checkedInCount}</td>
                      <td className="px-4 py-4 font-mono tabular-nums text-white/65">{conversion}%</td>
                      <td className="px-4 py-4">
                        {links ? (
                          <button
                            type="button"
                            onClick={() => copyLink("website", links.website)}
                            className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 border border-primary/35 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-primary transition-colors hover:bg-primary hover:text-black"
                          >
                            <Copy className="h-4 w-4" aria-hidden="true" />
                            {copiedLink === "website" ? "Copied" : "Copy"}
                          </button>
                        ) : (
                          <span className="font-mono text-white/30">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {links ? (
                          <button
                            type="button"
                            onClick={() => copyLink("telegram", links.telegram)}
                            className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 border border-primary/35 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-primary transition-colors hover:bg-primary hover:text-black"
                          >
                            <Copy className="h-4 w-4" aria-hidden="true" />
                            {copiedLink === "telegram" ? "Copied" : "Copy"}
                          </button>
                        ) : (
                          <span className="font-mono text-white/30">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-5">
              <p className="text-sm leading-6 text-white/45">No referral links yet. Create the first custom link above.</p>
            </div>
          )}
        </div>
      </section>

      <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-10">
        <section className="border-y border-white/[0.05] bg-[#020202] py-8">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary sm:tracking-[0.26em]">{dictionary.superadmin.roleArchitecture}</p>
          <h2 className="mt-3 text-[clamp(1.85rem,9vw,3rem)] font-black uppercase leading-[0.98] text-white">
            {dictionary.superadmin.platformControl}
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-6 text-white/45">
            {dictionary.superadmin.roleMeaning}
          </p>
          <div className="mt-8 grid gap-3">
            {["user", "organizer", "admin", "superadmin"].map((role) => (
              <div key={role} className="flex min-h-14 items-center justify-between gap-4 border border-white/[0.05] bg-[#030303] px-4 motion-safe:transition-colors motion-safe:duration-300 hover:bg-primary/[0.018]">
                <StatusBadge label={role} variant={role === "user" ? "pending" : "success"} size="sm" />
                {loading ? (
                  <span className="h-8 w-12 bg-white/[0.04] motion-safe:animate-pulse" aria-label="Loading role count" />
                ) : (
                  <span className="font-mono text-2xl font-semibold tabular-nums text-white">{roleCounts[role] ?? 0}</span>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-white/[0.05] bg-[#020202] py-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary sm:tracking-[0.26em]">Prepared actions</p>
              <h2 className="mt-3 text-[clamp(1.85rem,9vw,3rem)] font-black uppercase leading-[0.98] text-white">{dictionary.superadmin.queue}</h2>
            </div>
            <StatusBadge label={dictionary.superadmin.serverActionsLater} variant="success" size="sm" />
          </div>
        {message ? (
          <p className="mt-6 border border-white/[0.05] bg-[#030303] px-4 py-3 text-sm leading-6 text-white/55" aria-live="polite">
            {message}
          </p>
        ) : null}
        <div className="mt-8 grid gap-3">
          {[
            "Promote admin to superadmin with audit log",
            "Suspend organizer access",
            "Review platform-wide event mutations",
            "Rotate operational secrets outside the client"
          ].map((item, index) => (
            <div key={item} className="border border-white/[0.05] bg-[#030303] p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/30">Phase {String(index + 1).padStart(2, "0")}</p>
              <p className="mt-2 text-sm leading-6 text-white/65">{item}</p>
            </div>
          ))}
        </div>
        </section>
      </div>
    </div>
  );
}
