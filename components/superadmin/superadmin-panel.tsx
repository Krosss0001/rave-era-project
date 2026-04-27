"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export function SuperadminPanel() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
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

      const { data, error } = await supabase
        .from("profiles")
        .select("id,email,full_name,role,wallet_address,telegram_username,created_at")
        .order("created_at", { ascending: false });

      if (!mounted) {
        return;
      }

      setProfiles(data ?? []);
      setMessage(error ? "Profiles are not visible. Confirm the signed-in profile has the superadmin role." : "");
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
    <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
      <section className="border-y border-white/[0.05] bg-[#020202] py-8">
        <p className="font-mono text-xs uppercase tracking-[0.26em] text-primary">Role architecture</p>
        <h2 className="mt-3 text-4xl font-black uppercase leading-none text-white md:text-5xl">
          Platform control
        </h2>
        <p className="mt-5 max-w-xl text-sm leading-6 text-white/45">
          Superadmin is the only role intended to manage the full hierarchy. The current MVP keeps
          this as a protected concept surface until server-side audit logs and admin actions are added.
        </p>
        <div className="mt-8 grid gap-3">
          {["user", "organizer", "admin", "superadmin"].map((role) => (
            <div key={role} className="flex min-h-12 items-center justify-between border border-white/[0.05] bg-[#030303] px-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">{role}</span>
              <span className="font-mono text-2xl font-semibold tabular-nums text-white">{loading ? "..." : roleCounts[role] ?? 0}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-white/[0.05] bg-[#020202] py-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.26em] text-primary">Prepared actions</p>
            <h2 className="mt-3 text-4xl font-black uppercase leading-none text-white md:text-5xl">Superadmin queue</h2>
          </div>
          <span className="border border-primary/25 bg-primary/[0.03] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
            Server actions later
          </span>
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
  );
}
