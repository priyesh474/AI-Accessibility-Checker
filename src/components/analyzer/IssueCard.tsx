import type { Issue } from "@/types/analysis";
import { Badge } from "@/components/ui/Badge";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { SeverityBadge } from "@/components/ui/SeverityBadge";

interface IssueCardProps {
  issue: Issue;
  index: number;
}

/** One issue, rendered as a native <details> disclosure for free keyboard support. */
export function IssueCard({ issue, index }: IssueCardProps) {
  return (
    <details
      id={`issue-${issue.id}`}
      className="group overflow-hidden rounded-xl border border-slate-200 bg-white open:shadow-sm"
    >
      <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-3.5 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden="true"
          className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-slate-100 text-xs font-semibold text-slate-600"
        >
          {index}
        </span>
        <span className="min-w-0 flex-1 space-y-1.5">
          <span className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={issue.severity} />
            <span className="font-medium text-slate-900">{issue.title}</span>
          </span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600">
              {issue.ruleId}
            </code>
            <span aria-hidden="true">·</span>
            <span className="truncate font-mono text-[11px]">{issue.selector}</span>
            {issue.location ? (
              <>
                <span aria-hidden="true">·</span>
                <span>line {issue.location.line}</span>
              </>
            ) : null}
          </span>
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="mt-1 size-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>

      <div className="space-y-4 border-t border-slate-200 px-4 py-4">
        <p className="text-sm text-slate-700">{issue.message}</p>

        <div className="flex flex-wrap gap-1.5">
          {issue.wcag.map((criterion) => (
            <a
              key={criterion.id}
              href={criterion.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
            >
              {criterion.id} {criterion.title}
              <span className="text-indigo-400">· Level {criterion.level}</span>
            </a>
          ))}
        </div>

        <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5">
          <p className="text-sm text-emerald-900">
            <span className="font-semibold">Suggested fix: </span>
            {issue.suggestion}
          </p>
        </div>

        {issue.snippet ? (
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Affected markup
            </p>
            <CodeBlock code={issue.snippet} label={`${issue.element ?? "element"} at ${issue.selector}`} />
          </div>
        ) : null}

        {issue.codeExample ? (
          <div className="grid gap-3 md:grid-cols-2">
            <CodeBlock code={issue.codeExample.before} label="Before" tone="bad" />
            <CodeBlock code={issue.codeExample.after} label="After" tone="good" />
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <Badge>{issue.category}</Badge>
          {issue.helpUrl ? (
            <a
              href={issue.helpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-indigo-700 underline underline-offset-2 hover:text-indigo-900"
            >
              WCAG guidance
            </a>
          ) : null}
        </div>
      </div>
    </details>
  );
}
