"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { AuthControl } from "@/components/shared/auth-control";
import { WalletConnect } from "@/components/shared/wallet-connect";
import { RoleNav } from "@/components/layout/role-nav";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { useLanguage } from "@/lib/i18n/use-language";

export function Header() {
  const { dictionary } = useLanguage();
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const handleSessionChange = useCallback((nextSignedIn: boolean) => {
    setSignedIn(nextSignedIn);
  }, []);
  const navItems = [
    { href: "/events", label: dictionary.nav.events }
  ];
  const mobileNavItems = [
    { href: "/", label: "Home" },
    { href: "/events", label: "Events" },
    { href: "/dashboard", label: "Tickets" },
    { href: "/check-in", label: "Check-in" },
    { href: "/organizer", label: "Organizer" },
    { href: "/admin", label: "Admin" },
    { href: "/superadmin", label: "Superadmin" }
  ];

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  useEffect(() => {
    document.documentElement.style.overflow = menuOpen ? "hidden" : "";
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#020202] pt-[var(--safe-top)] shadow-[0_12px_42px_rgba(0,0,0,0.62)]">
      <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:px-6 md:min-h-16 md:px-10 lg:px-12 2xl:max-w-[1500px]">
        <Link href="/" onClick={() => setMenuOpen(false)} className="focus-ring group flex min-h-11 min-w-0 max-w-[calc(100vw-4.25rem)] shrink-0 items-center sm:max-w-[64vw] md:max-w-[48vw] lg:max-w-none">
          <span className="block whitespace-nowrap font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-white/82 motion-safe:transition-colors motion-safe:duration-300 group-hover:text-white sm:tracking-[0.13em] md:max-w-none md:text-[11px]">
            RAVEERA <span className="hidden text-white/50 min-[430px]:inline md:inline">GROUP</span><span className="hidden lg:inline"> EVENTS ASSISTANT</span>
          </span>
        </Link>
        <div className="hidden min-w-0 flex-1 items-center justify-end gap-2 md:flex">
          <nav className="-mx-1 flex min-w-0 items-center gap-1 overflow-x-auto px-1 [scrollbar-width:none] md:gap-2 [&::-webkit-scrollbar]:hidden" aria-label="Primary navigation">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="focus-ring group relative min-h-11 shrink-0 px-2.5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.11em] text-white/50 motion-safe:transition-colors motion-safe:duration-300 hover:text-primary sm:px-3 md:tracking-[0.18em]"
              >
                <span className="absolute left-3 right-3 top-0 h-px scale-x-0 bg-primary motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out group-hover:scale-x-100" aria-hidden="true" />
                {item.label}
              </Link>
            ))}
            <RoleNav />
          </nav>
          <LanguageToggle />
          <AuthControl onSessionChange={handleSessionChange} />
          {signedIn ? <WalletConnect /> : null}
        </div>
        <button
          type="button"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
          className="focus-ring inline-flex h-11 min-h-11 w-11 min-w-11 shrink-0 items-center justify-center border border-white/[0.12] bg-[#050505] text-white/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] motion-safe:transition-colors motion-safe:duration-200 hover:border-primary/45 hover:text-primary md:hidden"
        >
          {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>
      {menuOpen ? (
        <div id="mobile-menu" className="fixed inset-0 isolate z-[220] h-svh w-screen overflow-hidden bg-black text-white motion-safe:animate-[appOverlayFade_160ms_ease-out_both] md:hidden">
          <div className="absolute inset-0 z-0 bg-black" aria-hidden="true" />
          <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:56px_56px] opacity-30" aria-hidden="true" />
          <div className="relative z-10 h-svh overflow-y-auto bg-black px-3 pb-[calc(var(--safe-bottom)+1.25rem)] pt-[calc(var(--safe-top)+4.75rem)] motion-safe:animate-[appPanelRise_180ms_cubic-bezier(0.16,1,0.3,1)_both]">
            <div className="fixed inset-x-0 top-0 z-[230] border-b border-white/[0.08] bg-black px-3 pb-2 pt-[calc(var(--safe-top)+0.5rem)] shadow-[0_18px_60px_rgba(0,0,0,0.86)]">
              <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
                <Link href="/" onClick={() => setMenuOpen(false)} className="focus-ring flex min-h-11 min-w-0 items-center font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-white/82">
                  <span className="truncate">RAVEERA</span>
                </Link>
                <button
                  type="button"
                  aria-label="Close navigation menu"
                  onClick={() => setMenuOpen(false)}
                  className="focus-ring inline-flex h-11 min-h-11 w-11 min-w-11 items-center justify-center border border-white/[0.12] bg-[#050505] text-white/78 hover:border-primary/45 hover:text-primary"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <nav className="grid gap-2 border border-white/[0.08] bg-[#030303] p-2 shadow-[0_18px_70px_rgba(0,0,0,0.55)]" aria-label="Mobile navigation">
              {mobileNavItems.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`focus-ring flex min-h-12 items-center justify-between border px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.12em] shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] motion-safe:transition-[background-color,border-color,color,transform] motion-safe:duration-200 active:scale-[0.99] ${
                      active
                        ? "border-primary/80 bg-primary/[0.16] text-primary shadow-[0_0_34px_rgba(0,255,136,0.1)]"
                        : "border-white/[0.1] bg-black text-white/78 hover:border-primary/35 hover:bg-[#07120d] hover:text-white"
                    }`}
                  >
                    {item.label}
                    <span aria-hidden="true">-&gt;</span>
                  </Link>
                );
              })}
            </nav>
            <div className="mt-4 grid gap-3">
              <div className="border border-white/[0.08] bg-[#030303] p-3 shadow-[0_18px_70px_rgba(0,0,0,0.45)]">
                <LanguageToggle mobile />
              </div>
              <div className="grid gap-3 border border-white/[0.08] bg-[#030303] p-3 shadow-[0_18px_70px_rgba(0,0,0,0.45)]">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white/42">Account</p>
                <AuthControl onSessionChange={handleSessionChange} />
                {signedIn ? <WalletConnect /> : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
