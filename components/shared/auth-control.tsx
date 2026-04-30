"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { LogIn, LogOut, Mail, ShieldCheck } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { useLanguage } from "@/lib/i18n/use-language";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { StatusBadge } from "@/components/shared/status-badge";

function getEmailRedirectTo() {
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");

  if (configuredAppUrl) {
    return `${configuredAppUrl}/dashboard`;
  }

  return `${window.location.origin}/dashboard`;
}

export function AuthControl() {
  const { dictionary, language } = useLanguage();
  const configured = isSupabaseConfigured();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const copy =
    language === "ua"
      ? {
          emailLogin: "Вхід через email",
          intro: "Надішлемо одноразове посилання та повернемо вас у кабінет.",
          sending: "Надсилаємо",
          send: "Надіслати посилання",
          signingOut: "Вихід",
          missingSupabase: "Supabase public env vars are not loaded.",
          sent: "Перевірте email для входу."
        }
      : {
          emailLogin: "Email login",
          intro: "We will send a one-time link and return you to your dashboard.",
          sending: "Sending link",
          send: "Send login link",
          signingOut: "Signing out",
          missingSupabase: "Supabase public env vars are not loaded.",
          sent: "Check your email for the login link."
        };

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
      setMessage(copy.missingSupabase);
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
    setMessage(copy.sent);
  }

  async function signOut() {
    if (!supabase) {
      return;
    }

    setStatus("loading");
    await supabase.auth.signOut();
    setSession(null);
    setStatus("idle");
    setMessage("");
  }

  if (session) {
    return (
      <div className="flex min-w-0 items-center justify-end gap-2 md:gap-3">
        <span className="hidden max-w-36 truncate font-mono text-[10px] uppercase tracking-[0.16em] text-white/45 sm:block">
          {session.user.email}
        </span>
        <button
          type="button"
          onClick={signOut}
          disabled={status === "loading"}
          className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 border border-white/[0.08] bg-[#050505] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.11em] text-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] motion-safe:transition-[color,border-color,background-color,transform,opacity,box-shadow] motion-safe:duration-300 motion-safe:ease-out hover:border-primary/45 hover:bg-primary/[0.045] hover:text-primary hover:shadow-[0_0_24px_rgba(0,255,136,0.08)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 sm:tracking-[0.16em]"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          {status === "loading" ? copy.signingOut : dictionary.nav.signOut}
        </button>
      </div>
    );
  }

  return (
    <div className="relative block min-w-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 border border-primary/50 bg-primary px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.11em] text-black shadow-[0_0_26px_rgba(0,255,136,0.12)] motion-safe:transition-[filter,border-color,box-shadow,transform] motion-safe:duration-300 motion-safe:ease-out hover:brightness-110 hover:shadow-[0_0_34px_rgba(0,255,136,0.18)] active:scale-[0.98] sm:tracking-[0.16em]"
      >
        <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
        {dictionary.nav.signIn}
      </button>
      {open ? (
        <form
          onSubmit={sendMagicLink}
          className="fixed left-3 right-3 top-[4.75rem] z-50 border border-white/[0.08] bg-[#020202] p-4 shadow-[0_0_50px_rgba(0,0,0,0.72)] sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[min(21rem,calc(100vw-1rem))]"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
              <Mail className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.emailLogin}
            </p>
            <StatusBadge label={configured ? "connected" : "env missing"} variant={configured ? "success" : "warning"} size="sm" />
          </div>
          <p className="mt-3 text-xs leading-5 text-white/48">
            {copy.intro}
          </p>
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
            className="mt-2 min-h-11 w-full border border-white/[0.08] bg-black px-3 font-mono text-sm text-white outline-none motion-safe:transition-colors motion-safe:duration-300 focus:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
          <button
            type="submit"
            disabled={status === "loading" || !configured}
            className="focus-ring mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 bg-primary px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-black shadow-[0_0_28px_rgba(0,255,136,0.12)] motion-safe:transition-[filter,transform,opacity] motion-safe:duration-300 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            {status === "loading" ? copy.sending : copy.send}
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
