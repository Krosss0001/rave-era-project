"use client";

import Link from "next/link";
import { CalendarDays, Home, QrCode, Ticket } from "lucide-react";
import { usePathname } from "next/navigation";

const items = [
  { href: "/events", label: "Events", Icon: CalendarDays },
  { href: "/dashboard", label: "Tickets", Icon: Ticket },
  { href: "/check-in", label: "Check-in", Icon: QrCode },
  { href: "/", label: "Home", Icon: Home }
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.1] bg-black px-2 pb-[var(--safe-bottom)] pt-2 shadow-[0_-20px_60px_rgba(0,0,0,0.82)] md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {items.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={`${href}-${label}`}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`focus-ring relative flex min-h-[3.75rem] flex-col items-center justify-center gap-1 overflow-hidden border px-1 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] motion-safe:transition-[background-color,border-color,color,transform,box-shadow] motion-safe:duration-200 active:scale-[0.98] ${
                active
                  ? "border-primary/55 bg-primary/[0.12] text-primary shadow-[0_0_28px_rgba(0,255,136,0.11)]"
                  : "border-white/[0.04] bg-[#050505] text-white/58 hover:border-white/[0.12] hover:text-white"
              }`}
            >
              {active ? <span className="absolute inset-x-3 top-0 h-px bg-primary shadow-[0_0_14px_rgba(0,255,136,0.7)]" aria-hidden="true" /> : null}
              <Icon className={`h-4 w-4 ${active ? "drop-shadow-[0_0_8px_rgba(0,255,136,0.55)]" : ""}`} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
