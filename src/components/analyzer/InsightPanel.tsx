import type { AiInsights } from "@/types/analysis";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

interface InsightPanelProps {
  ai: AiInsights;
}

/** Plain-language narrative plus a prioritised fix list. */
export function InsightPanel({ ai }: InsightPanelProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-semibold text-slate-900">Summary &amp; priorities</h2>
        {ai.enabled ? (
          <Badge className="border-indigo-200 bg-indigo-50 text-indigo-700">
            AI · {ai.model}
          </Badge>
        ) : (
          <Badge>Rule-based narrative</Badge>
        )}
      </CardHeader>
      <CardBody className="space-y-4">
        {ai.error ? (
          <p
            role="status"
            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
          >
            AI enrichment was skipped: {ai.error}
          </p>
        ) : null}

        <p className="text-sm leading-relaxed text-slate-700">{ai.summary}</p>

        {ai.priorities.length > 0 ? (
          <ol className="space-y-3">
            {ai.priorities.map((priority, index) => (
              <li
                key={`${priority.title}-${index}`}
                className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5"
              >
                <div className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="grid size-6 shrink-0 place-items-center rounded-full bg-indigo-600 text-xs font-semibold text-white"
                  >
                    {index + 1}
                  </span>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">{priority.title}</p>
                    {priority.why ? (
                      <p className="text-xs text-slate-600">{priority.why}</p>
                    ) : null}
                    <p className="text-sm text-slate-700">
                      <span className="font-medium text-slate-800">Fix: </span>
                      {priority.how}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        ) : null}
      </CardBody>
    </Card>
  );
}
