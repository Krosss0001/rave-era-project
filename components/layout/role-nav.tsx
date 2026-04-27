"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getCurrentRole } from "@/lib/auth/get-role";
import { canManageEvents, canManagePlatform } from "@/lib/auth/roles";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/supabase/types";

export function RoleNav() {
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
    { href: "/dashboard", label: "Dashboard", show: true },
    { href: "/organizer", label: "Organizer", show: canManageEvents(role) },
    { href: "/admin", label: "Admin", show: canManagePlatform(role) },
    { href: "/superadmin", label: "Superadmin", show: role === "superadmin" }
  ];

  return (
    <>
      {items.filter((item) => item.show).map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="focus-ring group relative min-h-10 px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35 motion-safe:transition-colors motion-safe:duration-500 hover:text-primary"
        >
          <span className="absolute left-3 right-3 top-0 h-px scale-x-0 bg-primary motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out group-hover:scale-x-100" aria-hidden="true" />
          {item.label}
        </Link>
      ))}
    </>
  );
}
