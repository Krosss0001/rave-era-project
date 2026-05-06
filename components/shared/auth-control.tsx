"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { LogIn, LogOut, Mail, MessageCircle, ShieldCheck, Wallet } from "lucide-react";
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

type AuthControlProps = {
  onSessionChange?: (signedIn: boolean) => void;
};

export function AuthControl({ onSessionChange }: AuthControlProps) {
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
  const appCopy = {
    welcome: "Rave'era app access",
    intro:
      language === "ua"
        ? "РћРґРЅРѕСЂР°Р·РѕРІРµ РїРѕСЃРёР»Р°РЅРЅСЏ РґР»СЏ РєРІРёС‚РєС–РІ, QR РґРѕСЃС‚СѓРїСѓ С– wallet-ready РїСЂРѕС„С–Р»СЋ."
        : "Get a one-time link for tickets, QR access, and a wallet-ready profile.",
    continueEmail: language === "ua" ? "Continue with Email" : "Continue with Email",
    telegramSoon: language === "ua" ? "Continue with Telegram" : "Continue with Telegram",
    walletLater: language === "ua" ? "Continue with Wallet" : "Continue with Wallet"
  };

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      onSessionChange?.(Boolean(data.session));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      onSessionChange?.(Boolean(nextSession));
      if (nextSession) {
        setOpen(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [onSessionChange, supabase]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

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
    onSessionChange?.(false);
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
          className="fixed inset-x-3 top-[calc(var(--safe-top)+4.75rem)] z-[120] border border-white/[0.08] bg-[#020202] p-4 shadow-[0_0_70px_rgba(0,0,0,0.86)] motion-safe:animate-[appPanelRise_180ms_cubic-bezier(0.16,1,0.3,1)_both] sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[min(23rem,calc(100vw-1rem))]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="app-logo-mark h-11 w-11 shrink-0">
                <img src="/icons/icon-192.png" alt="" className="h-full w-full object-cover" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">{appCopy.welcome}</p>
                <h2 className="mt-2 text-xl font-black uppercase leading-none text-white">{copy.emailLogin}</h2>
              </div>
            </div>
            <StatusBadge label={configured ? "connected" : "env missing"} variant={configured ? "success" : "warning"} size="sm" />
          </div>
          <p className="mt-3 text-xs leading-5 text-white/48">
            {appCopy.intro}
          </p>
          <div className="mt-4 grid gap-2">
            <button
              type="button"
              onClick={() => document.getElementById("auth-email")?.focus()}
              className="focus-ring flex min-h-12 w-full items-center justify-between border border-primary/45 bg-primary/[0.06] px-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-primary"
            >
              <span className="inline-flex items-center gap-2"><Mail className="h-4 w-4" aria-hidden="true" />{appCopy.continueEmail}</span>
              <span aria-hidden="true">-&gt;</span>
            </button>
            <button
              type="button"
              disabled
              className="flex min-h-12 w-full cursor-not-allowed items-center justify-between border border-white/[0.06] bg-black px-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-white/30"
            >
              <span className="inline-flex items-center gap-2"><MessageCircle className="h-4 w-4" aria-hidden="true" />{appCopy.telegramSoon}</span>
              <span>soon</span>
            </button>
            <button
              type="button"
              disabled
              className="flex min-h-12 w-full cursor-not-allowed items-center justify-between border border-white/[0.06] bg-black px-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-white/30"
            >
              <span className="inline-flex items-center gap-2"><Wallet className="h-4 w-4" aria-hidden="true" />{appCopy.walletLater}</span>
              <span>after login</span>
            </button>
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
