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
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#020202]/95 pt-[var(--safe-top)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:px-6 md:min-h-16 md:px-10 lg:px-12 2xl:max-w-[1500px]">
        <Link href="/" onClick={() => setMenuOpen(false)} className="focus-ring group flex min-h-11 min-w-0 max-w-[calc(100vw-5rem)] shrink-0 items-center gap-2 sm:max-w-[64vw] md:max-w-[48vw] lg:max-w-none">
          <span className="app-logo-mark h-8 w-8 shrink-0">
            <img src="/icons/icon-192.png" alt="" className="h-full w-full object-cover" aria-hidden="true" />
          </span>
          <span className="block whitespace-nowrap font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-white/76 motion-safe:transition-colors motion-safe:duration-300 group-hover:text-white sm:tracking-[0.13em] md:max-w-none md:text-[11px]">
            RAVE<span className="text-primary">&apos;</span>ERA <span className="hidden text-white/50 min-[390px]:inline md:inline">EVENTS</span><span className="hidden md:inline"> ASSISTANT</span>
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
          className="focus-ring inline-flex min-h-11 min-w-11 items-center justify-center border border-white/[0.08] bg-[#020202] text-white/72 motion-safe:transition-colors motion-safe:duration-200 hover:border-primary/45 hover:text-primary md:hidden"
        >
          {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>
      {menuOpen ? (
        <div id="mobile-menu" className="fixed inset-0 isolate z-[100] bg-black/[0.86] backdrop-blur-xl motion-safe:animate-[appOverlayFade_180ms_ease-out_both] md:hidden">
          <div className="absolute inset-0 bg-[#020202]" aria-hidden="true" />
          <div className="relative min-h-svh overflow-y-auto border-b border-primary/20 bg-[#020202] px-3 pb-[calc(var(--safe-bottom)+1.5rem)] pt-[calc(var(--safe-top)+4.75rem)] shadow-[0_30px_100px_rgba(0,0,0,0.86)] motion-safe:animate-[appPanelRise_220ms_cubic-bezier(0.16,1,0.3,1)_both]">
            <div className="fixed inset-x-0 top-0 z-[101] border-b border-white/[0.06] bg-[#020202] px-3 pb-2 pt-[calc(var(--safe-top)+0.5rem)] shadow-[0_18px_60px_rgba(0,0,0,0.7)]">
              <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
                <Link href="/" onClick={() => setMenuOpen(false)} className="focus-ring flex min-h-11 items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-white/76">
                  <span className="app-logo-mark h-8 w-8 shrink-0">
                    <img src="/icons/icon-192.png" alt="" className="h-full w-full object-cover" aria-hidden="true" />
                  </span>
                  RAVE<span className="text-primary">&apos;</span>ERA EVENTS
                </Link>
                <button
                  type="button"
                  aria-label="Close navigation menu"
                  onClick={() => setMenuOpen(false)}
                  className="focus-ring inline-flex min-h-11 min-w-11 items-center justify-center border border-white/[0.08] bg-black text-white/72 hover:border-primary/45 hover:text-primary"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <nav className="grid gap-2" aria-label="Mobile navigation">
              {mobileNavItems.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`focus-ring flex min-h-12 items-center justify-between border px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.12em] shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] motion-safe:transition-[background-color,border-color,color,transform] motion-safe:duration-200 active:scale-[0.99] ${
                      active
                        ? "border-primary/70 bg-primary/[0.14] text-primary shadow-[0_0_34px_rgba(0,255,136,0.08)]"
                        : "border-white/[0.08] bg-[#070707] text-white/72 hover:border-primary/35 hover:bg-[#0a0a0a] hover:text-white"
                    }`}
                  >
                    {item.label}
                    <span aria-hidden="true">-&gt;</span>
                  </Link>
                );
              })}
            </nav>
            <div className="mt-5 grid gap-4 border-t border-white/[0.08] pt-5">
              <LanguageToggle mobile />
              <div className="grid gap-3">
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
