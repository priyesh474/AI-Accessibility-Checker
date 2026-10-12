import type { WcagPrinciple } from "@/types/analysis";

/**
 * Static knowledge about WAI-ARIA 1.2 (plus the few 1.3 additions that are
 * widely supported) used by the ARIA and keyboard rules.
 *
 * The lists intentionally lean towards *not* flagging a valid-but-uncommon
 * value, because a false positive is more damaging than a missed check in a
 * developer-facing linter.
 */

/** Concrete roles authors may use. */
export const VALID_ROLES: ReadonlySet<string> = new Set([
  // Document structure
  "application",
  "article",
  "blockquote",
  "caption",
  "cell",
  "code",
  "columnheader",
  "definition",
  "deletion",
  "directory",
  "document",
  "emphasis",
  "feed",
  "figure",
  "generic",
  "group",
  "heading",
  "img",
  "insertion",
  "list",
  "listitem",
  "math",
  "meter",
  "none",
  "note",
  "paragraph",
  "presentation",
  "row",
  "rowgroup",
  "rowheader",
  "separator",
  "strong",
  "subscript",
  "superscript",
  "table",
  "term",
  "time",
  "toolbar",
  "tooltip",
  // Widget roles
  "button",
  "checkbox",
  "gridcell",
  "link",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "option",
  "progressbar",
  "radio",
  "scrollbar",
  "searchbox",
  "slider",
  "spinbutton",
  "switch",
  "tab",
  "tabpanel",
  "textbox",
  "treeitem",
  // Composite widget roles
  "combobox",
  "grid",
  "listbox",
  "menu",
  "menubar",
  "radiogroup",
  "tablist",
  "tree",
  "treegrid",
  // Landmark roles
  "banner",
  "complementary",
  "contentinfo",
  "form",
  "main",
  "navigation",
  "region",
  "search",
  // Live region roles
  "alert",
  "log",
  "marquee",
  "status",
  "timer",
  // Window roles
  "alertdialog",
  "dialog",
  // Graphics (ARIA 1.2)
  "graphics-document",
  "graphics-object",
  "graphics-symbol",
  // ARIA 1.3 additions that already ship in browsers
  "association",
  "comment",
  "mark",
  "suggestion",
]);

/** Roles that exist only for the spec's type hierarchy; authors must not use them. */
export const ABSTRACT_ROLES: ReadonlySet<string> = new Set([
  "command",
  "composite",
  "input",
  "landmark",
  "range",
  "roletype",
  "section",
  "sectionhead",
  "select",
  "structure",
  "widget",
  "window",
]);

/** Valid `aria-*` attributes (minus the `aria-` prefix). */
export const VALID_ARIA_ATTRIBUTES: ReadonlySet<string> = new Set([
  "activedescendant",
  "atomic",
  "autocomplete",
  "braillelabel",
  "brailleroledescription",
  "busy",
  "checked",
  "colcount",
  "colindex",
  "colindextext",
  "colspan",
  "controls",
  "current",
  "describedby",
  "description",
  "details",
  "disabled",
  "dropeffect",
  "errormessage",
  "expanded",
  "flowto",
  "grabbed",
  "haspopup",
  "hidden",
  "invalid",
  "keyshortcuts",
  "label",
  "labelledby",
  "level",
  "live",
  "modal",
  "multiline",
  "multiselectable",
  "orientation",
  "owns",
  "placeholder",
  "posinset",
  "pressed",
  "readonly",
  "relevant",
  "required",
  "roledescription",
  "rowcount",
  "rowindex",
  "rowindextext",
  "rowspan",
  "selected",
  "setsize",
  "sort",
  "valuemax",
  "valuemin",
  "valuenow",
  "valuetext",
]);

/** ARIA attributes whose value must be `true` or `false`. */
export const ARIA_BOOLEAN_ATTRIBUTES: ReadonlySet<string> = new Set([
  "atomic",
  "busy",
  "disabled",
  "expanded",
  "hidden",
  "modal",
  "multiline",
  "multiselectable",
  "readonly",
  "required",
  "selected",
]);

/** ARIA attributes that accept `true`, `false` or `mixed`. */
export const ARIA_TRISTATE_ATTRIBUTES: ReadonlySet<string> = new Set([
  "checked",
  "pressed",
]);

export const ARIA_TOKEN_VALUES: Record<string, ReadonlySet<string>> = {
  current: new Set(["page", "step", "location", "date", "time", "true", "false"]),
  haspopup: new Set(["false", "true", "menu", "listbox", "tree", "grid", "dialog"]),
  invalid: new Set(["false", "true", "grammar", "spelling"]),
  autocomplete: new Set(["none", "inline", "list", "both"]),
  live: new Set(["off", "assertive", "polite"]),
  orientation: new Set(["horizontal", "vertical", "undefined"]),
  sort: new Set(["none", "ascending", "descending", "other"]),
  dropeffect: new Set(["copy", "execute", "link", "move", "none", "popup"]),
};

