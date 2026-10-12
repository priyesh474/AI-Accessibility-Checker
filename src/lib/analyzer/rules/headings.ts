import { collectText, getRole, tagOf, type ParsedElement } from "../dom";
import { finding, type Rule, type RuleFinding } from "../types";

interface HeadingInfo {
  element: ParsedElement;
  level: number;
  explicitRole: boolean;
}

function collectHeadings(ctx: Parameters<Rule["run"]>[0]): HeadingInfo[] {
  const headings: HeadingInfo[] = [];
  for (const el of ctx.elements) {
    const tag = tagOf(el);
    if (/^h[1-6]$/.test(tag)) {
      headings.push({ element: el, level: Number(tag[1]), explicitRole: false });
      continue;
    }
    if (getRole(el) === "heading") {
      const level = Number.parseInt(el.getAttribute("aria-level") ?? "", 10);
      headings.push({
        element: el,
        level: Number.isFinite(level) && level > 0 ? level : 0,
        explicitRole: true,
      });
    }
  }
  return headings;
}

/** Rules about heading structure and outline. */
export const headingRules: Rule[] = [
  {
    id: "heading-empty",
    title: "Heading has no text",
    description:
      "An empty heading is announced as a heading with no name, which is confusing and breaks navigation.",
    category: "headings",
    severity: "moderate",
    wcag: ["1.3.1", "2.4.6"],
    run: (ctx) =>
      ctx.elements
        .filter((el) => /^h[1-6]$/.test(tagOf(el)) || getRole(el) === "heading")
        .filter((el) => collectText(el).trim() === "")
        .filter((el) => !(el.getAttribute("aria-label") ?? "").trim())
        .map((el) =>
          finding("This heading contains no text.", el, {
            suggestion:
              "Add text to the heading or remove the heading element if it is not needed.",
          }),
        ),
  },
  {
    id: "heading-h1-missing",
    title: "Page has no level-one heading",
    description:
      "A single <h1> gives the page a clear main topic and helps screen reader users orient themselves.",
    category: "headings",
    severity: "moderate",
    wcag: ["1.3.1", "2.4.6"],
    run: (ctx) => {
      const headings = collectHeadings(ctx);
      if (headings.length === 0) {
        return [
          finding("This document contains no headings.", undefined, {
            suggestion:
              "Add a descriptive <h1> and use headings to outline the page structure.",
          }),
        ];
      }
      if (headings.some((heading) => heading.level === 1)) return [];
      return [
        finding("No <h1> was found, so the page has no top-level heading.", headings[0].element, {
          suggestion:
            "Make the most important heading an <h1> and nest further headings beneath it.",
        }),
      ];
    },
  },
  {
    id: "heading-h1-multiple",
    title: "Multiple level-one headings",
    description:
      "More than one <h1> makes the document outline ambiguous for assistive technology.",
    category: "headings",
    severity: "minor",
    wcag: ["1.3.1"],
    run: (ctx) => {
      const h1s = collectHeadings(ctx).filter((heading) => heading.level === 1);
      if (h1s.length < 2) return [];
      return h1s.slice(1).map((heading) =>
        finding("This is an additional <h1>.", heading.element, {
          suggestion:
            "Keep a single <h1> for the page topic and use <h2>–<h6> for sections.",
        }),
      );
    },
  },
  {
    id: "heading-order-skip",
    title: "Heading levels are skipped",
    description:
      "Heading levels should increase one step at a time (h1 → h2 → h3) so the outline makes sense.",
    category: "headings",
    severity: "moderate",
    wcag: ["1.3.1", "2.4.6"],
    run: (ctx) => {
      const findings: RuleFinding[] = [];
      const headings = collectHeadings(ctx).filter((heading) => heading.level > 0);
      let previous = 0;
      for (const heading of headings) {
        if (previous > 0 && heading.level > previous + 1) {
          findings.push(
            finding(
              `Heading level jumps from h${previous} to h${heading.level}.`,
              heading.element,
              {
                suggestion: `Use an h${previous + 1} here, or restructure the headings so the outline does not skip a level.`,
              },
            ),
          );
        }
        previous = heading.level;
      }
      return findings;
    },
  },
  {
    id: "role-heading-level",
    title: "Heading role has no aria-level",
    description:
      'Elements with role="heading" must also set aria-level so the heading level is known.',
    category: "headings",
    severity: "moderate",
    wcag: ["1.3.1", "4.1.2"],
    run: (ctx) =>
      ctx.elements
        .filter((el) => el.getAttribute("role") === "heading")
        .filter((el) => el.getAttribute("aria-level") === undefined)
        .map((el) =>
          finding('This element has role="heading" but no aria-level.', el, {
            suggestion:
              'Add aria-level="2" (or the correct level) alongside role="heading".',
            codeExample: {
              before: '<div role="heading">Pricing</div>',
              after: '<div role="heading" aria-level="2">Pricing</div>',
            },
          }),
        ),
  },
];
