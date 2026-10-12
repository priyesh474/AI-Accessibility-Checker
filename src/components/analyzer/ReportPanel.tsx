"use client";

import { useMemo, useState } from "react";
import type { AnalysisReport, Severity } from "@/types/analysis";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { reportToMarkdown } from "@/lib/report/markdown";
import { downloadTextFile } from "@/lib/utils/cn";
import { InsightPanel } from "./InsightPanel";
import { IssueFilters, type IssueFilterState } from "./IssueFilters";
import { IssueList } from "./IssueList";
import { ReportMeta } from "./ReportMeta";
import { SummaryPanel } from "./SummaryPanel";
import { WcagPanel } from "./WcagPanel";

const ALL_SEVERITIES: Severity[] = ["critical", "serious", "moderate", "minor"];

interface ReportPanelProps {
  report: AnalysisReport;
}

/** Full results view: score, narrative, filters, issues and references. */
export function ReportPanel({ report }: ReportPanelProps) {
  const [filters, setFilters] = useState<IssueFilterState>({
    severities: ALL_SEVERITIES,
    category: "all",
    query: "",
  });
  const [copied, setCopied] = useState(false);

  const filteredIssues = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    return report.issues.filter((issue) => {
      if (!filters.severities.includes(issue.severity)) return false;
      if (filters.category !== "all" && issue.category !== filters.category) return false;
      if (query) {
        const haystack = [
          issue.title,
          issue.message,
          issue.suggestion,
          issue.selector,
          issue.ruleId,
          issue.category,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [report.issues, filters]);

  const markdown = useMemo(() => reportToMarkdown(report), [report]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section aria-label="Analysis report" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Accessibility report</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              downloadTextFile(`a11y-report-${report.id.slice(0, 8)}.md`, markdown, "text/markdown")
            }
          >
            Download .md
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              downloadTextFile(
                `a11y-report-${report.id.slice(0, 8)}.json`,
                JSON.stringify(report, null, 2),
                "application/json",
              )
            }
          >
            Download .json
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy summary"}
          </Button>
        </div>
      </div>

      <SummaryPanel report={report} />
      <InsightPanel ai={report.ai} />

      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-slate-900">
            Issues{" "}
            <span className="font-normal text-slate-500">({report.issues.length})</span>
          </h3>
        </CardHeader>
        <CardBody className="space-y-4">
          {report.issues.length > 0 ? (
            <IssueFilters
              report={report}
              value={filters}
              onChange={setFilters}
              matchCount={filteredIssues.length}
            />
          ) : null}
          <IssueList issues={filteredIssues} />
        </CardBody>
      </Card>

      <WcagPanel criteria={report.wcag} />
      <ReportMeta report={report} />
    </section>
  );
}
