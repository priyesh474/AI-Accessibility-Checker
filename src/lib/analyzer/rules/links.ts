import { getAccessibleName, getRole, tagOf } from "../dom";
import { finding, type Rule, type RuleFinding } from "../types";

const AMBIGUOUS_TEXT = new Set([
  "click here",
  "here",
  "click",
  "read more",
  "more",
  "learn more",
  "link",
  "this",
  "this link",
  "info",
  "information",
  "details",
  "continue",
  "full story",
  "download",
  "go",
  "see more",
  "view",
]);

const PLACEHOLDER_HREFS = new Set(["#", "", "javascript:void(0)", "javascript:;", "javascript:void(0);"]);

/** Rules about link purpose and naming (WCAG 2.4.4). */
export const linkRules: Rule[] = [
  {
    id: "link-empty",
    title: "Link has no accessible name",
    description:
      "Every link needs discernible text so users know where it goes before activating it.",
    category: "links",
    severity: "serious",
    wcag: ["2.4.4", "4.1.2"],
    run: (ctx) => {
      const findings: RuleFinding[] = [];
      for (const el of ctx.elements) {
        if (getRole(el) !== "link") continue;
        if (el.getAttribute("aria-hidden") === "true") continue;
        if (getAccessibleName(ctx, el).length > 0) continue;
        findings.push(
          finding("This link has no accessible name.", el, {
            suggestion:
              'Add visible link text, or an accessible name via aria-label. Icon links need text or alt text on the image.',
            codeExample: {
              before:
                '<a href="/cart"><svg aria-hidden="true">…</svg></a>',
              after:
                '<a href="/cart"><svg aria-hidden="true">…</svg><span class="sr-only">Cart</span></a>',
            },
          }),
        );
      }
      return findings;
    },
  },
  {
    id: "link-ambiguous-text",
    title: "Link text is not descriptive",
    description:
      'Text like "click here" or "read more" is meaningless when links are listed out of context.',
    category: "links",
    severity: "moderate",
    wcag: ["2.4.4"],
    run: (ctx) => {
      const findings: RuleFinding[] = [];
      for (const el of ctx.elements) {
        if (getRole(el) !== "link") continue;
        const name = getAccessibleName(ctx, el).toLowerCase();
        if (!AMBIGUOUS_TEXT.has(name)) continue;
        findings.push(
          finding(`The link text "${name}" does not describe the destination.`, el, {
            suggestion:
              'Describe the destination, e.g. "View the 2024 annual report", or add an aria-label with the full context.',
          }),
        );
      }
      return findings;
    },
  },
  {
    id: "link-placeholder-href",
    title: "Link uses a placeholder href",
    description:
      'href="#" or javascript: URLs are not real destinations and behave inconsistently for assistive technology.',
    category: "links",
    severity: "moderate",
    wcag: ["4.1.2"],
    run: (ctx) => {
      const findings: RuleFinding[] = [];
      for (const el of ctx.elements) {
        if (tagOf(el) !== "a") continue;
        const href = el.getAttribute("href");
        if (href === undefined) continue;
        if (!PLACEHOLDER_HREFS.has(href.trim())) continue;
        findings.push(
          finding(`The link uses href="${href}".`, el, {
            suggestion:
              "Use a real URL, or replace the link with a <button> if it triggers an action.",
          }),
        );
      }
      return findings;
    },
  },
  {
    id: "link-target-blank",
    title: "Link opens in a new tab without rel=noopener",
    description:
      "target=\"_blank\" without rel=\"noopener\" exposes the page to reverse tabnabbing and can disorient users.",
    category: "links",
    severity: "minor",
    wcag: ["3.2.5"],
    run: (ctx) => {
      const findings: RuleFinding[] = [];
      for (const el of ctx.elements) {
        if (tagOf(el) !== "a") continue;
        if ((el.getAttribute("target") ?? "") !== "_blank") continue;
        const rel = (el.getAttribute("rel") ?? "").toLowerCase();
        if (rel.includes("noopener")) continue;
        findings.push(
          finding("This link opens a new tab without rel=\"noopener\".", el, {
            suggestion:
              'Add rel="noopener noreferrer" and consider signalling the new window in the link text.',
            codeExample: {
              before: '<a href="https://x.test" target="_blank">Report</a>',
              after:
                '<a href="https://x.test" target="_blank" rel="noopener noreferrer">Report (opens in a new tab)</a>',
            },
          }),
        );
      }
      return findings;
    },
  },
];
