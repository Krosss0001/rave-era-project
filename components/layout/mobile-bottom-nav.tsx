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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-black/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 backdrop-blur-xl md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {items.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={`${href}-${label}`}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`focus-ring flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] motion-safe:transition-colors motion-safe:duration-200 ${
                active ? "text-primary" : "text-white/42 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
