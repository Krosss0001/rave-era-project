import Link from "next/link";
import { AuthControl } from "@/components/shared/auth-control";
import { RoleNav } from "@/components/layout/role-nav";

const navItems = [
  { href: "/events", label: "Events" }
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.05] bg-black/[0.88] backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 sm:px-6 md:px-10 lg:px-12 2xl:max-w-[1500px]">
        <Link href="/" className="focus-ring group min-w-0 max-w-[58vw]">
          <span className="block truncate whitespace-nowrap font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white/62 motion-safe:transition-colors motion-safe:duration-500 group-hover:text-white md:max-w-none md:text-[11px]">
            Rave<span className="text-primary">&apos;</span>era Group <span className="text-primary" aria-hidden="true">{"\u00B7"}</span> Concerts <span className="text-primary">&amp;</span> Marketing Agency
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <nav className="flex items-center gap-2" aria-label="Primary navigation">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="focus-ring group relative min-h-10 px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35 motion-safe:transition-colors motion-safe:duration-500 hover:text-primary"
              >
                <span className="absolute left-3 right-3 top-0 h-px scale-x-0 bg-primary motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out group-hover:scale-x-100" aria-hidden="true" />
                {item.label}
              </Link>
            ))}
            <RoleNav />
          </nav>
          <AuthControl />
        </div>
      </div>
    </header>
  );
}
