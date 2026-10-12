import type {
  AnalysisReport,
  CategorySummary,
  Issue,
  SeveritySummary,
} from "@/types/analysis";
import {
  buildDocContext,
  getSelector,
  getSnippet,
  offsetToLineColumn,
  truncate,
  type DocContext,
  type ParsedElement,
} from "./dom";
import { RULES } from "./rules";
import { categorySummary, computeScore, severitySummary, uniqueWcag } from "./scoring";
import { buildHeuristicInsights } from "./summary";
import type { Rule, RuleFinding } from "./types";
import { wcag } from "./wcag";

export const ENGINE_NAME = "a11y-check-engine";
export const ENGINE_VERSION = "1.0.0";

function makeId(): string {
  const globalCrypto = globalThis.crypto;
  if (globalCrypto && typeof globalCrypto.randomUUID === "function") {
    return globalCrypto.randomUUID();
  }
  return `rep_${Date.now().toString(16)}_${Math.random().toString(16).slice(2, 10)}`;
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

function toIssue(
  rule: Rule,
  f: RuleFinding,
  ctx: DocContext,
  ordinal: number,
): Issue {
  const element = f.element;
  const criteria = wcag(...rule.wcag);
  const selector = f.selector ?? (element ? getSelector(element) : ":root");

  let location: Issue["location"] = null;
  if (element && element.range && element.range[1] > element.range[0]) {
    const offset = element.range[0];
    if (offset >= 0 && offset <= ctx.source.length) {
      const { line, column } = offsetToLineColumn(ctx, offset);
      location = { line, column, offset };
    }
  }

  const snippet = f.snippet ?? (element ? getSnippet(ctx, element) : "");

  return {
    id: `${rule.id}::${ordinal}`,
    ruleId: rule.id,
    title: rule.title,
    message: f.message,
    severity: f.severity ?? rule.severity,
    category: rule.category,
    wcag: criteria,
    selector,
    location,
    snippet,
    suggestion: f.suggestion ?? rule.description,
    codeExample: f.codeExample,
    helpUrl: f.helpUrl ?? rule.helpUrl ?? criteria[0]?.url,
    element: element ? element.rawTagName.toLowerCase() : undefined,
  };
}

function dedupe(issues: Issue[]): Issue[] {
  const seen = new Set<string>();
  const out: Issue[] = [];
  for (const issue of issues) {
    const key = `${issue.ruleId}|${issue.selector}|${issue.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(issue);
  }
  return out;
}

function sortIssues(issues: Issue[]): Issue[] {
  const rank: Record<Issue["severity"], number> = {
    critical: 0,
    serious: 1,
    moderate: 2,
    minor: 3,
  };
  return [...issues].sort((a, b) => {
    if (rank[a.severity] !== rank[b.severity]) return rank[a.severity] - rank[b.severity];
    const lineA = a.location?.line ?? Number.MAX_SAFE_INTEGER;
    const lineB = b.location?.line ?? Number.MAX_SAFE_INTEGER;
    if (lineA !== lineB) return lineA - lineB;
    return a.ruleId.localeCompare(b.ruleId);
  });
}

/**
 * Run every rule against an HTML snippet and assemble a full report.
 *
 * The function is synchronous and deterministic so it can be unit tested and
 * reused on the client or the server. AI enrichment happens separately.
 */
export function analyzeHtml(html: string): AnalysisReport {
  const started = Date.now();
  const ctx = buildDocContext(html);

  const rawIssues: Issue[] = [];
  const passed: string[] = [];
  const skipped: AnalysisReport["skipped"] = [];
  const notices: string[] = [];
  let rulesRun = 0;
  let ordinal = 0;

  if (!ctx.isDocument) {
    notices.push(
      "Input looks like an HTML fragment rather than a full document, so page-level checks (lang, title, main landmark) were skipped.",
    );
  }

  const referencesIds = ctx.elements.some((el: ParsedElement) =>
    ["aria-labelledby", "aria-describedby", "aria-controls", "headers"].some(
      (name) => (el.getAttribute(name) ?? "").trim() !== "",
    ),
  );
  if (referencesIds) {
    notices.push(
      "ARIA and table references are resolved within the pasted snippet only; ids defined elsewhere may be reported as missing.",
    );
  }

  for (const rule of RULES) {
    if (rule.applies && !rule.applies(ctx)) {
      skipped.push({
        ruleId: rule.id,
        title: rule.title,
        reason: "Requires a full HTML document.",
      });
      continue;
    }
    rulesRun += 1;
    let findings: RuleFinding[] = [];
    try {
      findings = rule.run(ctx);
    } catch (error) {
      notices.push(
        `Rule "${rule.id}" could not finish: ${error instanceof Error ? error.message : "unknown error"}.`,
      );
      continue;
    }
    if (findings.length === 0) {
      passed.push(rule.title);
      continue;
    }
    for (const f of findings) {
      rawIssues.push(toIssue(rule, f, ctx, ordinal));
      ordinal += 1;
    }
  }

  const issues = sortIssues(dedupe(rawIssues));

  const summary: SeveritySummary = severitySummary(issues);
  const score = computeScore(issues, ctx.elements.length);
  const categories: CategorySummary[] = categorySummary(issues);
  const criteria = uniqueWcag(issues);
  const input = {
    bytes: byteLength(html),
    lines: html.split("\n").length,
    elements: ctx.elements.length,
    isDocument: ctx.isDocument,
  };

  const report: AnalysisReport = {
    id: makeId(),
    createdAt: new Date().toISOString(),
    input,
    score,
    summary,
    categories,
    issues,
    passed,
    notices,
    skipped,
    wcag: criteria,
    ai: buildHeuristicInsights({ issues, summary, score }),
    engine: {
      name: ENGINE_NAME,
      version: ENGINE_VERSION,
      rulesRun,
      durationMs: Date.now() - started,
    },
  };

  return report;
}

/** Exposed for tests and the report exporter. */
export { truncate };
