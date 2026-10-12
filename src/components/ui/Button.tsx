import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300 border border-transparent",
  secondary:
    "bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 disabled:text-slate-400",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 border border-transparent disabled:text-slate-400",
  danger:
    "bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-300 border border-transparent",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-4 py-2.5 text-sm gap-2",
};

/** Accessible button with sensible focus and disabled states. */
export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
}
