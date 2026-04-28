"use client";

import Link from "next/link";
import { AuthControl } from "@/components/shared/auth-control";
import { RoleNav } from "@/components/layout/role-nav";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { useLanguage } from "@/lib/i18n/use-language";

export function Header() {
  const { dictionary } = useLanguage();
  const navItems = [
    { href: "/events", label: dictionary.nav.events }
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.05] bg-black/[0.88] backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6 md:flex-nowrap md:px-10 lg:px-12 2xl:max-w-[1500px]">
        <Link href="/" className="focus-ring group min-w-0 max-w-full shrink-0 sm:max-w-[58vw] md:max-w-[42vw] lg:max-w-none">
          <span className="block truncate whitespace-nowrap font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white/62 motion-safe:transition-colors motion-safe:duration-500 group-hover:text-white md:max-w-none md:text-[11px]">
            Rave<span className="text-primary">&apos;</span>era Group <span className="text-primary" aria-hidden="true">{"\u00B7"}</span> Concerts <span className="text-primary">&amp;</span> Marketing Agency
          </span>
        </Link>
        <div className="flex min-w-0 flex-1 basis-full items-center justify-between gap-2 sm:basis-auto sm:justify-end">
          <nav className="-mx-1 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-1 [scrollbar-width:none] md:gap-2 [&::-webkit-scrollbar]:hidden" aria-label="Primary navigation">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="focus-ring group relative min-h-10 shrink-0 px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35 motion-safe:transition-colors motion-safe:duration-500 hover:text-primary md:tracking-[0.22em]"
              >
                <span className="absolute left-3 right-3 top-0 h-px scale-x-0 bg-primary motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out group-hover:scale-x-100" aria-hidden="true" />
                {item.label}
              </Link>
            ))}
            <RoleNav />
          </nav>
          <LanguageToggle />
          <AuthControl />
        </div>
      </div>
    </header>
  );
}
