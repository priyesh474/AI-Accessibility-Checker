import type { AnalysisReport } from "@/types/analysis";
import { Card, CardBody } from "@/components/ui/Card";

interface ReportMetaProps {
  report: AnalysisReport;
}

/** Collapsible panels for notes, skipped checks and passing checks. */
export function ReportMeta({ report }: ReportMetaProps) {
  const hasAnything =
    report.notices.length > 0 || report.skipped.length > 0 || report.passed.length > 0;

  if (!hasAnything) return null;

  return (
    <Card>
      <CardBody className="space-y-3">
        {report.notices.length > 0 ? (
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-slate-700">
              Notes &amp; limitations ({report.notices.length})
            </summary>
            <ul className="mt-2 space-y-1.5 pl-4 text-sm text-slate-600">
              {report.notices.map((notice) => (
                <li key={notice} className="list-disc">
                  {notice}
                </li>
              ))}
            </ul>
          </details>
        ) : null}

        {report.skipped.length > 0 ? (
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-slate-700">
              Skipped checks ({report.skipped.length})
            </summary>
            <ul className="mt-2 space-y-1.5 pl-4 text-sm text-slate-600">
              {report.skipped.map((skipped) => (
                <li key={skipped.ruleId} className="list-disc">
                  <span className="font-medium text-slate-700">{skipped.title}</span> —{" "}
                  {skipped.reason}
                </li>
              ))}
            </ul>
          </details>
        ) : null}

        {report.passed.length > 0 ? (
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-slate-700">
              Checks that passed ({report.passed.length})
            </summary>
            <ul className="mt-2 grid gap-1 pl-4 text-sm text-slate-600 sm:grid-cols-2">
              {report.passed.map((title) => (
                <li key={title} className="list-disc">
                  {title}
                </li>
              ))}
            </ul>
          </details>
        ) : null}

        <p className="border-t border-slate-100 pt-3 text-xs text-slate-400">
          Engine {report.engine.name} v{report.engine.version} · report {report.id.slice(0, 8)}
        </p>
      </CardBody>
    </Card>
  );
}
