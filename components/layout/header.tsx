"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { AuthControl } from "@/components/shared/auth-control";
import { WalletConnect } from "@/components/shared/wallet-connect";
import { RoleNav } from "@/components/layout/role-nav";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { useLanguage } from "@/lib/i18n/use-language";

export function Header() {
  const { dictionary } = useLanguage();
  const [signedIn, setSignedIn] = useState(false);
  const handleSessionChange = useCallback((nextSignedIn: boolean) => {
    setSignedIn(nextSignedIn);
  }, []);
  const navItems = [
    { href: "/events", label: dictionary.nav.events }
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-black/[0.9] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:min-h-16 sm:px-6 md:flex-nowrap md:px-10 lg:px-12 2xl:max-w-[1500px]">
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
    </header>
  );
}
