"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentRole, type RoleState } from "@/lib/auth/get-role";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/supabase/types";

type RoleGateProps = {
  allowedRoles: UserRole[];
  children: ReactNode;
};

export function RoleGate({ allowedRoles, children }: RoleGateProps) {
  const router = useRouter();
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
        router.replace("/");
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
          router.replace("/");
          return;
        }

        setAccessState("checking");
      } catch {
        if (!mounted) {
          return;
        }

        setLoading(false);
        setAccessState("error");
        router.replace("/");
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
  }, [allowedKey, router, stableAllowedRoles, supabase]);

  if (loading || !state?.role || !stableAllowedRoles.includes(state.role)) {
    return (
      <div className="min-h-[70vh] bg-[#000000] px-4 py-24 sm:px-6 md:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl border-y border-white/[0.05] bg-[#020202] py-12 2xl:max-w-[1500px]">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
            {accessState === "checking" ? "Access check" : "Access denied"}
          </p>
          <h1 className="mt-4 text-4xl font-black uppercase leading-none text-white md:text-6xl">
            {accessState === "checking" ? "Verifying role" : "Restricted surface"}
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-white/45">
            {accessState === "checking"
              ? "Checking your Supabase profile before opening this control surface."
              : "Your current profile role cannot open this operator surface. You are being returned to the public experience."}
          </p>
          {accessState !== "checking" ? (
            <Link
              href="/"
              className="focus-ring mt-6 inline-flex min-h-11 items-center border border-primary px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest text-primary motion-safe:transition-[background-color,color,transform] motion-safe:duration-500 hover:bg-primary hover:text-black active:scale-[0.98]"
            >
              Return home
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
