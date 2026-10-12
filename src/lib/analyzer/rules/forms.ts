import {
  collectText,
  getAccessibleName,
  hasAttr,
  tagOf,
  type ParsedElement,
} from "../dom";
import { finding, type Rule, type RuleFinding } from "../types";

const NON_LABELABLE_INPUT_TYPES = new Set([
  "hidden",
  "button",
  "submit",
  "reset",
  "image",
]);

const LABELABLE_TAGS = new Set([
  "button",
  "input",
  "meter",
  "output",
  "progress",
  "select",
  "textarea",
]);

const PERSONAL_DATA_HINT =
  /(first|last|full|given|family)[-_ ]?name|e-?mail|phone|mobile|tel|address|street|city|town|state|province|country|postal|zip|postcode|username|password|birth|birthday|dob|cc-|card|expir|cvv|organization|company|job|title/i;

function inputType(element: ParsedElement): string {
  return (element.getAttribute("type") ?? "text").toLowerCase();
}

function isLabelableControl(element: ParsedElement): boolean {
  const tag = tagOf(element);
  if (tag === "input") return !NON_LABELABLE_INPUT_TYPES.has(inputType(element));
  return tag === "select" || tag === "textarea" || tag === "meter" || tag === "progress";
}

function hasLabelableDescendant(element: ParsedElement): boolean {
  for (const el of [element, ...element.querySelectorAll("*")]) {
    if (el !== element && LABELABLE_TAGS.has(tagOf(el))) return true;
  }
  return false;
}

