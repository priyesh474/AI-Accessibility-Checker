import type { Severity } from "@/types/analysis";
import { cn } from "@/lib/utils/cn";

export const SEVERITY_META: Record<
  Severity,
  { label: string; badge: string; dot: string; text: string }
> = {
  critical: {
    label: "Critical",
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
    text: "text-rose-700",
  },
  serious: {
    label: "Serious",
    badge: "border-orange-200 bg-orange-50 text-orange-700",
    dot: "bg-orange-500",
    text: "text-orange-700",
  },
  moderate: {
    label: "Moderate",
    badge: "border-amber-200 bg-amber-50 text-amber-800",
    dot: "bg-amber-500",
    text: "text-amber-800",
  },
  minor: {
    label: "Minor",
    badge: "border-sky-200 bg-sky-50 text-sky-700",
    dot: "bg-sky-500",
    text: "text-sky-700",
  },
};

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
}

/** Severity pill with a colour dot (colour is never the only signal). */
export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const meta = SEVERITY_META[severity];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        meta.badge,
        className,
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}
