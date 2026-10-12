import type { WcagCriterion } from "@/types/analysis";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

interface WcagPanelProps {
  criteria: WcagCriterion[];
}

/** Reference list of every WCAG criterion touched by the report. */
export function WcagPanel({ criteria }: WcagPanelProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-semibold text-slate-900">WCAG criteria involved</h2>
        <span className="text-xs text-slate-500">{criteria.length} criteria</span>
      </CardHeader>
      <CardBody>
        {criteria.length === 0 ? (
          <p className="text-sm text-slate-500">
            No WCAG success criteria were violated by the detected issues.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {criteria.map((criterion) => (
              <li key={criterion.id}>
                <a
                  href={criterion.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 rounded-lg border border-slate-200 px-3 py-2 hover:border-indigo-200 hover:bg-indigo-50/50"
                >
                  <span className="mt-0.5 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
                    {criterion.id}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-slate-800">
                      {criterion.title}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {criterion.principle} · Level {criterion.level}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
