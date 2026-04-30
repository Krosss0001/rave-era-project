"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getCurrentRole } from "@/lib/auth/get-role";
import { canManageEvents, canManagePlatform } from "@/lib/auth/roles";
import { useLanguage } from "@/lib/i18n/use-language";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/supabase/types";

export function RoleNav() {
  const { dictionary } = useLanguage();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [role, setRole] = useState<UserRole | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadRole() {
      if (!supabase) {
        return;
      }

      const state = await getCurrentRole(supabase);

      if (!mounted) {
        return;
      }

      setSignedIn(Boolean(state.user));
      setRole(state.role);
    }

    loadRole();

    const { data: listener } = supabase?.auth.onAuthStateChange(() => {
      loadRole();
    }) ?? { data: null };

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, [supabase]);

  if (!signedIn) {
    return null;
  }

  const items = [
    { href: "/dashboard", label: dictionary.nav.dashboard, show: true },
    { href: "/organizer", label: dictionary.nav.organizer, show: canManageEvents(role) },
    { href: "/admin", label: dictionary.nav.admin, show: canManagePlatform(role) },
    { href: "/superadmin", label: dictionary.nav.superadmin, show: role === "superadmin" }
  ];

  return (
    <>
      {items.filter((item) => item.show).map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="focus-ring group relative min-h-11 shrink-0 px-3 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.11em] text-white/42 motion-safe:transition-colors motion-safe:duration-300 hover:text-primary md:tracking-[0.18em]"
        >
          <span className="absolute left-3 right-3 top-0 h-px scale-x-0 bg-primary motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out group-hover:scale-x-100" aria-hidden="true" />
          {item.label}
        </Link>
      ))}
    </>
  );
}