/** Roles that a name is *not* allowed on (naming is prohibited). */
export const ROLES_PROHIBITING_NAME: ReadonlySet<string> = new Set([
  "caption",
  "code",
  "deletion",
  "emphasis",
  "generic",
  "insertion",
  "paragraph",
  "presentation",
  "none",
  "strong",
  "subscript",
  "superscript",
  "term",
  "time",
]);

/** Roles that are widgets and therefore must have an accessible name. */
export const WIDGET_ROLES_REQUIRING_NAME: ReadonlySet<string> = new Set([
  "button",
  "checkbox",
  "combobox",
  "dialog",
  "link",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "radio",
  "searchbox",
  "slider",
  "spinbutton",
  "switch",
  "tab",
  "textbox",
  "treeitem",
]);

/** Roles that are interactive and should therefore be keyboard reachable. */
export const INTERACTIVE_ROLES: ReadonlySet<string> = new Set([
  "button",
  "checkbox",
  "combobox",
  "gridcell",
  "link",
  "listbox",
  "menu",
  "menubar",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "option",
  "radio",
  "radiogroup",
  "scrollbar",
  "searchbox",
  "slider",
  "spinbutton",
  "switch",
  "tab",
  "tablist",
  "textbox",
  "tree",
  "treegrid",
  "treeitem",
]);

/** Landmark roles, used to reason about page structure. */
export const LANDMARK_ROLES: ReadonlySet<string> = new Set([
  "banner",
  "complementary",
  "contentinfo",
  "form",
  "main",
  "navigation",
  "region",
  "search",
]);

/** Implicit ARIA role for common HTML elements. */
export function implicitRole(
  tag: string,
  attrs: (name: string) => string | undefined,
): string | null {
  const type = (attrs("type") ?? "").toLowerCase();
  switch (tag) {
    case "a":
    case "area":
      return attrs("href") !== undefined ? "link" : "generic";
    case "article":
      return "article";
    case "aside":
      return "complementary";
    case "button":
      return "button";
    case "blockquote":
      return "blockquote";
    case "caption":
      return "caption";
    case "code":
      return "code";
    case "del":
      return "deletion";
    case "datalist":
      return "listbox";
    case "dd":
      return "definition";
    case "details":
      return "group";
    case "dfn":
      return "term";
    case "dialog":
      return "dialog";
    case "dt":
      return "term";
    case "em":
      return "emphasis";
    case "fieldset":
      return "group";
    case "figure":
      return "figure";
    case "footer":
      return "contentinfo";
    case "form":
      return "form";
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
      return "heading";
    case "header":
      return "banner";
    case "hr":
      return "separator";
    case "html":
      return "document";
    case "img":
      return attrs("alt") === "" ? "presentation" : "img";
    case "input":
      if (type === "button" || type === "image" || type === "reset" || type === "submit")
        return "button";
      if (type === "checkbox") return "checkbox";
      if (type === "radio") return "radio";
      if (type === "range") return "slider";
      if (type === "number") return "spinbutton";
      if (type === "search") return "searchbox";
      if (type === "hidden") return null;
      return "textbox";
    case "li":
      return "listitem";
    case "main":
      return "main";
    case "mark":
      return "mark";
    case "math":
      return "math";
    case "menu":
      return "list";
    case "nav":
      return "navigation";
    case "ol":
    case "ul":
      return "list";
    case "optgroup":
      return "group";
    case "option":
      return "option";
    case "output":
      return "status";
    case "p":
      return "paragraph";
    case "progress":
      return "progressbar";
    case "section":
      return "region";
    case "select":
      return attrs("multiple") !== undefined || Number(attrs("size") ?? 0) > 1
        ? "listbox"
        : "combobox";
    case "summary":
      return "button";
    case "table":
      return "table";
    case "strong":
      return "strong";
    case "sub":
      return "subscript";
    case "sup":
      return "superscript";
    case "tbody":
    case "tfoot":
    case "thead":
      return "rowgroup";
    case "td":
      return "cell";
    case "textarea":
      return "textbox";
    case "th":
      return attrs("scope") === "row" ? "rowheader" : "columnheader";
    case "time":
      return "time";
    case "tr":
      return "row";
    default:
      return null;
  }
}

/** Element + attribute combos that are natively focusable with a keyboard. */
export function isNativelyFocusable(
  tag: string,
  attrs: (name: string) => string | undefined,
): boolean {
  const disabled = attrs("disabled") !== undefined;
  switch (tag) {
    case "a":
    case "area":
      return attrs("href") !== undefined;
    case "button":
    case "select":
    case "textarea":
      return !disabled;
    case "input":
      return attrs("type") !== "hidden" && !disabled;
    case "iframe":
    case "embed":
      return true;
    case "summary":
      return true;
    case "audio":
    case "video":
      return attrs("controls") !== undefined;
    default:
      return attrs("contenteditable") !== undefined;
  }
}

/** Best-effort mapping from a tag to a category used by the "non-text" rules. */
export const MEDIA_TAGS: ReadonlySet<string> = new Set(["audio", "video"]);

export const PRINCIPLE_ORDER: WcagPrinciple[] = [
  "Perceivable",
  "Operable",
  "Understandable",
  "Robust",
];
