/**
 * Shared, serialisable domain types for the AI Accessibility Checker.
 *
 * These types form the contract between the analysis engine (`src/lib/analyzer`),
 * the optional AI enrichment layer (`src/lib/ai`) and the UI (`src/components`).
 */

/** How badly an issue affects real users. Mirrors common linter severities. */
export type Severity = "critical" | "serious" | "moderate" | "minor";

/** Grouping used for filtering and reporting. */
export type IssueCategory =
  | "document"
  | "images"
  | "forms"
  | "headings"
  | "aria"
  | "keyboard"
  | "links"
  | "structure"
  | "tables"
  | "media"
  | "contrast";

export type WcagLevel = "A" | "AA" | "AAA";

export type WcagPrinciple =
  | "Perceivable"
  | "Operable"
  | "Understandable"
  | "Robust";

/** A single WCAG success criterion, e.g. 1.1.1 Non-text Content. */
export interface WcagCriterion {
  /** Success criterion number, e.g. `"1.1.1"`. */
  id: string;
  title: string;
  level: WcagLevel;
  principle: WcagPrinciple;
  /** Deep link to the W3C "Understanding" page. */
  url: string;
}

/** Where an issue was found inside the analysed source. */
export interface IssueLocation {
  /** 1-based line number. */
  line: number;
  /** 1-based column number. */
  column: number;
  /** Absolute character offset in the source. */
  offset: number;
}

/** A minimal before/after code sample that demonstrates the fix. */
export interface CodeExample {
  before: string;
  after: string;
}

/** One concrete accessibility problem found in the snippet. */
export interface Issue {
  /** Stable id for React keys / dedupe, e.g. `img-alt-missing:12`. */
  id: string;
  /** Id of the rule that produced this issue. */
  ruleId: string;
  /** Short human readable title, e.g. "Image is missing alternative text". */
  title: string;
  /** Longer explanation of the problem. */
  message: string;
  severity: Severity;
  category: IssueCategory;
  /** WCAG criteria this issue relates to. */
  wcag: WcagCriterion[];
  /** CSS selector that approximately targets the offending element. */
  selector: string;
  /** Position in the source, when available. */
  location: IssueLocation | null;
  /** Raw HTML of the offending element (trimmed). */
  snippet: string;
  /** Plain-language remediation advice. */
  suggestion: string;
  /** Optional before/after code sample. */
  codeExample?: CodeExample;
  /** Documentation link for the rule. */
  helpUrl?: string;
  /** Tag name of the offending element, when applicable. */
  element?: string;
}

export interface SeveritySummary {
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  total: number;
}

export interface CategorySummary {
  category: IssueCategory;
  label: string;
  count: number;
  critical: number;
}

export type ScoreGrade = "A" | "B" | "C" | "D" | "F";

export interface ScoreResult {
  /** 0 (very broken) to 100 (no issues found). */
  score: number;
  grade: ScoreGrade;
  /** Human label such as "Needs significant work". */
  label: string;
}

/** A prioritised, plain-language recommendation produced by the AI layer. */
export interface AiPriority {
  title: string;
  why: string;
  how: string;
  /** Optional rule ids this priority relates to. */
  ruleIds?: string[];
}

export type AiProviderKind = "openai-compatible" | "heuristic";

export interface AiInsights {
  /** Whether a live model produced the text. */
  enabled: boolean;
  provider: AiProviderKind;
  /** Model name when a model was used. */
  model?: string;
  /** Executive summary in plain language. */
  summary: string;
  /** Ordered list of the most impactful fixes. */
  priorities: AiPriority[];
  /** Populated when an AI call was attempted but failed. */
  error?: string;
}

export interface AnalysisInputInfo {
  bytes: number;
  lines: number;
  elements: number;
  /** True when the snippet contained an `<html>` element (a full document). */
  isDocument: boolean;
}

/** The full report returned by `POST /api/analyze` and rendered by the UI. */
export interface AnalysisReport {
  id: string;
  createdAt: string;
  input: AnalysisInputInfo;
  score: ScoreResult;
  summary: SeveritySummary;
  categories: CategorySummary[];
  issues: Issue[];
  /** Titles of rules that ran and found nothing. */
  passed: string[];
  /** Contextual notes, e.g. checks skipped for fragments. */
  notices: string[];
  /** Rules that were skipped entirely, with a reason. */
  skipped: { ruleId: string; title: string; reason: string }[];
  /** Unique WCAG criteria violated, sorted. */
  wcag: WcagCriterion[];
  ai: AiInsights;
  /** Metadata about the engine that produced the report. */
  engine: {
    name: string;
    version: string;
    rulesRun: number;
    durationMs: number;
  };
}

/** Request body accepted by `POST /api/analyze`. */
export interface AnalyzeRequest {
  html: string;
  options?: {
    /** Allow disabling the live model even when configured. */
    useAi?: boolean;
  };
}

/** Error payload returned by `POST /api/analyze`. */
export interface AnalyzeError {
  error: string;
  details?: string;
}
