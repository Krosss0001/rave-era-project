"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Eye, EyeOff, LogIn, LogOut, Mail, MessageCircle, ShieldCheck, Wallet } from "lucide-react";
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

type AuthMode = "login" | "signup";
type AuthStatus = "idle" | "loading" | "success" | "error";
type AuthAction = "password" | "magic" | "reset" | "signout" | null;
type FieldErrors = {
  email?: string;
  password?: string;
};

export function AuthControl({ onSessionChange }: AuthControlProps) {
  const { dictionary } = useLanguage();
  const configured = isSupabaseConfigured();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [activeAction, setActiveAction] = useState<AuthAction>(null);
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const copy = {
    welcome: "Rave'era app access",
    intro: "Sign in for tickets, QR access, referrals, and wallet-ready event profiles.",
    login: "Login",
    createAccount: "Create account",
    createTab: "Create",
    email: "Email",
    password: "Password",
    signingIn: "Signing in",
    creating: "Creating account",
    signingOut: "Signing out",
    sendReset: "Send reset email",
    sending: "Sending",
    forgotPassword: "Forgot password?",
    usePassword: "Use password login",
    magicLink: "Magic link",
    magicSent: "Check your email for the login link.",
    resetSent: "Password reset email sent.",
    accountCreated: "Account created. Check your email if confirmation is required.",
    missingSupabase: "Supabase public env vars are not loaded.",
    fixFields: "Fix the highlighted fields and try again.",
    emailBeforeMagic: "Enter your email before requesting a magic link.",
    emailBeforeReset: "Enter your email before requesting a reset link.",
    showPassword: "Show password",
    hidePassword: "Hide password",
    telegramSoon: "Continue with Telegram",
    walletLater: "Continue with Wallet"
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
        setPassword("");
        setStatus("idle");
        setActiveAction(null);
        setMessage("");
        setFieldErrors({});
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

  function resetFormFeedback() {
    setStatus("idle");
    setActiveAction(null);
    setMessage("");
    setFieldErrors({});
  }

  function validateEmailOnly(messageOnFailure: string) {
    const errors: FieldErrors = {};
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      errors.email = "Enter a valid email address.";
    }

    setFieldErrors(errors);

    if (errors.email) {
      setStatus("error");
      setMessage(messageOnFailure);
      document.getElementById("auth-email")?.focus();
      return false;
    }

    return true;
  }

  function validatePasswordForm() {
    const errors: FieldErrors = {};
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      errors.email = "Enter a valid email address.";
    }

    if (!password) {
      errors.password = "Password is required.";
    } else if (authMode === "signup" && password.length < 8) {
      errors.password = "Password needs at least 8 characters.";
    }

    setFieldErrors(errors);

    if (errors.email) {
      document.getElementById("auth-email")?.focus();
    } else if (errors.password) {
      document.getElementById("auth-password")?.focus();
    }

    return Object.keys(errors).length === 0;
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setStatus("error");
      setMessage(copy.missingSupabase);
      return;
    }

    if (showForgotPassword) {
      await sendPasswordReset();
      return;
    }

    if (!validatePasswordForm()) {
      setStatus("error");
      setMessage(copy.fixFields);
      return;
    }

    setStatus("loading");
    setActiveAction("password");
    setMessage("");

    const normalizedEmail = email.trim();
    const { data, error } =
      authMode === "login"
        ? await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password
          })
        : await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
              emailRedirectTo: getEmailRedirectTo()
            }
          });

    if (error) {
      setStatus("error");
      setActiveAction(null);
      setMessage(error.message);
      return;
    }

    if (data.session) {
      setOpen(false);
      setPassword("");
      setStatus("idle");
      setActiveAction(null);
      setMessage("");
      onSessionChange?.(true);
      return;
    }

    setStatus("success");
    setActiveAction(null);
    setMessage(authMode === "signup" ? copy.accountCreated : "Signed in.");
  }

  async function sendMagicLink() {
    if (!supabase) {
      setStatus("error");
      setMessage(copy.missingSupabase);
      return;
    }

    if (!validateEmailOnly(copy.emailBeforeMagic)) {
      return;
    }

    setStatus("loading");
    setActiveAction("magic");
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: getEmailRedirectTo()
      }
    });

    if (error) {
      setStatus("error");
      setActiveAction(null);
      setMessage(error.message);
      return;
    }

    setStatus("success");
    setActiveAction(null);
    setMessage(copy.magicSent);
  }

  async function sendPasswordReset() {
    if (!supabase) {
      setStatus("error");
      setMessage(copy.missingSupabase);
      return;
    }

    if (!validateEmailOnly(copy.emailBeforeReset)) {
      return;
    }

    setStatus("loading");
    setActiveAction("reset");
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: getEmailRedirectTo()
    });

    if (error) {
      setStatus("error");
      setActiveAction(null);
      setMessage(error.message);
      return;
    }

    setStatus("success");
    setActiveAction(null);
    setMessage(copy.resetSent);
  }

  async function signOut() {
    if (!supabase) {
      return;
    }

    setStatus("loading");
    setActiveAction("signout");
    await supabase.auth.signOut();
    setSession(null);
    onSessionChange?.(false);
    setStatus("idle");
    setActiveAction(null);
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
          disabled={activeAction === "signout"}
          className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 border border-white/[0.08] bg-[#050505] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.11em] text-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] motion-safe:transition-[color,border-color,background-color,transform,opacity,box-shadow] motion-safe:duration-300 motion-safe:ease-out hover:border-primary/45 hover:bg-primary/[0.045] hover:text-primary hover:shadow-[0_0_24px_rgba(0,255,136,0.08)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 sm:tracking-[0.16em]"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          {activeAction === "signout" ? copy.signingOut : dictionary.nav.signOut}
        </button>
      </div>
    );
  }

  return (
    <div className="relative block min-w-0">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          resetFormFeedback();
        }}
        aria-expanded={open}
        className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 border border-primary/50 bg-primary px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.11em] text-black shadow-[0_0_26px_rgba(0,255,136,0.12)] motion-safe:transition-[filter,border-color,box-shadow,transform] motion-safe:duration-300 motion-safe:ease-out hover:brightness-110 hover:shadow-[0_0_34px_rgba(0,255,136,0.18)] active:scale-[0.98] sm:tracking-[0.16em]"
      >
        <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
        {dictionary.nav.signIn}
      </button>
      {open ? (
        <form
          onSubmit={handlePasswordSubmit}
          aria-busy={status === "loading"}
          className="fixed inset-x-3 top-[calc(var(--safe-top)+4.75rem)] z-[120] max-h-[calc(100svh-var(--safe-top)-5.5rem)] overflow-y-auto border border-white/[0.08] bg-[#020202] p-4 shadow-[0_0_70px_rgba(0,0,0,0.86)] motion-safe:animate-[appPanelRise_180ms_cubic-bezier(0.16,1,0.3,1)_both] sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[min(24rem,calc(100vw-1rem))]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">{copy.welcome}</p>
                <h2 className="mt-2 text-xl font-black uppercase leading-none text-white">
                  {showForgotPassword ? "Reset password" : authMode === "login" ? copy.login : copy.createAccount}
                </h2>
              </div>
            </div>
            <StatusBadge label={configured ? "connected" : "env missing"} variant={configured ? "success" : "warning"} size="sm" />
          </div>

          <p className="mt-3 text-xs leading-5 text-white/48">{copy.intro}</p>

          {!showForgotPassword ? (
            <div className="mt-4 grid grid-cols-2 border border-white/[0.08] bg-black p-1" role="tablist" aria-label="Authentication mode">
              {(["login", "signup"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  role="tab"
                  aria-selected={authMode === mode}
                  onClick={() => {
                    setAuthMode(mode);
                    resetFormFeedback();
                  }}
                  className={`focus-ring min-h-10 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.12em] motion-safe:transition-[background-color,color] motion-safe:duration-200 ${
                    authMode === mode ? "bg-primary text-black" : "text-white/48 hover:text-primary"
                  }`}
                >
                  {mode === "login" ? copy.login : copy.createTab}
                </button>
              ))}
            </div>
          ) : null}

          <fieldset className="mt-4 grid gap-3">
            <legend className="sr-only">{showForgotPassword ? "Password reset" : "Email password authentication"}</legend>
            <div>
              <label htmlFor="auth-email" className="block font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
                {copy.email}
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((errors) => ({ ...errors, email: undefined }));
                  }
                }}
                placeholder="you@domain.com"
                autoComplete="email"
                spellCheck={false}
                required
                aria-invalid={fieldErrors.email ? "true" : undefined}
                aria-describedby={fieldErrors.email ? "auth-email-error" : undefined}
                className="mt-2 min-h-11 w-full border border-white/[0.08] bg-black px-3 font-mono text-sm text-white outline-none motion-safe:transition-colors motion-safe:duration-300 focus:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              />
              {fieldErrors.email ? (
                <p id="auth-email-error" className="mt-1.5 text-xs leading-5 text-red-200">
                  {fieldErrors.email}
                </p>
              ) : null}
            </div>

            {!showForgotPassword ? (
              <div>
                <label htmlFor="auth-password" className="block font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
                  {copy.password}
                </label>
                <div className="mt-2 flex min-h-11 border border-white/[0.08] bg-black focus-within:border-primary focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background">
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (fieldErrors.password) {
                        setFieldErrors((errors) => ({ ...errors, password: undefined }));
                      }
                    }}
                    autoComplete={authMode === "login" ? "current-password" : "new-password"}
                    required
                    aria-invalid={fieldErrors.password ? "true" : undefined}
                    aria-describedby={fieldErrors.password ? "auth-password-error" : authMode === "signup" ? "auth-password-hint" : undefined}
                    className="min-h-11 min-w-0 flex-1 bg-transparent px-3 font-mono text-sm text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? copy.hidePassword : copy.showPassword}
                    className="focus-ring inline-flex min-h-11 min-w-11 items-center justify-center text-white/52 hover:text-primary"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
                {fieldErrors.password ? (
                  <p id="auth-password-error" className="mt-1.5 text-xs leading-5 text-red-200">
                    {fieldErrors.password}
                  </p>
                ) : authMode === "signup" ? (
                  <p id="auth-password-hint" className="mt-1.5 text-xs leading-5 text-white/38">
                    Use at least 8 characters.
                  </p>
                ) : null}
              </div>
            ) : null}
          </fieldset>

          <button
            type="submit"
            disabled={status === "loading" || !configured}
            className="focus-ring mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 bg-primary px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-black shadow-[0_0_28px_rgba(0,255,136,0.12)] motion-safe:transition-[filter,transform,opacity] motion-safe:duration-300 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            {activeAction === "password"
              ? authMode === "login"
                ? copy.signingIn
                : copy.creating
              : activeAction === "reset"
                ? copy.sending
                : showForgotPassword
                  ? copy.sendReset
                  : authMode === "login"
                    ? copy.login
                    : copy.createAccount}
          </button>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword((value) => !value);
                resetFormFeedback();
              }}
              className="focus-ring inline-flex min-h-10 items-center justify-center px-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-white/52 hover:text-primary"
            >
              {showForgotPassword ? copy.usePassword : copy.forgotPassword}
            </button>
            {!showForgotPassword ? (
              <button
                type="button"
                onClick={sendMagicLink}
                disabled={status === "loading" || !configured}
                className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 border border-white/[0.08] bg-black px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-white/58 motion-safe:transition-colors motion-safe:duration-200 hover:border-primary/35 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                {activeAction === "magic" ? copy.sending : copy.magicLink}
              </button>
            ) : null}
          </div>

          <div className="mt-4 grid gap-2">
            <button
              type="button"
              disabled
              className="flex min-h-12 w-full cursor-not-allowed items-center justify-between border border-white/[0.06] bg-black px-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-white/30"
            >
              <span className="inline-flex items-center gap-2">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                {copy.telegramSoon}
              </span>
              <span>soon</span>
            </button>
            <button
              type="button"
              disabled
              className="flex min-h-12 w-full cursor-not-allowed items-center justify-between border border-white/[0.06] bg-black px-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-white/30"
            >
              <span className="inline-flex items-center gap-2">
                <Wallet className="h-4 w-4" aria-hidden="true" />
                {copy.walletLater}
              </span>
              <span>after login</span>
            </button>
          </div>

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
