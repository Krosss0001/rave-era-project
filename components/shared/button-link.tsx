import Link from "next/link";
import type { ReactNode } from "react";
import { clsx } from "clsx";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
};

export function ButtonLink({ href, children, variant = "primary", className }: ButtonLinkProps) {
  const styles = {
    primary:
      "border border-primary bg-primary text-primary-foreground shadow-[0_0_28px_rgba(0,255,136,0.12)] hover:bg-white hover:border-white motion-safe:hover:-translate-y-0.5",
    secondary:
      "border border-white/[0.08] bg-white/[0.02] text-white/62 hover:border-primary/35 hover:bg-primary/[0.035] hover:text-primary motion-safe:hover:-translate-y-0.5",
    ghost: "border border-primary/45 bg-primary/[0.025] text-primary hover:bg-primary hover:text-black motion-safe:hover:-translate-y-0.5"
  };

  return (
    <Link
      href={href}
      className={clsx(
        "focus-ring inline-flex min-h-11 items-center justify-center gap-2 px-6 py-3 text-center font-mono text-[11px] font-bold uppercase leading-5 tracking-[0.16em] motion-safe:transition-[color,background-color,border-color,box-shadow,transform,text-decoration-color] motion-safe:duration-300 motion-safe:ease-out active:scale-[0.98]",
        styles[variant],
        className
      )}
    >
      {children}
    </Link>
  );
}
