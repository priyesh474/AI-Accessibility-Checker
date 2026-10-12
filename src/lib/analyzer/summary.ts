import type {
  AiInsights,
  AiPriority,
  Issue,
  ScoreResult,
  SeveritySummary,
} from "@/types/analysis";
import { CATEGORY_LABELS, SEVERITY_ORDER } from "./scoring";

interface SummaryInput {
  issues: Issue[];
  summary: SeveritySummary;
  score: ScoreResult;
}

/** Build a deterministic, rule-based narrative when no model is configured. */
export function buildHeuristicInsights({
  issues,
  summary,
  score,
}: SummaryInput): AiInsights {
  return {
    enabled: false,
    provider: "heuristic",
    summary: buildSummary(issues, summary, score),
    priorities: buildPriorities(issues),
  };
}

function buildSummary(
  issues: Issue[],
  summary: SeveritySummary,
  score: ScoreResult,
): string {
  if (issues.length === 0) {
    return `No accessibility problems were detected in this snippet, giving it a score of ${score.score}/100. Automated checks cannot cover every WCAG requirement, so a manual review (keyboard-only use and a screen reader pass) is still worthwhile.`;
  }

  const parts: string[] = [];
  parts.push(
    `Found ${issues.length} issue${issues.length === 1 ? "" : "s"} (${score.score}/100, grade ${score.grade}).`,
  );

  const counts: string[] = [];
  if (summary.critical > 0) counts.push(`${summary.critical} critical`);
  if (summary.serious > 0) counts.push(`${summary.serious} serious`);
  if (summary.moderate > 0) counts.push(`${summary.moderate} moderate`);
  if (summary.minor > 0) counts.push(`${summary.minor} minor`);
  if (counts.length > 0) parts.push(`By severity: ${counts.join(", ")}.`);

  const byCategory = new Map<string, number>();
  for (const issue of issues) {
    const label = CATEGORY_LABELS[issue.category];
    byCategory.set(label, (byCategory.get(label) ?? 0) + 1);
  }
  const topCategories = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label, count]) => `${label} (${count})`);
  if (topCategories.length > 0) {
    parts.push(`Most affected areas: ${topCategories.join(", ")}.`);
  }

  const worst = issues.find((issue) => issue.severity === "critical" || issue.severity === "serious");
  if (worst) parts.push(`Start with: ${worst.title}.`);

  return parts.join(" ");
}

function buildPriorities(issues: Issue[]): AiPriority[] {
  const byRule = new Map<string, { issue: Issue; count: number }>();
  for (const issue of issues) {
    const entry = byRule.get(issue.ruleId);
    if (entry) entry.count += 1;
    else byRule.set(issue.ruleId, { issue, count: 1 });
  }

  return [...byRule.values()]
    .sort((a, b) => {
      const severity = SEVERITY_ORDER[a.issue.severity] - SEVERITY_ORDER[b.issue.severity];
      if (severity !== 0) return severity;
      return b.count - a.count;
    })
    .slice(0, 5)
    .map(({ issue, count }) => {
      const criteria = issue.wcag.map((c) => `${c.id} ${c.title}`).join(", ");
      const why = criteria
        ? `Maps to WCAG ${criteria} (${issue.severity}). ${count > 1 ? `Found ${count} times.` : ""}`.trim()
        : `${count > 1 ? `Found ${count} times. ` : ""}Flagged as ${issue.severity}.`;
      return {
        title: issue.title,
        why,
        how: issue.suggestion,
        ruleIds: [issue.ruleId],
      };
    });
}
