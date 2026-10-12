import {
  ABSTRACT_ROLES,
  ARIA_BOOLEAN_ATTRIBUTES,
  ARIA_TOKEN_VALUES,
  ARIA_TRISTATE_ATTRIBUTES,
  ROLES_PROHIBITING_NAME,
  VALID_ARIA_ATTRIBUTES,
  VALID_ROLES,
  WIDGET_ROLES_REQUIRING_NAME,
  implicitRole,
} from "../aria-data";
import {
  getAccessibleName,
  getRole,
  hasFocusableDescendant,
  idRefs,
  isFocusable,
  tagOf,
  type DocContext,
  type ParsedElement,
} from "../dom";
import { finding, type Rule, type RuleFinding } from "../types";

const REFERENCE_ATTRIBUTES = [
  "labelledby",
  "describedby",
  "controls",
  "owns",
  "activedescendant",
  "details",
  "errormessage",
  "flowto",
] as const;

const NUMERIC_ARIA = new Set([
  "valuenow",
  "valuemin",
  "valuemax",
  "colspan",
  "rowspan",
  "setsize",
  "posinset",
  "colcount",
  "rowcount",
  "colindex",
  "rowindex",
]);

const BOOLEAN_VALUES = new Set(["true", "false", "undefined"]);
const TRISTATE_VALUES = new Set(["true", "false", "mixed", "undefined"]);

const NATIVE_WIDGET_TAGS = new Set(["button", "a", "input", "select", "textarea"]);

function isKnownRole(role: string): boolean {
  return (
    VALID_ROLES.has(role) || ABSTRACT_ROLES.has(role) || role.startsWith("doc-")
  );
}