/** Rules about labelling and naming form controls. */
export const formRules: Rule[] = [
  {
    id: "label-missing",
    title: "Form control has no label",
    description:
      "Every form control needs a programmatically associated label so screen reader users know what to enter.",
    category: "forms",
    severity: "critical",
    wcag: ["1.3.1", "3.3.2", "4.1.2"],
    run: (ctx) => {
      const findings: RuleFinding[] = [];
      for (const el of ctx.elements) {
        if (!isLabelableControl(el)) continue;
        if (el.getAttribute("aria-hidden") === "true") continue;
        if (getAccessibleName(ctx, el).length > 0) continue;
        const placeholder = el.getAttribute("placeholder");
        findings.push(
          finding(
            placeholder
              ? "This control relies on a placeholder instead of a label."
              : "This form control has no accessible name.",
            el,
            {
              suggestion:
                "Associate a <label for> with the control, or add aria-label / aria-labelledby. Placeholders and title attributes are not visible labels.",
              codeExample: {
                before: '<input type="email" name="email" placeholder="Email">',
                after:
                  '<label for="email">Email address</label>\n<input id="email" type="email" name="email" autocomplete="email">',
              },
            },
          ),
        );
      }
      return findings;
    },
  },
  {
    id: "label-for-invalid",
    title: "Label points to an element that does not exist",
    description:
      "A <label for> must reference the id of a form control, otherwise the association is broken.",
    category: "forms",
    severity: "moderate",
    wcag: ["1.3.1"],
    run: (ctx) => {
      const findings: RuleFinding[] = [];
      for (const label of ctx.labels) {
        const target = label.getAttribute("for");
        if (target === undefined || target.trim() === "") continue;
        if (ctx.getById(target)) continue;
        findings.push(
          finding(`The label points to id "${target}" which does not exist.`, label, {
            suggestion:
              "Correct the for attribute or add a matching id to the form control.",
          }),
        );
      }
      return findings;
    },
  },
  {
    id: "label-empty",
    title: "Label has no text",
    description:
      "A visible label with no text leaves the control unlabelled for everyone.",
    category: "forms",
    severity: "minor",
    wcag: ["1.3.1", "3.3.2"],
    run: (ctx) =>
      ctx.labels
        .filter((label) => collectText(label).trim() === "")
        .filter((label) => !(label.getAttribute("aria-label") ?? "").trim())
        .map((label) =>
          finding("This <label> contains no text.", label, {
            suggestion:
              "Add descriptive text inside the label, or remove it and use another labelling technique.",
          }),
        ),
  },
  {
    id: "label-not-associated",
    title: "Label is not associated with a control",
    description:
      "A <label> needs either a for attribute or a labelable element inside it, otherwise clicking and screen reader labelling will not work.",
    category: "forms",
    severity: "moderate",
    wcag: ["1.3.1", "3.3.2"],
    run: (ctx) =>
      ctx.labels
        .filter((label) => !hasAttr(label, "for"))
        .filter((label) => !hasLabelableDescendant(label))
        .map((label) =>
          finding("This <label> is not linked to any form control.", label, {
            suggestion:
              "Add a for attribute that matches the control's id, or wrap the control inside the label.",
          }),
        ),
  },
  {
    id: "button-name-missing",
    title: "Button has no accessible name",
    description:
      "Buttons need discernible text (visible label, sr-only text, aria-label or aria-labelledby).",
    category: "forms",
    severity: "critical",
    wcag: ["4.1.2"],
    run: (ctx) => {
      const findings: RuleFinding[] = [];
      for (const el of ctx.elements) {
        const tag = tagOf(el);
        const role = el.getAttribute("role");
        const isButton = tag === "button" || role === "button";
        if (!isButton) continue;
        if (el.getAttribute("aria-hidden") === "true") continue;
        if (getAccessibleName(ctx, el).length > 0) continue;
        findings.push(
          finding("This button has no accessible name.", el, {
            suggestion:
              'Add visible text, or visually hidden text, or aria-label="…" for icon-only buttons.',
            codeExample: {
              before: '<button><svg aria-hidden="true">…</svg></button>',
              after:
                '<button aria-label="Close dialog"><svg aria-hidden="true">…</svg></button>',
            },
          }),
        );
      }
      return findings;
    },
  },
  {
    id: "button-type-missing",
    title: "Button has no explicit type",
    description:
      'A <button> without a type defaults to type="submit", which can trigger unexpected form submissions.',
    category: "forms",
    severity: "minor",
    wcag: [],
    run: (ctx) =>
      ctx.elements
        .filter((el) => tagOf(el) === "button")
        .filter((el) => !hasAttr(el, "type"))
        .map((el) =>
          finding('This <button> has no type and will default to "submit".', el, {
            suggestion: 'Add type="button" unless the button is meant to submit a form.',
            codeExample: {
              before: "<button>Close</button>",
              after: '<button type="button">Close</button>',
            },
          }),
        ),
  },
  {
    id: "radio-group-fieldset",
    title: "Group of radio buttons has no group label",
    description:
      "Related radio buttons should be wrapped in <fieldset> with a <legend>, or given role=radiogroup with a name, so the group is announced.",
    category: "forms",
    severity: "moderate",
    wcag: ["1.3.1"],
    run: (ctx) => {
      const findings: RuleFinding[] = [];
      const groups = new Map<string, ParsedElement[]>();
      for (const el of ctx.elements) {
        if (tagOf(el) !== "input") continue;
        if (inputType(el) !== "radio") continue;
        const name = el.getAttribute("name");
        if (!name) continue;
        const list = groups.get(name);
        if (list) list.push(el);
        else groups.set(name, [el]);
      }
      for (const [, radios] of groups) {
        if (radios.length < 2) continue;
        const first = radios[0];
        const inFieldset = radios.some((radio) => radio.closest("fieldset") !== null);
        const inRadiogroup = radios.some(
          (radio) => radio.closest('[role="radiogroup"]') !== null,
        );
        if (inFieldset || inRadiogroup) continue;
        findings.push(
          finding("This set of radio buttons is not grouped or labelled.", first, {
            suggestion:
              "Wrap the radios in <fieldset><legend>Group name</legend>…</fieldset>.",
            codeExample: {
              before:
                '<input type="radio" name="size" id="s"> <label for="s">Small</label>',
              after:
                '<fieldset>\n  <legend>Size</legend>\n  <input type="radio" name="size" id="s"> <label for="s">Small</label>\n</fieldset>',
            },
          }),
        );
      }
      return findings;
    },
  },
  {
    id: "autocomplete-missing",
    title: "Personal data field does not declare a purpose",
    description:
      "Inputs collecting user data should set autocomplete so browser autofill and assistive tech can identify their purpose.",
    category: "forms",
    severity: "minor",
    wcag: ["1.3.5"],
    run: (ctx) => {
      const findings: RuleFinding[] = [];
      for (const el of ctx.elements) {
        if (tagOf(el) !== "input") continue;
        const type = inputType(el);
        if (!["text", "email", "tel", "url", "password", "search"].includes(type)) continue;
        if (hasAttr(el, "autocomplete")) continue;
        const hint = `${el.getAttribute("name") ?? ""} ${el.getAttribute("id") ?? ""} ${el.getAttribute("placeholder") ?? ""}`;
        if (!PERSONAL_DATA_HINT.test(hint)) continue;
        findings.push(
          finding("This field appears to collect personal data but has no autocomplete.", el, {
            suggestion:
              'Add the matching autocomplete token, e.g. autocomplete="email" or autocomplete="given-name".',
          }),
        );
      }
      return findings;
    },
  },
];
