import { cn } from "@/lib/utils/cn";

interface CodeBlockProps {
  code: string;
  label?: string;
  /** Optional tone to differentiate "before" and "after" samples. */
  tone?: "neutral" | "good" | "bad";
  className?: string;
}

const TONES: Record<NonNullable<CodeBlockProps["tone"]>, string> = {
  neutral: "bg-slate-900 text-slate-100",
  good: "bg-emerald-950 text-emerald-100",
  bad: "bg-rose-950 text-rose-100",
};

/** Scrollable, monospaced code viewer with an optional label. */
export function CodeBlock({ code, label, tone = "neutral", className }: CodeBlockProps) {
  return (
    <figure className={cn("min-w-0", className)}>
      {label ? (
        <figcaption className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </figcaption>
      ) : null}
      <pre
        className={cn(
          "overflow-x-auto rounded-lg p-3 text-xs leading-relaxed",
          TONES[tone],
        )}
        tabIndex={0}
        role="region"
        aria-label={label ? `${label} code sample` : "Code sample"}
      >
        <code>{code}</code>
      </pre>
    </figure>
  );
}
