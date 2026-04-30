"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/use-language";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database, UserRole } from "@/lib/supabase/types";
import { StatusBadge, getStatusBadgeVariant } from "@/components/shared/status-badge";

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
  const { dictionary } = useLanguage();
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
    setMessage(error ? dictionary.admin.noProfiles : "");
    setLoading(false);
  }, [dictionary.admin.noProfiles, supabase]);

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
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary sm:tracking-[0.26em]">{dictionary.admin.profiles}</p>
          <h2 className="mt-3 text-[clamp(1.85rem,9vw,3rem)] font-black uppercase leading-[0.98] text-white">
            {dictionary.admin.roleControl}
          </h2>
        </div>
        <StatusBadge label={dictionary.admin.protected} variant="neutral" size="sm" />
      </div>

      {message ? (
        <p className="mt-6 border border-primary/25 bg-primary/[0.03] px-4 py-3 text-sm leading-6 text-white/65" aria-live="polite">
          {message}
        </p>
      ) : null}

      <div className="-mx-3 mt-8 overflow-x-auto border-t border-white/[0.05] px-3 [scrollbar-width:thin] sm:mx-0 sm:mt-10 sm:px-0">
        <table className="w-full min-w-[680px] text-left text-sm">
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
                    <div className="grid grid-cols-[minmax(0,1fr)_120px_100px] gap-4">
                      <div className="h-10 bg-white/[0.035] motion-safe:animate-pulse" />
                      <div className="h-10 bg-white/[0.03] motion-safe:animate-pulse" />
                      <div className="h-10 bg-white/[0.025] motion-safe:animate-pulse" />
                    </div>
                  </td>
                </tr>
              ))
            ) : profiles.length > 0 ? (
              profiles.map((profile) => {
                const upgradeRole = nextRole(profile.role);

                return (
                  <tr key={profile.id} className="motion-safe:transition-colors motion-safe:duration-500 hover:bg-primary/[0.018]">
                    <td className="max-w-56 break-all py-4 pr-4 font-mono text-white/[0.72]">{profile.email ?? "No email"}</td>
                    <td className="py-4 text-white/[0.45]">{profile.full_name ?? "Not set"}</td>
                    <td className="py-4">
                      <StatusBadge label={profile.role} variant={getStatusBadgeVariant(profile.role === "user" ? "pending" : "active")} size="sm" />
                    </td>
                    <td className="py-4 font-mono text-white/[0.35]">{new Date(profile.created_at).toLocaleDateString("en-US")}</td>
                    <td className="py-4 text-right">
                      {upgradeRole ? (
                        <button
                          type="button"
                          onClick={() => changeRole(profile, upgradeRole)}
                          className="focus-ring min-h-11 border border-white/[0.05] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-white/58 motion-safe:transition-[border-color,color,transform] motion-safe:duration-300 hover:border-primary/35 hover:text-primary active:scale-[0.98]"
                        >
                          Make {upgradeRole}
                        </button>
                      ) : (
                        <StatusBadge label="Locked" variant="neutral" size="sm" />
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="py-10">
                  <div className="border border-white/[0.05] bg-[#030303] p-5 text-white/48">
                    <p className="text-sm leading-6">{dictionary.admin.noProfiles}</p>
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/30">Check role policies and reload this panel.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
