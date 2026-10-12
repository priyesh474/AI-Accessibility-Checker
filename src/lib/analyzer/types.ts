import type { CodeExample, IssueCategory, Severity } from "@/types/analysis";
import type { DocContext, ParsedElement } from "./dom";

/** A single problem reported by a rule run. */
export interface RuleFinding {
  message: string;
  element?: ParsedElement;
  /** Overrides the rule's default severity for this finding. */
  severity?: Severity;
  selector?: string;
  snippet?: string;
  suggestion?: string;
  codeExample?: CodeExample;
  /** Overrides the rule's default documentation link for this finding. */
  helpUrl?: string;
}

/** A rule is a pure function from a parsed document to zero or more findings. */
export interface Rule {
  /** Stable machine id, e.g. `img-alt-missing`. */
  id: string;
  title: string;
  /** One line describing what the rule checks, shown in the report. */
  description: string;
  category: IssueCategory;
  severity: Severity;
  /** WCAG success criterion ids, e.g. `["1.1.1"]`. */
  wcag: string[];
  /** Optional link overriding the default (first WCAG criterion) link. */
  helpUrl?: string;
  /** Return false to skip the rule entirely (e.g. document rules on fragments). */
  applies?: (ctx: DocContext) => boolean;
  run: (ctx: DocContext) => RuleFinding[];
}

/** Convenience wrapper so rule modules can build findings tersely. */
export function finding(
  message: string,
  element?: ParsedElement,
  extra: Partial<Omit<RuleFinding, "message" | "element">> = {},
): RuleFinding {
  return { message, element, ...extra };
}