/** Rules that validate ARIA roles, states and properties. */
export const ariaRules: Rule[] = [
  {
    id: "aria-unknown-attribute",
    title: "Unknown aria-* attribute",
    description:
      "Only attributes defined in WAI-ARIA are recognised by assistive technology. Misspelled attributes are ignored.",
    category: "aria",
    severity: "moderate",
    wcag: ["4.1.2"],
    run: (ctx) => {
      const findings: RuleFinding[] = [];
      for (const el of ctx.elements) {
        for (const name of Object.keys(el.attributes)) {
          if (!name.startsWith("aria-")) continue;
          const rest = name.slice("aria-".length);
          if (VALID_ARIA_ATTRIBUTES.has(rest)) continue;
          findings.push(
            finding(`"${name}" is not a valid ARIA attribute.`, el, {
              suggestion:
                "Remove it or correct the spelling. Check the WAI-ARIA attribute list for the exact name.",
            }),
          );
        }
      }
      return findings;
    },
  },
  {
    id: "aria-empty-label",
    title: "Empty aria-label",
    description:
      "An empty aria-label does not name the element and may override a useful name from its content.",
    category: "aria",
    severity: "minor",
    wcag: ["4.1.2"],
    run: (ctx) =>
      ctx.elements
        .filter((el) => el.getAttribute("aria-label") !== undefined)
        .filter((el) => (el.getAttribute("aria-label") ?? "").trim() === "")
        .map((el) =>
          finding("aria-label is empty.", el, {
            suggestion:
              "Provide meaningful text or remove the attribute. Use aria-hidden for purely decorative elements.",
          }),
        ),
  },
  {
    id: "aria-unknown-role",
    title: "Unknown role",
    description:
      "The role attribute must contain a valid ARIA role; unknown values are ignored by browsers.",
    category: "aria",
    severity: "serious",
    wcag: ["4.1.2"],
    run: (ctx) => {
      const findings: RuleFinding[] = [];
      for (const el of ctx.elements) {
        const role = el.getAttribute("role");
        if (role === undefined || role.trim() === "") continue;
        for (const token of role.trim().toLowerCase().split(/\s+/)) {
          if (isKnownRole(token)) continue;
          findings.push(
            finding(`"${token}" is not a recognised ARIA role.`, el, {
              suggestion:
                'Use a valid role such as "button", "navigation" or "dialog", or remove the attribute.',
            }),
          );
        }
      }
      return findings;
    },
  },
  {
    id: "aria-abstract-role",
    title: "Abstract ARIA role used",
    description:
      "Abstract roles exist only to organise the ARIA specification and must never appear in markup.",
    category: "aria",
    severity: "serious",
    wcag: ["4.1.2"],
    run: (ctx) =>
      ctx.elements
        .filter((el) => {
          const role = (el.getAttribute("role") ?? "").trim().toLowerCase();
          return role !== "" && role.split(/\s+/).some((token) => ABSTRACT_ROLES.has(token));
        })
        .map((el) =>
          finding(`The role "${el.getAttribute("role")}" is abstract.`, el, {
            suggestion: "Replace it with a concrete role that reflects the widget's behaviour.",
          }),
        ),
  },
  {
    id: "aria-dangling-reference",
    title: "ARIA reference points to a missing element",
    description:
      "Attributes such as aria-labelledby and aria-describedby must reference ids that exist in the document.",
    category: "aria",
    severity: "moderate",
    wcag: ["1.3.1", "4.1.2"],
    run: (ctx) => {
      const findings: RuleFinding[] = [];
      for (const el of ctx.elements) {
        for (const attribute of REFERENCE_ATTRIBUTES) {
          const raw = el.getAttribute(`aria-${attribute}`);
          if (raw === undefined || raw.trim() === "") continue;
          const missing = idRefs(raw).filter((id) => !ctx.getById(id));
          if (missing.length === 0) continue;
          findings.push(
            finding(
              `aria-${attribute} references ${missing.map((id) => `"${id}"`).join(", ")} which ${missing.length === 1 ? "does" : "do"} not exist in this snippet.`,
              el,
              {
                severity: attribute === "labelledby" ? "serious" : "moderate",
                suggestion:
                  "Check the id spelling, or make sure the referenced element is inside the analysed markup.",
              },
            ),
          );
        }
      }
      return findings;
    },
  },
  {
    id: "aria-hidden-focusable",
    title: "Focusable content is hidden from assistive technology",
    description:
      'aria-hidden="true" removes content from the accessibility tree, so it must not contain focusable elements.',
    category: "aria",
    severity: "serious",
    wcag: ["1.3.1", "2.1.1", "4.1.2"],
    run: (ctx) => {
      const findings: RuleFinding[] = [];
      for (const el of ctx.elements) {
        if (el.getAttribute("aria-hidden") !== "true") continue;
        const tag = tagOf(el);
        if (tag === "html" || tag === "body") continue;
        const focusable = isFocusable(el) || hasFocusableDescendant(el);
        if (!focusable) continue;
        findings.push(
          finding("This element is aria-hidden but contains focusable content.", el, {
            suggestion:
              "Remove aria-hidden, or remove the element from the tab order and hide it visually instead.",
          }),
        );
      }
      return findings;
    },
  },
  {
    id: "aria-hidden-body",
    title: "Page or body is hidden from assistive technology",
    description:
      'Applying aria-hidden="true" to <body> or <html> hides the entire page from screen readers.',
    category: "aria",
    severity: "critical",
    wcag: ["1.3.1", "4.1.2"],
    run: (ctx) =>
      ctx.elements
        .filter((el) => ["html", "body"].includes(tagOf(el)))
        .filter((el) => el.getAttribute("aria-hidden") === "true")
        .map((el) =>
          finding(`<${tagOf(el)}> must never be aria-hidden.`, el, {
            suggestion: "Remove the attribute. Hide individual elements instead of the whole page.",
          }),
        ),
  },
  {
    id: "aria-presentation-conflict",
    title: "Presentation role conflicts with other semantics",
    description:
      'role="presentation" / "none" removes semantics, so it cannot be combined with a name or used on focusable elements.',
    category: "aria",
    severity: "moderate",
    wcag: ["4.1.2"],
    run: (ctx) => {
      const findings: RuleFinding[] = [];
      for (const el of ctx.elements) {
        const role = (el.getAttribute("role") ?? "").trim().toLowerCase();
        if (role !== "presentation" && role !== "none") continue;
        const hasName =
          (el.getAttribute("aria-label") ?? "").trim() !== "" ||
          (el.getAttribute("aria-labelledby") ?? "").trim() !== "";
        const focusable = isFocusable(el);
        if (!hasName && !focusable) continue;
        findings.push(
          finding(
            focusable
              ? `role="${role}" is used on a focusable element.`
              : `role="${role}" is combined with an ARIA label.`,
            el,
            {
              suggestion:
                "Either remove the role so semantics remain, or remove the name / focusability that conflicts with it.",
            },
          ),
        );
      }
      return findings;
    },
  },
  {
    id: "aria-redundant-role",
    title: "Redundant role on a semantic element",
    description:
      "Restating the implicit role of a native element adds noise without changing behaviour.",
    category: "aria",
    severity: "minor",
    wcag: [],
    run: (ctx) => {
      const findings: RuleFinding[] = [];
      for (const el of ctx.elements) {
        const explicit = el.getAttribute("role");
        if (explicit === undefined) continue;
        const role = explicit.trim().toLowerCase().split(/\s+/)[0];
        if (!role) continue;
        const implicit = implicitRole(tagOf(el), (name) => el.getAttribute(name));
        if (implicit === role) {
          findings.push(
            finding(`role="${role}" duplicates the element's implicit role.`, el, {
              suggestion: "Remove the redundant role attribute.",
            }),
          );
        }
      }
      return findings;
    },
  },
  {
    id: "aria-invalid-value",
    title: "ARIA attribute has an invalid value",
    description:
      "ARIA states and properties accept a fixed set of values. Invalid values are ignored by browsers.",
    category: "aria",
    severity: "moderate",
    wcag: ["4.1.2"],
    run: (ctx) => {
      const findings: RuleFinding[] = [];
      for (const el of ctx.elements) {
        for (const [name, value] of Object.entries(el.attributes)) {
          if (!name.startsWith("aria-")) continue;
          const rest = name.slice("aria-".length);
          const raw = value.trim().toLowerCase();
          if (raw === "") continue;
          let expected: string | null = null;
          if (ARIA_BOOLEAN_ATTRIBUTES.has(rest)) {
            if (!BOOLEAN_VALUES.has(raw)) expected = "true or false";
          } else if (ARIA_TRISTATE_ATTRIBUTES.has(rest)) {
            if (!TRISTATE_VALUES.has(raw)) expected = "true, false or mixed";
          } else if (ARIA_TOKEN_VALUES[rest]) {
            if (!ARIA_TOKEN_VALUES[rest].has(raw)) {
              expected = [...ARIA_TOKEN_VALUES[rest]].join(", ");
            }
          } else if (rest === "level") {
            const n = Number(raw);
            if (!(Number.isInteger(n) && n > 0)) expected = "a positive integer";
          } else if (NUMERIC_ARIA.has(rest)) {
            if (!Number.isFinite(Number(raw))) expected = "a number";
          }
          if (expected) {
            findings.push(
              finding(`aria-${rest}="${value}" should be ${expected}.`, el, {
                suggestion: `Set aria-${rest} to one of: ${expected}.`,
              }),
            );
          }
        }
      }
      return findings;
    },
  },
  {
    id: "aria-prohibited-name",
    title: "ARIA label on an element that cannot be named",
    description:
      "Naming is prohibited on generic and some structural roles, so aria-label has no effect there.",
    category: "aria",
    severity: "moderate",
    wcag: ["4.1.2"],
    run: (ctx) => {
      const findings: RuleFinding[] = [];
      for (const el of ctx.elements) {
        const hasName =
          (el.getAttribute("aria-label") ?? "").trim() !== "" ||
          (el.getAttribute("aria-labelledby") ?? "").trim() !== "";
        if (!hasName) continue;
        if (el.getAttribute("aria-hidden") === "true") continue;
        const role = getRole(el);
        if (role && !ROLES_PROHIBITING_NAME.has(role)) continue;
        findings.push(
          finding("This element cannot carry an accessible name as written.", el, {
            suggestion:
              'Give the element a role that supports naming (e.g. role="region", role="group", role="img") or label a real control instead.',
          }),
        );
      }
      return findings;
    },
  },
  {
    id: "interactive-role-missing-name",
    title: "Interactive widget has no accessible name",
    description:
      "Buttons, links, tabs and other composite widgets built with roles need an accessible name to be usable.",
    category: "aria",
    severity: "serious",
    wcag: ["4.1.2"],
    run: (ctx) => {
      const findings: RuleFinding[] = [];
      for (const el of ctx.elements) {
        const tag = tagOf(el);
        if (NATIVE_WIDGET_TAGS.has(tag)) continue;
        const role = getRole(el);
        if (!role || !WIDGET_ROLES_REQUIRING_NAME.has(role)) continue;
        if (el.getAttribute("aria-hidden") === "true") continue;
        if (getAccessibleName(ctx, el).length > 0) continue;
        findings.push(
          finding(`This element exposes role="${role}" but has no accessible name.`, el, {
            suggestion:
              'Add aria-label="…", aria-labelledby, or visible text inside the element.',
          }),
        );
      }
      return findings;
    },
  },
];

/** Exposed so the report can explain skipped checks. */
export function hasAnyAria(ctx: DocContext): boolean {
  return ctx.elements.some(
    (el: ParsedElement) =>
      el.getAttribute("role") !== undefined ||
      Object.keys(el.attributes).some((name) => name.startsWith("aria-")),
  );
}
