"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database, UserRole } from "@/lib/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

function nextRole(role: UserRole): UserRole | null {
  if (role === "user") {
    return "organizer";
  }

  if (role === "organizer") {
    return "admin";
  }

  return null;
}

export function AdminPanel() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadProfiles = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,full_name,role,wallet_address,telegram_username,created_at")
      .order("created_at", { ascending: false });

    setProfiles(data ?? []);
    setMessage(error ? "Profiles are protected by RLS. Sign in as admin or superadmin." : "");
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  async function changeRole(profile: ProfileRow, role: UserRole) {
    if (!supabase) {
      return;
    }

    setMessage("");
    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", profile.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setProfiles((items) => items.map((item) => (item.id === profile.id ? { ...item, role } : item)));
    setMessage(`Role updated for ${profile.email ?? profile.id}.`);
  }

  return (
    <section className="border-y border-white/[0.05] bg-[#020202] py-8">
      <div className="flex flex-col justify-between gap-5 px-1 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.26em] text-primary">Profiles</p>
          <h2 className="mt-3 text-4xl font-black uppercase leading-none text-white md:text-5xl">
            Role control
          </h2>
        </div>
        <span className="border border-white/[0.05] bg-[#030303] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
          RLS protected
        </span>
      </div>

      {message ? (
        <p className="mt-6 border border-primary/25 bg-primary/[0.03] px-4 py-3 text-sm leading-6 text-white/65" aria-live="polite">
          {message}
        </p>
      ) : null}

      <div className="mt-10 overflow-x-auto border-t border-white/[0.05]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="font-mono text-xs uppercase tracking-[0.18em] text-white/[0.34]">
            <tr>
              <th className="py-4 font-medium">Email</th>
              <th className="py-4 font-medium">Name</th>
              <th className="py-4 font-medium">Role</th>
              <th className="py-4 font-medium">Created</th>
              <th className="py-4 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {loading ? (
              [0, 1, 2].map((item) => (
                <tr key={item}>
                  <td colSpan={5} className="py-4">
                    <div className="h-10 bg-white/[0.035] motion-safe:animate-pulse" />
                  </td>
                </tr>
              ))
            ) : profiles.length > 0 ? (
              profiles.map((profile) => {
                const upgradeRole = nextRole(profile.role);

                return (
                  <tr key={profile.id} className="motion-safe:transition-colors motion-safe:duration-500 hover:bg-primary/[0.018]">
                    <td className="py-4 font-mono text-white/[0.72]">{profile.email ?? "No email"}</td>
                    <td className="py-4 text-white/[0.45]">{profile.full_name ?? "Not set"}</td>
                    <td className="py-4">
                      <span className="border border-primary/25 bg-primary/[0.03] px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                        {profile.role}
                      </span>
                    </td>
                    <td className="py-4 font-mono text-white/[0.35]">{new Date(profile.created_at).toLocaleDateString("en-US")}</td>
                    <td className="py-4 text-right">
                      {upgradeRole ? (
                        <button
                          type="button"
                          onClick={() => changeRole(profile, upgradeRole)}
                          className="focus-ring min-h-10 border border-white/[0.05] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white/45 motion-safe:transition-[border-color,color,transform] motion-safe:duration-500 hover:border-primary/35 hover:text-primary active:scale-[0.98]"
                        >
                          Make {upgradeRole}
                        </button>
                      ) : (
                        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/25">Locked</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="py-10 text-white/45">
                  No profiles visible. Admin RLS policies must allow the current role to read profiles.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
