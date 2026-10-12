"use client";

import { useId } from "react";
import type { AnalysisReport, IssueCategory, Severity } from "@/types/analysis";
import { Button } from "@/components/ui/Button";
import { SEVERITY_META } from "@/components/ui/SeverityBadge";
import { cn } from "@/lib/utils/cn";

const SEVERITIES: Severity[] = ["critical", "serious", "moderate", "minor"];

export interface IssueFilterState {
  severities: Severity[];
  category: IssueCategory | "all";
  query: string;
}

interface IssueFiltersProps {
  report: AnalysisReport;
  value: IssueFilterState;
  onChange: (next: IssueFilterState) => void;
  matchCount: number;
}

/** Severity / category / text filters for the issue list. */
export function IssueFilters({ report, value, onChange, matchCount }: IssueFiltersProps) {
  const categoryId = useId();
  const searchId = useId();

  const toggleSeverity = (severity: Severity) => {
    const active = value.severities.includes(severity);
    const next = active
      ? value.severities.filter((item) => item !== severity)
      : [...value.severities, severity];
    onChange({ ...value, severities: next.length > 0 ? next : SEVERITIES });
  };

  const reset = () =>
    onChange({ severities: SEVERITIES, category: "all", query: "" });

  return (
    <div className="space-y-3">
      <fieldset>
        <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Severity
        </legend>
        <div className="flex flex-wrap gap-2">
          {SEVERITIES.map((severity) => {
            const active = value.severities.includes(severity);
            const meta = SEVERITY_META[severity];
            return (
              <button
                key={severity}
                type="button"
                aria-pressed={active}
                onClick={() => toggleSeverity(severity)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                  active
                    ? meta.badge
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn("size-1.5 rounded-full", active ? meta.dot : "bg-slate-300")}
                />
                {meta.label}
                <span className="tabular-nums opacity-70">{report.summary[severity]}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[11rem] flex-1 space-y-1">
          <label htmlFor={categoryId} className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Category
          </label>
          <select
            id={categoryId}
            value={value.category}
            onChange={(event) =>
              onChange({ ...value, category: event.target.value as IssueCategory | "all" })
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
          >
            <option value="all">All categories</option>
            {report.categories.map((category) => (
              <option key={category.category} value={category.category}>
                {category.label} ({category.count})
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[12rem] flex-[2] space-y-1">
          <label htmlFor={searchId} className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Search issues
          </label>
          <input
            id={searchId}
            type="search"
            value={value.query}
            onChange={(event) => onChange({ ...value, query: event.target.value })}
            placeholder="e.g. alt, label, aria"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <Button variant="ghost" size="sm" onClick={reset}>
          Reset filters
        </Button>
      </div>

      <p aria-live="polite" className="text-xs text-slate-500">
        Showing <span className="font-medium text-slate-700 tabular-nums">{matchCount}</span> of{" "}
        <span className="tabular-nums">{report.issues.length}</span> issues
      </p>
    </div>
  );
}
