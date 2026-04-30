import { clsx } from "clsx";

const variants = {
  success: "border-primary/35 bg-primary/[0.055] text-primary",
  live: "border-primary/40 bg-primary/5 text-primary",
  soon: "border-primary/30 bg-primary/5 text-primary",
  limited: "border-primary/50 bg-primary/10 text-primary",
  pending: "border-white/[0.09] bg-white/[0.03] text-white/68",
  warning: "border-amber-300/25 bg-amber-300/[0.04] text-amber-100",
  danger: "border-red-400/25 bg-red-400/[0.04] text-red-100",
  neutral: "border-white/[0.07] bg-white/[0.025] text-white/45",
  planned: "border-white/[0.05] bg-white/[0.02] text-white/35"
};

type StatusBadgeProps = {
  label: string;
  variant?: keyof typeof variants;
  size?: "sm" | "md";
  className?: string;
};

export function getStatusBadgeVariant(value: string | boolean | null | undefined): keyof typeof variants {
  if (value === true) {
    return "success";
  }

  const normalized = String(value ?? "").toLowerCase();

  if (["active", "paid", "confirmed", "connected", "live", "yes"].includes(normalized)) {
    return "success";
  }

  if (["pending", "reserved", "standby", "invited"].includes(normalized)) {
    return "pending";
  }

  if (["used", "checked_in", "checked-in", "limited"].includes(normalized)) {
    return "warning";
  }

  if (["failed", "cancelled", "canceled", "error", "false", "no"].includes(normalized)) {
    return "danger";
  }

  if (normalized === "soon") {
    return "soon";
  }

  return "neutral";
}

export function getStatusBadgeClass(value: string | boolean | null | undefined) {
  return variants[getStatusBadgeVariant(value)];
}

export function StatusBadge({ label, variant = "planned", size = "md", className }: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex max-w-full items-center justify-center gap-2 border font-mono font-semibold uppercase leading-4",
        size === "sm" ? "min-h-7 px-2.5 py-1 text-[9px] tracking-[0.1em] sm:tracking-[0.14em]" : "min-h-8 px-3 py-2 text-[10px] tracking-[0.14em] sm:px-4 sm:tracking-[0.18em]",
        variants[variant],
        className
      )}
    >
      <span className="h-1.5 w-1.5 shrink-0 bg-current shadow-[0_0_12px_currentColor] motion-safe:animate-pulse" aria-hidden="true" />
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}
