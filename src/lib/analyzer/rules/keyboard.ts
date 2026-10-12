import { INTERACTIVE_ROLES, isNativelyFocusable } from "../aria-data";
import {
  getRole,
  hasInteractiveDescendant,
  tagOf,
  type ParsedElement,
} from "../dom";
import { finding, type Rule, type RuleFinding } from "../types";

const LEAF_INTERACTIVE_ROLES = new Set([
  "button",
  "checkbox",
  "link",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "option",
  "radio",
  "searchbox",
  "slider",
  "spinbutton",
  "switch",
  "tab",
  "textbox",
  "treeitem",
]);

const COMPOSITE_CONTAINERS = new Set([
  "select",
  "datalist",
  "optgroup",
  "listbox",
  "menu",
  "menubar",
  "tablist",
  "grid",
  "tree",
  "treegrid",
  "radiogroup",
  "combobox",
  "toolbar",
]);

const MOUSE_HANDLERS = ["onclick", "onmousedown", "onmouseup", "onmouseover"];
const KEY_HANDLERS = ["onkeydown", "onkeyup", "onkeypress"];

function isInteractiveParent(el: ParsedElement): boolean {
  const tag = tagOf(el);
  if (tag === "button" || tag === "summary") return true;
  if (tag === "a" && el.getAttribute("href") !== undefined) return true;
  const role = getRole(el);
  return role !== null && LEAF_INTERACTIVE_ROLES.has(role);
}

