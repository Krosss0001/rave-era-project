"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { AuthControl } from "@/components/shared/auth-control";
import { WalletConnect } from "@/components/shared/wallet-connect";
import { RoleNav } from "@/components/layout/role-nav";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { useLanguage } from "@/lib/i18n/use-language";

export function Header() {
  const { dictionary } = useLanguage();
  const [signedIn, setSignedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const handleSessionChange = useCallback((nextSignedIn: boolean) => {
    setSignedIn(nextSignedIn);
  }, []);
  const navItems = [
    { href: "/events", label: dictionary.nav.events }
  ];
  const mobileNavItems = [
    { href: "/", label: "Home" },
    { href: "/events", label: "Events" },
    { href: "/dashboard", label: "My tickets" },
    { href: "/organizer", label: "Organizer" },
    { href: "/admin", label: "Admin" },
    { href: "/superadmin", label: "Superadmin" },
    { href: "/check-in", label: "Check-in" }
  ];

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-black/[0.9] backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-3 py-2 [padding-top:calc(env(safe-area-inset-top)+0.5rem)] sm:px-6 md:hidden">
        <Link
          href="/"
          className="focus-ring group inline-flex min-h-11 min-w-0 items-center"
          onClick={() => setMobileMenuOpen(false)}
        >
          <span className="block whitespace-nowrap font-mono text-sm font-black uppercase tracking-[0.14em] text-white motion-safe:transition-colors motion-safe:duration-300 group-hover:text-primary">
            RAVE<span className="text-primary">&apos;</span>ERA
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
          className="focus-ring inline-flex h-11 w-11 shrink-0 items-center justify-center border border-white/[0.08] bg-[#020202] text-white motion-safe:transition-[border-color,color,background-color,transform] motion-safe:duration-300 hover:border-primary/45 hover:text-primary active:scale-[0.98]"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      <div className="mx-auto hidden max-w-7xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:min-h-16 sm:px-6 md:flex md:flex-nowrap md:px-10 lg:px-12 2xl:max-w-[1500px]">
        <Link href="/" className="focus-ring group min-h-11 min-w-0 max-w-[calc(100vw-1.5rem)] shrink-0 content-center sm:max-w-[64vw] md:max-w-[48vw] lg:max-w-none">
          <span className="block whitespace-nowrap font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-white/72 motion-safe:transition-colors motion-safe:duration-300 group-hover:text-white min-[360px]:text-[10px] sm:tracking-[0.13em] md:max-w-none md:text-[11px]">
            RAVE<span className="text-primary">&apos;</span>ERA <span className="hidden text-white/50 min-[390px]:inline">GROUP</span> <span className="text-primary" aria-hidden="true">{"\u00B7"}</span> <span className="hidden min-[360px]:inline">EVENTS </span>ASSISTANT
          </span>
        </Link>
        <div className="grid min-w-0 flex-1 basis-full grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-1.5 sm:basis-auto sm:flex sm:justify-end sm:gap-2">
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
      </div>

      {mobileMenuOpen ? (
        <div
          id="mobile-navigation"
          className="fixed inset-0 z-[70] overflow-y-auto bg-black px-4 pb-8 pt-[calc(env(safe-area-inset-top)+1rem)] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <div className="flex min-h-14 items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
            <Link
              href="/"
              className="focus-ring inline-flex min-h-11 items-center font-mono text-sm font-black uppercase tracking-[0.14em] text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              RAVE<span className="text-primary">&apos;</span>ERA
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation menu"
              className="focus-ring inline-flex h-11 w-11 shrink-0 items-center justify-center border border-white/[0.08] bg-[#020202] text-white motion-safe:transition-colors motion-safe:duration-300 hover:border-primary/45 hover:text-primary"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <nav className="mt-6 grid gap-2" aria-label="Mobile primary navigation">
            {mobileNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="focus-ring flex min-h-14 items-center justify-between border border-white/[0.07] bg-[#020202] px-4 font-mono text-sm font-bold uppercase tracking-[0.12em] text-white/78 motion-safe:transition-[border-color,color,background-color] motion-safe:duration-300 hover:border-primary/45 hover:bg-primary/[0.045] hover:text-primary"
              >
                {item.label}
                <span className="text-primary" aria-hidden="true">/</span>
              </Link>
            ))}
          </nav>

          <div className="mt-6 grid gap-4 border-t border-white/[0.06] pt-5">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/42">Language</span>
              <LanguageToggle />
            </div>
            <div className="grid gap-3">
              <AuthControl onSessionChange={handleSessionChange} />
              {signedIn ? <WalletConnect /> : null}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
