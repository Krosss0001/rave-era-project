"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/use-language";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { BroadcastAudience, Database } from "@/lib/supabase/types";
import { TelegramBroadcastPanel } from "@/components/shared/telegram-broadcast-panel";
import { StatusBadge } from "@/components/shared/status-badge";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type EventOption = Pick<Database["public"]["Tables"]["events"]["Row"], "id" | "title" | "slug">;

const superadminAudienceOptions: Array<{ value: BroadcastAudience; label: string }> = [
  { value: "all_telegram_users", label: "All Telegram users" },
  { value: "event_registered", label: "Registered" },
  { value: "event_confirmed", label: "Confirmed" },
  { value: "event_pending_payment", label: "Pending payment" },
  { value: "event_paid", label: "Paid" },
  { value: "event_checked_in", label: "Checked-in" },
  { value: "bot_interacted_not_registered", label: "Bot users not registered" }
];

export function SuperadminPanel() {
  const { dictionary } = useLanguage();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
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

      const [profileResult, eventResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("id,email,full_name,role,wallet_address,telegram_username,created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("events")
          .select("id,title,slug")
          .order("date", { ascending: true, nullsFirst: false })
      ]);

      if (!mounted) {
        return;
      }

      setProfiles(profileResult.data ?? []);
      setEvents(eventResult.data ?? []);
      setMessage(profileResult.error ? "Profiles are not visible. Confirm the signed-in profile has the superadmin role." : "");
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
