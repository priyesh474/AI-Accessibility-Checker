import type {
  CategorySummary,
  Issue,
  IssueCategory,
  ScoreGrade,
  ScoreResult,
  Severity,
  SeveritySummary,
  WcagCriterion,
} from "@/types/analysis";

/** How many "points" each issue removes from a perfect score. */
export const SEVERITY_WEIGHTS: Record<Severity, number> = {
  critical: 10,
  serious: 5,
  moderate: 2,
  minor: 1,
};

export const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  serious: 1,
  moderate: 2,
  minor: 3,
};

export const CATEGORY_LABELS: Record<IssueCategory, string> = {
  document: "Document",
  images: "Images",
  forms: "Forms",
  headings: "Headings",
  aria: "ARIA",
  keyboard: "Keyboard",
  links: "Links",
  structure: "Structure",
  tables: "Tables",
  media: "Media",
  contrast: "Contrast",
};

export function severitySummary(issues: Issue[]): SeveritySummary {
  const summary: SeveritySummary = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
    total: issues.length,
  };
  for (const issue of issues) summary[issue.severity] += 1;
  return summary;
}

export function categorySummary(issues: Issue[]): CategorySummary[] {
  const map = new Map<IssueCategory, CategorySummary>();
  for (const issue of issues) {
    const entry = map.get(issue.category) ?? {
      category: issue.category,
      label: CATEGORY_LABELS[issue.category],
      count: 0,
      critical: 0,
    };
    entry.count += 1;
    if (issue.severity === "critical") entry.critical += 1;
    map.set(issue.category, entry);
  }
  return [...map.values()].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.label.localeCompare(b.label);
  });
}

/**
 * Convert issues into a 0–100 score.
 *
 * Raw severity weight is normalised by the square root of the element count so
 * that a large page is not punished for simply having more markup, while a
 * small snippet with a critical issue still scores low. The exponential curve
 * keeps the score smooth and bounded.
 */
export function computeScore(issues: Issue[], elementCount: number): ScoreResult {
  if (issues.length === 0) {
    return { score: 100, grade: "A", label: "No issues detected" };
  }

  const penalty = issues.reduce(
    (total, issue) => total + SEVERITY_WEIGHTS[issue.severity],
    0,
  );
  const normalised = penalty / Math.sqrt(Math.max(1, elementCount));
  const score = Math.max(0, Math.min(100, Math.round(100 * Math.exp(-normalised / 18))));

  return { score, ...gradeFor(score) };
}

function gradeFor(score: number): { grade: ScoreGrade; label: string } {
  if (score >= 90) return { grade: "A", label: "Excellent — minor polish only" };
  if (score >= 80) return { grade: "B", label: "Good — a few fixes recommended" };
  if (score >= 70) return { grade: "C", label: "Fair — several barriers to fix" };
  if (score >= 55) return { grade: "D", label: "Poor — significant accessibility gaps" };
  return { grade: "F", label: "Critical — major barriers for assistive technology" };
}

/** Unique WCAG criteria across all issues, sorted by criterion number. */
export function uniqueWcag(issues: Issue[]): WcagCriterion[] {
  const map = new Map<string, WcagCriterion>();
  for (const issue of issues) {
    for (const criterion of issue.wcag) map.set(criterion.id, criterion);
  }
  return [...map.values()].sort((a, b) =>
    a.id.localeCompare(b.id, undefined, { numeric: true }),
  );
}
