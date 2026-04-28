"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { useLanguage } from "@/lib/i18n/use-language";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

function getEmailRedirectTo() {
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");

  if (configuredAppUrl) {
    return `${configuredAppUrl}/dashboard`;
  }

  return `${window.location.origin}/dashboard`;
}

export function AuthControl() {
  const { dictionary } = useLanguage();
  const configured = isSupabaseConfigured();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        setOpen(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  async function sendMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setStatus("error");
      setMessage("Supabase public env vars are not loaded.");
      return;
    }

    setStatus("loading");
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: getEmailRedirectTo()
      }
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
    setMessage("Check your email for the login link.");
  }

  async function signOut() {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    setSession(null);
    setStatus("idle");
    setMessage("");
  }

  if (session) {
    return (
      <div className="flex min-w-0 items-center gap-2 md:gap-3">
        <span className="hidden max-w-36 truncate font-mono text-[10px] uppercase tracking-[0.16em] text-white/45 sm:block">
          {session.user.email}
        </span>
        <button
          type="button"
          onClick={signOut}
          className="focus-ring min-h-10 border border-white/[0.05] px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45 motion-safe:transition-[color,border-color,transform] motion-safe:duration-500 motion-safe:ease-out hover:border-primary/30 hover:text-primary active:scale-[0.98]"
        >
          {dictionary.nav.signOut}
        </button>
      </div>
    );
  }

  return (
    <div className="relative block">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="focus-ring min-h-10 border border-primary/30 px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-primary motion-safe:transition-[background-color,box-shadow,transform] motion-safe:duration-500 motion-safe:ease-out hover:bg-primary/[0.04] hover:shadow-[0_0_24px_rgba(0,255,136,0.08)] active:scale-[0.98] sm:tracking-[0.18em]"
      >
        {dictionary.nav.signIn}
      </button>
      {open ? (
        <form
          onSubmit={sendMagicLink}
          className="absolute right-0 top-12 z-50 w-[min(20rem,calc(100vw-1rem))] border border-white/[0.08] bg-[#020202] p-4 shadow-[0_0_50px_rgba(0,0,0,0.65)]"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Email login</p>
            <span className={configured ? "font-mono text-[9px] uppercase tracking-[0.16em] text-primary" : "font-mono text-[9px] uppercase tracking-[0.16em] text-white/35"}>
              {configured ? "connected" : "env missing"}
            </span>
          </div>
          <label htmlFor="auth-email" className="mt-4 block font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@domain.com"
            autoComplete="email"
            required
            className="mt-2 min-h-11 w-full border border-white/[0.08] bg-black px-3 font-mono text-sm text-white outline-none motion-safe:transition-colors motion-safe:duration-500 focus:border-primary"
          />
          <button
            type="submit"
            disabled={status === "loading" || !configured}
            className="focus-ring mt-3 min-h-11 w-full bg-primary px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest text-black motion-safe:transition-[filter,transform,opacity] motion-safe:duration-500 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status === "loading" ? "Sending" : "Send login link"}
          </button>
          {message ? (
            <p className={status === "error" ? "mt-3 text-xs leading-5 text-red-200" : "mt-3 text-xs leading-5 text-white/55"} aria-live="polite">
              {message}
            </p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
