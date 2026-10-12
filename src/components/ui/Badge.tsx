import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/** Small pill used for labels, counts and metadata. */
export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700",
        className,
      )}
      {...props}
    />
  );
}
