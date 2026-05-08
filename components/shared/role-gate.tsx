"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { getCurrentRole, type RoleState } from "@/lib/auth/get-role";
import { useLanguage } from "@/lib/i18n/use-language";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/supabase/types";
import { AuthControl } from "@/components/shared/auth-control";

type RoleGateProps = {
  allowedRoles: UserRole[];
  children: ReactNode;
};

export function RoleGate({ allowedRoles, children }: RoleGateProps) {
  const { dictionary, language } = useLanguage();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const allowedKey = allowedRoles.join(":");
  const stableAllowedRoles = useMemo(() => allowedKey.split(":") as UserRole[], [allowedKey]);
  const [state, setState] = useState<RoleState | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessState, setAccessState] = useState<"checking" | "denied" | "error">("checking");

  useEffect(() => {
    let mounted = true;

    async function loadRole() {
      if (!supabase) {
        setLoading(false);
        setAccessState("error");
        return;
      }

      try {
        const nextState = await getCurrentRole(supabase);

        if (!mounted) {
          return;
        }

        setState(nextState);
        setLoading(false);

        if (!nextState.role || !stableAllowedRoles.includes(nextState.role)) {
          setAccessState("denied");
          return;
        }

        setAccessState("checking");
      } catch {
        if (!mounted) {
          return;
        }

        setLoading(false);
        setAccessState("error");
      }
    }

    loadRole();

    const { data: listener } = supabase?.auth.onAuthStateChange(() => {
      loadRole();
    }) ?? { data: null };

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, [allowedKey, stableAllowedRoles, supabase]);

  if (loading || !state?.role || !stableAllowedRoles.includes(state.role)) {
    const signedOut = !loading && !state?.user;
    const deniedCopy = signedOut
      ? language === "ua"
        ? "Увійдіть або створіть акаунт з роллю organizer, admin чи superadmin, щоб відкрити цю панель."
        : "Sign in or create an account with organizer, admin, or superadmin access to open this surface."
      : dictionary.access.deniedCopy;

    return (
      <div className="mobile-safe-section grid min-h-[calc(100svh-var(--mobile-nav-height))] place-items-center bg-[#000000] px-3 py-10 sm:px-6 sm:py-24 md:px-10 lg:px-12">
        <div className="mx-auto w-full max-w-7xl border-y border-white/[0.05] bg-[#020202] px-3 py-8 sm:px-6 sm:py-12 2xl:max-w-[1500px]">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
            {accessState === "checking" ? dictionary.access.check : dictionary.access.denied}
          </p>
          <h1 className="mobile-hero-title mt-4 text-[clamp(1.8rem,10vw,3.75rem)] font-black uppercase leading-[0.98] text-white sm:leading-none">
            {accessState === "checking" ? dictionary.access.verifying : dictionary.access.restricted}
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-white/58">
            {accessState === "checking"
              ? dictionary.access.checkingCopy
              : deniedCopy}
          </p>
          {signedOut ? (
            <div className="mt-5 max-w-sm">
              <AuthControl />
            </div>
          ) : null}
          {accessState !== "checking" ? (
            <Link
              href="/"
              className="focus-ring mt-6 inline-flex min-h-12 items-center justify-center border border-primary px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-primary motion-safe:transition-[background-color,color,transform] motion-safe:duration-500 hover:bg-primary hover:text-black active:scale-[0.98] sm:tracking-widest"
            >
              {dictionary.access.returnHome}
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
