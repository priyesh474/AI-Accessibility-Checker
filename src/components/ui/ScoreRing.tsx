import type { ScoreGrade } from "@/types/analysis";
import { cn } from "@/lib/utils/cn";

const GRADE_COLORS: Record<ScoreGrade, { stroke: string; text: string; chip: string }> = {
  A: { stroke: "stroke-emerald-500", text: "text-emerald-600", chip: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  B: { stroke: "stroke-lime-500", text: "text-lime-700", chip: "bg-lime-50 text-lime-700 border-lime-200" },
  C: { stroke: "stroke-amber-500", text: "text-amber-700", chip: "bg-amber-50 text-amber-800 border-amber-200" },
  D: { stroke: "stroke-orange-500", text: "text-orange-700", chip: "bg-orange-50 text-orange-700 border-orange-200" },
  F: { stroke: "stroke-rose-500", text: "text-rose-700", chip: "bg-rose-50 text-rose-700 border-rose-200" },
};

interface ScoreRingProps {
  score: number;
  grade: ScoreGrade;
  label: string;
  className?: string;
}

/** Circular gauge for the 0–100 accessibility score. */
export function ScoreRing({ score, grade, label, className }: ScoreRingProps) {
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, score)) / 100);
  const colors = GRADE_COLORS[grade];

  return (
    <div className={cn("flex items-center gap-5", className)}>
      <div className="relative grid size-36 shrink-0 place-items-center">
        <svg
          viewBox="0 0 150 150"
          className="size-36 -rotate-90"
          role="img"
          aria-label={`Accessibility score ${score} out of 100, grade ${grade}`}
        >
          <circle cx="75" cy="75" r={radius} fill="none" strokeWidth="12" className="stroke-slate-200" />
          <circle
            cx="75"
            cy="75"
            r={radius}
            fill="none"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn("transition-[stroke-dashoffset] duration-700 ease-out", colors.stroke)}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={cn("text-4xl font-bold tabular-nums", colors.text)}>{score}</span>
          <span className="text-xs font-medium text-slate-500">out of 100</span>
        </div>
      </div>
      <div>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold",
            colors.chip,
          )}
        >
          Grade {grade}
        </span>
        <p className="mt-2 max-w-xs text-sm text-slate-600">{label}</p>
      </div>
    </div>
  );
}
