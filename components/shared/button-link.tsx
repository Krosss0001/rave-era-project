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
      "bg-primary text-primary-foreground hover:bg-white motion-safe:hover:-translate-y-0.5",
    secondary:
      "px-0 text-white/35 underline decoration-white/10 underline-offset-8 hover:text-primary hover:decoration-primary",
    ghost: "border border-primary text-primary hover:bg-primary hover:text-black motion-safe:hover:-translate-y-0.5"
  };

  return (
    <Link
      href={href}
      className={clsx(
        "focus-ring inline-flex min-h-11 items-center justify-center px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-widest motion-safe:transition-[color,background-color,border-color,transform,text-decoration-color] motion-safe:duration-500 motion-safe:ease-out active:scale-[0.98]",
        styles[variant],
        className
      )}
    >
      {children}
    </Link>
  );
}