/** Rules about keyboard reachability and focus management (WCAG 2.1). */
export const keyboardRules: Rule[] = [
  {
    id: "tabindex-positive",
    title: "Positive tabindex disrupts focus order",
    description:
      "tabindex greater than 0 forces an unnatural tab order that does not follow the DOM and is hard to maintain.",
    category: "keyboard",
    severity: "serious",
    wcag: ["2.4.3"],
    run: (ctx) =>
      ctx.elements
        .filter((el) => {
          const value = el.getAttribute("tabindex");
          return value !== undefined && Number.parseInt(value, 10) > 0;
        })
        .map((el) =>
          finding(`tabindex="${el.getAttribute("tabindex")}" overrides the natural focus order.`, el, {
            suggestion:
              'Use tabindex="0" to add an element to the tab order at its DOM position, and reorder the DOM instead of using positive values.',
            codeExample: {
              before: '<div tabindex="3">…</div>',
              after: '<div tabindex="0">…</div>',
            },
          }),
        ),
  },
  {
    id: "click-handler-no-keyboard",
    title: "Click handler has no keyboard equivalent",
    description:
      "Mouse-only handlers on non-interactive elements cannot be used with a keyboard or screen reader.",
    category: "keyboard",
    severity: "critical",
    wcag: ["2.1.1"],
    run: (ctx) => {
      const findings: RuleFinding[] = [];
      for (const el of ctx.elements) {
        const hasMouseHandler = MOUSE_HANDLERS.some(
          (name) => el.getAttribute(name) !== undefined,
        );
        if (!hasMouseHandler) continue;
        if (isNativelyFocusable(tagOf(el), (name) => el.getAttribute(name))) continue;
        const tabindex = el.getAttribute("tabindex");
        const tabindexOk = tabindex !== undefined && Number.parseInt(tabindex, 10) >= 0;
        const role = getRole(el);
        const roleOk = role !== null && INTERACTIVE_ROLES.has(role);
        const hasKeyHandler = KEY_HANDLERS.some(
          (name) => el.getAttribute(name) !== undefined,
        );
        if (tabindexOk && roleOk && hasKeyHandler) continue;
        findings.push(
          finding("This element listens for clicks but is not keyboard operable.", el, {
            suggestion:
              'Use a real <button>/<a>, or add role="button", tabindex="0" and an onkeydown/onkeyup handler.',
            codeExample: {
              before: '<div onclick="submit()">Submit</div>',
              after: '<button type="button" onclick="submit()">Submit</button>',
            },
          }),
        );
      }
      return findings;
    },
  },
  {
    id: "anchor-no-href",
    title: "Anchor without href is not a link",
    description:
      "An <a> element without href is not focusable and is not announced as a link by assistive technology.",
    category: "keyboard",
    severity: "moderate",
    wcag: ["2.1.1", "4.1.2"],
    run: (ctx) =>
      ctx.elements
        .filter((el) => tagOf(el) === "a")
        .filter((el) => el.getAttribute("href") === undefined)
        .filter((el) => el.getAttribute("role") === undefined)
        .filter((el) => el.getAttribute("tabindex") === undefined)
        .map((el) =>
          finding("This <a> has no href, role or tabindex.", el, {
            suggestion:
              "If it navigates, give it a real href. If it performs an action, use a <button> instead.",
          }),
        ),
  },
  {
    id: "nested-interactive",
    title: "Interactive elements are nested",
    description:
      "Interactive controls must not contain other interactive controls; screen readers and keyboards cannot handle the overlap.",
    category: "keyboard",
    severity: "serious",
    wcag: ["1.3.1", "2.1.1", "4.1.2"],
    run: (ctx) => {
      const findings: RuleFinding[] = [];
      for (const el of ctx.elements) {
        if (!isInteractiveParent(el)) continue;
        const role = getRole(el);
        if (role && COMPOSITE_CONTAINERS.has(role)) continue;
        if (COMPOSITE_CONTAINERS.has(tagOf(el))) continue;
        if (!hasInteractiveDescendant(el)) continue;
        findings.push(
          finding("This interactive element contains another interactive element.", el, {
            suggestion:
              "Restructure so controls are siblings, not nested (e.g. move a button outside a link).",
          }),
        );
      }
      return findings;
    },
  },
  {
    id: "iframe-title",
    title: "Iframe has no title",
    description:
      "Frames must have a title attribute so users can tell what each frame contains.",
    category: "keyboard",
    severity: "serious",
    wcag: ["2.4.1", "4.1.2"],
    run: (ctx) =>
      ctx.elements
        .filter((el) => tagOf(el) === "iframe")
        .filter((el) => el.getAttribute("aria-hidden") !== "true")
        .filter((el) => !(el.getAttribute("title") ?? "").trim())
        .filter((el) => !(el.getAttribute("aria-label") ?? "").trim())
        .map((el) =>
          finding("This <iframe> has no title.", el, {
            suggestion:
              'Add a descriptive title, e.g. title="Product demo video". If it is decorative, hide it with aria-hidden="true" and tabindex="-1".',
          }),
        ),
  },
  {
    id: "autofocus",
    title: "Autofocus can disorient users",
    description:
      "autofocus moves focus unexpectedly, especially for screen reader and keyboard users. Prefer visible focus management.",
    category: "keyboard",
    severity: "minor",
    wcag: ["2.4.3"],
    run: (ctx) =>
      ctx.elements
        .filter((el) => el.getAttribute("autofocus") !== undefined)
        .map((el) =>
          finding("This element uses autofocus.", el, {
            suggestion:
              "Remove autofocus and manage focus deliberately (e.g. when opening a dialog).",
          }),
        ),
  },
  {
    id: "accesskey",
    title: "accesskey is used",
    description:
      "accesskey shortcut keys conflict with browser and assistive technology shortcuts and are hard to discover.",
    category: "keyboard",
    severity: "minor",
    wcag: [],
    run: (ctx) =>
      ctx.elements
        .filter((el) => el.getAttribute("accesskey") !== undefined)
        .map((el) =>
          finding(`accesskey="${el.getAttribute("accesskey")}" may conflict with browser shortcuts.`, el, {
            suggestion: "Remove the accesskey and rely on normal keyboard navigation.",
          }),
        ),
  },
];
