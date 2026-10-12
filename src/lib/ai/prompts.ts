import type { AnalysisReport } from "@/types/analysis";
import type { ChatMessage } from "./provider";

const SYSTEM_PROMPT = `You are a senior web accessibility (WCAG 2.2) specialist reviewing an automated report.

The report comes from a deterministic static analysis engine. You must:
- Explain the findings in clear, non-jargon language for a product team.
- Prioritise fixes by real-world impact on screen reader, keyboard and low-vision users.
- Reference the WCAG success criteria already provided; do not invent criteria or issues.
- Only discuss problems that appear in the report. Do not claim to have tested anything else.
- Be concise and specific. Prefer concrete, actionable steps.

Respond with a single JSON object and nothing else, using exactly this shape:
{
  "summary": "2-4 sentences summarising the overall state and the most important risk.",
  "priorities": [
    {
      "title": "Short imperative title, e.g. 'Label every form control'",
      "why": "1-2 sentences on the impact and the related WCAG criteria.",
      "how": "1-3 sentences describing the concrete code or design change.",
      "ruleIds": ["matching-engine-rule-id"]
    }
  ]
}

Return at most 5 priorities, ordered from most to least impactful.`;

interface PromptInput {
  score: number;
  grade: string;
  summary: string;
  issues: {
    rule: string;
    severity: string;
    category: string;
    wcag: string[];
    message: string;
    suggestion: string;
    snippet: string;
    selector: string;
  }[];
  notices: string[];
  passedChecks: string[];
}

/** Build the chat messages sent to the model for a given report. */
export function buildMessages(report: AnalysisReport, maxIssues = 25): ChatMessage[] {
  const payload: PromptInput = {
    score: report.score.score,
    grade: report.score.grade,
    summary: `${report.summary.critical} critical, ${report.summary.serious} serious, ${report.summary.moderate} moderate, ${report.summary.minor} minor issues across ${report.input.elements} elements.`,
    issues: report.issues.slice(0, maxIssues).map((issue) => ({
      rule: issue.ruleId,
      severity: issue.severity,
      category: issue.category,
      wcag: issue.wcag.map((criterion) => `${criterion.id} ${criterion.title} (Level ${criterion.level})`),
      message: issue.message,
      suggestion: issue.suggestion,
      snippet: issue.snippet.replace(/\s+/g, " ").slice(0, 160),
      selector: issue.selector,
    })),
    notices: report.notices,
    passedChecks: report.passed,
  };

  return [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Here is the accessibility report as JSON:\n${JSON.stringify(payload)}`,
    },
  ];
}
