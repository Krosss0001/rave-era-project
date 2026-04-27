import { clsx } from "clsx";

const variants = {
  live: "border-primary/40 bg-primary/5 text-primary",
  soon: "border-primary/30 bg-primary/5 text-primary",
  limited: "border-primary/50 bg-primary/10 text-primary",
  planned: "border-white/[0.05] bg-white/[0.02] text-white/35"
};

type StatusBadgeProps = {
  label: string;
  variant?: keyof typeof variants;
};

export function StatusBadge({ label, variant = "planned" }: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex min-h-8 items-center gap-2 border px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.24em]",
        variants[variant]
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_12px_rgba(0,255,136,0.45)] motion-safe:animate-pulse" aria-hidden="true" />
      {label}
    </span>
  );
}
