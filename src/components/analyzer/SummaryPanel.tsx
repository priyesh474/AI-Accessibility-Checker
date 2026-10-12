import type { AnalysisReport, Severity } from "@/types/analysis";
import { Card, CardBody } from "@/components/ui/Card";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { SEVERITY_META } from "@/components/ui/SeverityBadge";
import { cn } from "@/lib/utils/cn";

const SEVERITIES: Severity[] = ["critical", "serious", "moderate", "minor"];

const BAR_COLOR: Record<Severity, string> = {
  critical: "bg-rose-500",
  serious: "bg-orange-500",
  moderate: "bg-amber-400",
  minor: "bg-sky-400",
};

interface SummaryPanelProps {
  report: AnalysisReport;
}

/** Score, severity breakdown and input metadata. */
export function SummaryPanel({ report }: SummaryPanelProps) {
  const { score, summary, input, engine } = report;

  return (
    <Card>
      <CardBody className="grid gap-6 lg:grid-cols-[auto_1fr] lg:items-center">
        <ScoreRing score={score.score} grade={score.grade} label={score.label} />

        <div className="space-y-4">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SEVERITIES.map((severity) => {
              const meta = SEVERITY_META[severity];
              return (
                <div
                  key={severity}
                  className={cn("rounded-xl border px-3 py-2", meta.badge)}
                >
                  <dt className="text-xs font-medium">{meta.label}</dt>
                  <dd className="text-2xl font-bold tabular-nums">{summary[severity]}</dd>
                </div>
              );
            })}
          </dl>

          {summary.total > 0 ? (
            <div>
              <div
                className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100"
                role="img"
                aria-label={`${summary.critical} critical, ${summary.serious} serious, ${summary.moderate} moderate, ${summary.minor} minor`}
              >
                {SEVERITIES.map((severity) =>
                  summary[severity] > 0 ? (
                    <span
                      key={severity}
                      className={BAR_COLOR[severity]}
                      style={{ width: `${(summary[severity] / summary.total) * 100}%` }}
                    />
                  ) : null,
                )}
              </div>
            </div>
          ) : null}

          <dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
            <div className="flex gap-1.5">
              <dt>Elements</dt>
              <dd className="font-medium text-slate-700 tabular-nums">{input.elements}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt>Rules run</dt>
              <dd className="font-medium text-slate-700 tabular-nums">{engine.rulesRun}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt>Duration</dt>
              <dd className="font-medium text-slate-700 tabular-nums">{engine.durationMs} ms</dd>
            </div>
            <div className="flex gap-1.5">
              <dt>Type</dt>
              <dd className="font-medium text-slate-700">
                {input.isDocument ? "Full document" : "Fragment"}
              </dd>
            </div>
          </dl>
        </div>
      </CardBody>
    </Card>
  );
}
