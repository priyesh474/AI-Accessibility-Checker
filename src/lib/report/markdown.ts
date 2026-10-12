import type { AnalysisReport, Issue, Severity } from "@/types/analysis";

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "🔴 Critical",
  serious: "🟠 Serious",
  moderate: "🟡 Moderate",
  minor: "🔵 Minor",
};

function codeBlock(value: string): string {
  const fence = value.includes("```") ? "````" : "```";
  return `${fence}html\n${value}\n${fence}`;
}

function issueSection(issue: Issue, index: number): string {
  const lines: string[] = [];
  lines.push(`### ${index}. ${issue.title}`);
  lines.push("");
  lines.push(`- **Severity:** ${SEVERITY_LABEL[issue.severity]}`);
  lines.push(`- **Rule:** \`${issue.ruleId}\``);
  if (issue.wcag.length > 0) {
    lines.push(
      `- **WCAG:** ${issue.wcag.map((c) => `${c.id} ${c.title} (Level ${c.level})`).join("; ")}`,
    );
  }
  lines.push(`- **Selector:** \`${issue.selector}\``);
  if (issue.location) {
    lines.push(`- **Location:** line ${issue.location.line}, column ${issue.location.column}`);
  }
  lines.push("");
  lines.push(`**Problem:** ${issue.message}`);
  lines.push("");
  lines.push(`**Fix:** ${issue.suggestion}`);
  if (issue.snippet) {
    lines.push("");
    lines.push("<details><summary>Affected markup</summary>");
    lines.push("");
    lines.push(codeBlock(issue.snippet));
    lines.push("");
    lines.push("</details>");
  }
  if (issue.codeExample) {
    lines.push("");
    lines.push("**Before**");
    lines.push("");
    lines.push(codeBlock(issue.codeExample.before));
    lines.push("");
    lines.push("**After**");
    lines.push("");
    lines.push(codeBlock(issue.codeExample.after));
  }
  if (issue.helpUrl) {
    lines.push("");
    lines.push(`[Learn more](${issue.helpUrl})`);
  }
  lines.push("");
  return lines.join("\n");
}

/** Render a full analysis report as a portable Markdown document. */
export function reportToMarkdown(report: AnalysisReport): string {
  const out: string[] = [];
  out.push(`# Accessibility report`);
  out.push("");
  out.push(`- **Generated:** ${new Date(report.createdAt).toLocaleString()}`);
  out.push(`- **Engine:** ${report.engine.name} v${report.engine.version} (${report.engine.rulesRun} rules, ${report.engine.durationMs} ms)`);
  out.push(`- **Input:** ${report.input.elements} elements, ${report.input.lines} lines (${report.input.isDocument ? "full document" : "fragment"})`);
  out.push("");
  out.push(`## Score: ${report.score.score}/100 (Grade ${report.score.grade})`);
  out.push("");
  out.push(`> ${report.score.label}`);
  out.push("");

  out.push("## Summary");
  out.push("");
  out.push("| Severity | Count |");
  out.push("| --- | --- |");
  out.push(`| Critical | ${report.summary.critical} |`);
  out.push(`| Serious | ${report.summary.serious} |`);
  out.push(`| Moderate | ${report.summary.moderate} |`);
  out.push(`| Minor | ${report.summary.minor} |`);
  out.push(`| **Total** | **${report.summary.total}** |`);
  out.push("");

  out.push(`## Narrative (${report.ai.enabled ? `AI · ${report.ai.model}` : "rule-based"})`);
  out.push("");
  out.push(report.ai.summary);
  out.push("");
  if (report.ai.priorities.length > 0) {
    out.push("### Recommended priorities");
    out.push("");
    report.ai.priorities.forEach((priority, index) => {
      out.push(`${index + 1}. **${priority.title}** — ${priority.why}`);
      out.push(`   - _How:_ ${priority.how}`);
    });
    out.push("");
  }
  if (report.ai.error) {
    out.push(`> ⚠️ AI enrichment was skipped: ${report.ai.error}`);
    out.push("");
  }

  if (report.wcag.length > 0) {
    out.push("## WCAG criteria involved");
    out.push("");
    for (const criterion of report.wcag) {
      out.push(`- **${criterion.id} ${criterion.title}** (Level ${criterion.level}) — [understanding](${criterion.url})`);
    }
    out.push("");
  }

  const severities: Severity[] = ["critical", "serious", "moderate", "minor"];
  for (const severity of severities) {
    const issues = report.issues.filter((issue) => issue.severity === severity);
    if (issues.length === 0) continue;
    out.push(`## ${SEVERITY_LABEL[severity]} issues (${issues.length})`);
    out.push("");
    issues.forEach((issue, index) => out.push(issueSection(issue, index + 1)));
  }

  if (report.issues.length === 0) {
    out.push("## No issues detected 🎉");
    out.push("");
    out.push(
      "Automated checks passed. Remember that automated tools catch only part of WCAG — test with a keyboard and a screen reader too.",
    );
    out.push("");
  }

  if (report.notices.length > 0) {
    out.push("## Notes & limitations");
    out.push("");
    report.notices.forEach((notice) => out.push(`- ${notice}`));
    out.push("");
  }

  if (report.passed.length > 0) {
    out.push("<details><summary>Checks that passed</summary>");
    out.push("");
    report.passed.forEach((title) => out.push(`- ${title}`));
    out.push("");
    out.push("</details>");
    out.push("");
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n");
}
