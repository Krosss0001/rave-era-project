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
    { href: "/dashboard", label: "Dashboard" },
    { href: "/organizer", label: "Organizer" },
    { href: "/admin", label: "Admin" },
    { href: "/superadmin", label: "Superadmin" },
    { href: "/check-in", label: "Check-in" }
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

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-black/[0.9] backdrop-blur-xl">
      <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:px-6 md:min-h-16 md:px-10 lg:px-12 2xl:max-w-[1500px]">
        <Link href="/" className="focus-ring group min-h-11 min-w-0 max-w-[calc(100vw-1.5rem)] shrink-0 content-center sm:max-w-[64vw] md:max-w-[48vw] lg:max-w-none">
          <span className="block whitespace-nowrap font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-white/72 motion-safe:transition-colors motion-safe:duration-300 group-hover:text-white sm:tracking-[0.13em] md:max-w-none md:text-[11px]">
            RAVE<span className="text-primary">&apos;</span>ERA <span className="hidden text-white/50 min-[390px]:inline">GROUP</span> <span className="text-primary" aria-hidden="true">{"\u00B7"}</span> <span className="hidden min-[360px]:inline">EVENTS </span>ASSISTANT
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
        <div id="mobile-menu" className="fixed inset-x-0 top-14 z-50 max-h-[calc(100svh-3.5rem)] overflow-y-auto border-b border-white/[0.08] bg-black/98 px-3 pb-6 pt-3 shadow-[0_30px_80px_rgba(0,0,0,0.7)] md:hidden">
          <nav className="grid gap-2" aria-label="Mobile navigation">
            {mobileNavItems.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`focus-ring flex min-h-12 items-center justify-between border px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.12em] ${
                    active
                      ? "border-primary/50 bg-primary/[0.08] text-primary"
                      : "border-white/[0.06] bg-[#020202] text-white/68"
                  }`}
                >
                  {item.label}
                  <span aria-hidden="true">-&gt;</span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 grid gap-3 border-t border-white/[0.06] pt-4">
            <LanguageToggle />
            <AuthControl onSessionChange={handleSessionChange} />
            {signedIn ? <WalletConnect /> : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
