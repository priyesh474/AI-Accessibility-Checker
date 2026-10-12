import { LANDMARK_ROLES } from "../aria-data";
import {
  getAccessibleName,
  getRole,
  tagOf,
  type DocContext,
  type ParsedElement,
} from "../dom";
import { finding, type Rule, type RuleFinding } from "../types";

const UNIQUE_LANDMARK_ROLES = new Set([
  "navigation",
  "complementary",
  "form",
  "region",
  "search",
  "banner",
  "contentinfo",
]);

function ancestors(element: ParsedElement): ParsedElement[] {
  const out: ParsedElement[] = [];
  let node = element.parentNode;
  while (node && node.rawTagName) {
    out.push(node);
    node = node.parentNode;
  }
  return out;
}

function findLandmarks(ctx: DocContext, role: string): ParsedElement[] {
  return ctx.elements.filter((el) => getRole(el) === role);
}

/** Rules about landmarks, lists and overall page structure. */
export const structureRules: Rule[] = [
  {
    id: "landmark-main-missing",
    title: "Page has no main landmark",
    description:
      "A <main> (or role=main) lets screen reader users jump straight to the primary content (WCAG 2.4.1).",
    category: "structure",
    severity: "moderate",
    wcag: ["1.3.1", "2.4.1"],
    applies: (ctx) => ctx.isDocument,
    run: (ctx) => {
      const mains = findLandmarks(ctx, "main");
      if (mains.length > 0) return [];
      return [
        finding("No <main> element or role=\"main\" was found.", undefined, {
          suggestion:
            "Wrap the primary page content in a single <main> element so users can bypass repeated navigation.",
          codeExample: {
            before: "<body>\n  <header>…</header>\n  <div class=\"content\">…</div>\n</body>",
            after:
              "<body>\n  <header>…</header>\n  <main>…</main>\n  <footer>…</footer>\n</body>",
          },
        }),
      ];
    },
  },
  {
    id: "landmark-main-multiple",
    title: "Multiple main landmarks",
    description:
      "A page should expose exactly one main landmark; only one may be visible at a time.",
    category: "structure",
    severity: "moderate",
    wcag: ["1.3.1"],
    run: (ctx) => {
      const mains = findLandmarks(ctx, "main");
      if (mains.length < 2) return [];
      return mains.slice(1).map((el) =>
        finding("This is an additional main landmark.", el, {
          suggestion:
            "Keep a single <main>. If several views exist, hide the inactive ones with the hidden attribute.",
        }),
      );
    },
  },
  {
    id: "landmark-unique-name",
    title: "Repeated landmarks are not uniquely labelled",
    description:
      "When a page has more than one of the same landmark, each needs a distinct accessible name.",
    category: "structure",
    severity: "moderate",
    wcag: ["1.3.1", "2.4.1"],
    run: (ctx) => {
      const findings: RuleFinding[] = [];
      for (const role of LANDMARK_ROLES) {
        if (!UNIQUE_LANDMARK_ROLES.has(role)) continue;
        const elements = findLandmarks(ctx, role);
        if (elements.length < 2) continue;
        for (const el of elements) {
          if (getAccessibleName(ctx, el).length > 0) continue;
          findings.push(
            finding(`This ${role} landmark has no accessible name.`, el, {
              suggestion: `Add a distinguishing aria-label, e.g. aria-label="${role === "navigation" ? "Primary" : "…"}".`,
            }),
          );
        }
      }
      return findings;
    },
  },
  {
    id: "list-invalid-children",
    title: "List contains elements that are not list items",
    description:
      "<ul> and <ol> should contain only <li> children (script/template are also allowed) so the list is announced correctly.",
    category: "structure",
    severity: "moderate",
    wcag: ["1.3.1"],
    run: (ctx) => {
      const findings: RuleFinding[] = [];
      for (const el of ctx.elements) {
        const tag = tagOf(el);
        if (tag !== "ul" && tag !== "ol") continue;
        const role = el.getAttribute("role");
        if (role === "presentation" || role === "none") continue;
        const invalid = el.children.filter((child) => {
          const childTag = tagOf(child);
          if (childTag === "li" || childTag === "template" || childTag === "script") {
            return false;
          }
          return getRole(child) !== "listitem";
        });
        if (invalid.length === 0) continue;
        const tags = [...new Set(invalid.map((child) => tagOf(child)))].join(", ");
        findings.push(
          finding(`This list has non-<li> children (<${tags}>).`, el, {
            suggestion:
              "Only <li> elements (or role=\"listitem\") may be direct children of a list. Move content inside the <li>.",
          }),
        );
      }
      return findings;
    },
  },
  {
    id: "listitem-outside-list",
    title: "<li> is not inside a list",
    description:
      "A list item must be owned by a <ul>, <ol> or <menu>; otherwise its meaning is lost.",
    category: "structure",
    severity: "minor",
    wcag: ["1.3.1"],
    run: (ctx) =>
      ctx.elements
        .filter((el) => tagOf(el) === "li")
        .filter((el) => {
          if (getRole(el) !== "listitem") return false;
          const hasListAncestor = ancestors(el).some((parent) =>
            ["ul", "ol", "menu"].includes(tagOf(parent)),
          );
          return !hasListAncestor;
        })
        .map((el) =>
          finding("This <li> is not contained in a list.", el, {
            suggestion: "Place the item inside a <ul>, <ol> or <menu> element.",
          }),
        ),
  },
];
