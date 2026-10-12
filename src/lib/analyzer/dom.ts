import { parse, type HTMLElement as ParsedElement } from "node-html-parser";
import {
  ABSTRACT_ROLES,
  INTERACTIVE_ROLES,
  VALID_ROLES,
  implicitRole,
  isNativelyFocusable,
} from "./aria-data";

export type { ParsedElement };

const TEXT_NODE = 3;
const ELEMENT_NODE = 1;
const MAX_SELECTOR_DEPTH = 4;

/**
 * A parsed HTML snippet plus every lookup table the rules need. Built once per
 * analysis so individual rules stay cheap and side-effect free.
 */
export interface DocContext {
  source: string;
  root: ParsedElement;
  /** All elements in document order. */
  elements: ParsedElement[];
  byId: Map<string, ParsedElement[]>;
  ids: Set<string>;
  labels: ParsedElement[];
  labelFor: Map<string, ParsedElement[]>;
  lineStarts: number[];
  /** True when the snippet is a full document (contains `<html>`). */
  isDocument: boolean;
  html: ParsedElement | null;
  title: string | null;
  getById(id: string): ParsedElement | undefined;
  queryAll(selector: string): ParsedElement[];
}

function walk(node: ParsedElement, out: ParsedElement[]): void {
  for (const child of node.childNodes) {
    if (child.nodeType === ELEMENT_NODE) {
      const element = child as ParsedElement;
      out.push(element);
      walk(element, out);
    }
  }
}

function computeLineStarts(source: string): number[] {
  const starts = [0];
  for (let i = 0; i < source.length; i += 1) {
    if (source.charCodeAt(i) === 10) starts.push(i + 1);
  }
  return starts;
}

function safeQueryAll(root: ParsedElement, selector: string): ParsedElement[] {
  try {
    return root.querySelectorAll(selector);
  } catch {
    return [];
  }
}

/** Parse a snippet and build the shared context used by all rules. */
export function buildDocContext(source: string): DocContext {
  const root = parse(source, {
    comment: true,
    blockTextElements: { script: true, style: true, pre: true },
  });

  const elements: ParsedElement[] = [];
  walk(root, elements);

  const byId = new Map<string, ParsedElement[]>();
  const ids = new Set<string>();
  const labels: ParsedElement[] = [];
  const labelFor = new Map<string, ParsedElement[]>();

  for (const element of elements) {
    const id = element.getAttribute("id");
    if (id !== undefined && id !== "") {
      ids.add(id);
      const list = byId.get(id);
      if (list) list.push(element);
      else byId.set(id, [element]);
    }
    if (element.rawTagName.toLowerCase() === "label") {
      labels.push(element);
      const target = element.getAttribute("for");
      if (target) {
        const list = labelFor.get(target);
        if (list) list.push(element);
        else labelFor.set(target, [element]);
      }
    }
  }

  const html = elements.find((el) => el.rawTagName.toLowerCase() === "html") ?? null;
  const titleElement = elements.find((el) => el.rawTagName.toLowerCase() === "title");

  return {
    source,
    root,
    elements,
    byId,
    ids,
    labels,
    labelFor,
    lineStarts: computeLineStarts(source),
    isDocument: html !== null,
    html,
    title: titleElement ? normalizeWhitespace(titleElement.text) : null,
    getById(id) {
      const found = byId.get(id);
      return found && found.length > 0 ? found[0] : undefined;
    },
    queryAll(selector) {
      return safeQueryAll(root, selector);
    },
  };
}

export function tagOf(element: ParsedElement): string {
  return element.rawTagName.toLowerCase();
}

export function attr(element: ParsedElement, name: string): string | undefined {
  return element.getAttribute(name);
}

export function hasAttr(element: ParsedElement, name: string): boolean {
  return element.hasAttribute(name);
}

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function truncate(value: string, max = 300): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

/** Convert an absolute character offset into a 1-based line/column pair. */
export function offsetToLineColumn(
  ctx: DocContext,
  offset: number,
): { line: number; column: number } {
  const starts = ctx.lineStarts;
  let low = 0;
  let high = starts.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2);
    if (starts[mid] <= offset) low = mid;
    else high = mid - 1;
  }
  return { line: low + 1, column: offset - starts[low] + 1 };
}

/** A stable, human-readable selector that roughly identifies the element. */
export function getSelector(element: ParsedElement, depth = 0): string {
  const tag = tagOf(element);
  const id = element.getAttribute("id");
  if (id) return `${tag}#${id}`;

  const classes = element.classList.value.slice(0, 2);
  let segment = tag + classes.map((c) => `.${c}`).join("");

  const parent = element.parentNode;
  const siblings =
    parent && parent.rawTagName
      ? parent.children.filter((child) => tagOf(child) === tag)
      : [];
  if (siblings.length > 1) {
    segment += `:nth-of-type(${siblings.indexOf(element) + 1})`;
  }

  if (!parent || depth >= MAX_SELECTOR_DEPTH || !parent.rawTagName) {
    return segment;
  }
  return `${getSelector(parent, depth + 1)} > ${segment}`;
}

/** Original markup for an element, sliced out of the source when possible. */
export function getSnippet(
  ctx: DocContext,
  element: ParsedElement,
  max = 400,
): string {
  const range = element.range;
  if (
    range &&
    range[1] > range[0] &&
    range[0] >= 0 &&
    range[1] <= ctx.source.length
  ) {
    return truncate(ctx.source.slice(range[0], range[1]).trim(), max);
  }
  return truncate(element.outerHTML.trim(), max);
}

/** Resolve the element's explicit role, falling back to the implicit role. */
export function getRole(element: ParsedElement): string | null {
  const explicit = element.getAttribute("role");
  if (explicit !== undefined) {
    const first = explicit.trim().toLowerCase().split(/\s+/)[0];
    if (first) return first;
  }
  return implicitRole(tagOf(element), (name) => element.getAttribute(name));
}

export function hasValidExplicitRole(element: ParsedElement): boolean {
  const explicit = element.getAttribute("role");
  if (explicit === undefined) return false;
  const role = explicit.trim().toLowerCase().split(/\s+/)[0];
  return Boolean(role) && (VALID_ROLES.has(role) || ABSTRACT_ROLES.has(role));
}

/** Concatenated text, replacing images/inputs with their text equivalents. */
export function collectText(
  element: ParsedElement,
  seen: Set<ParsedElement> = new Set(),
): string {
  if (seen.has(element)) return "";
  seen.add(element);
  let out = "";
  for (const child of element.childNodes) {
    if (child.nodeType === TEXT_NODE) {
      out += child.rawText;
      continue;
    }
    if (child.nodeType !== ELEMENT_NODE) continue;
    const node = child as ParsedElement;
    if (node.getAttribute("aria-hidden") === "true") continue;
    const tag = tagOf(node);
    if (tag === "img" || tag === "area") {
      const alt = node.getAttribute("alt");
      if (alt) out += ` ${alt} `;
      continue;
    }
    if (tag === "input") {
      const type = (node.getAttribute("type") ?? "").toLowerCase();
      if (type === "image") {
        const alt = node.getAttribute("alt");
        if (alt) out += ` ${alt} `;
        continue;
      }
      if (type === "submit" || type === "reset" || type === "button") {
        const value = node.getAttribute("value");
        if (value) out += ` ${value} `;
        continue;
      }
    }
    if (tag === "svg") {
      const title = safeQueryAll(node, "title")[0];
      if (title) out += ` ${title.text} `;
      continue;
    }
    out += collectText(node, seen);
  }
  return out;
}

function resolveIdRefs(ctx: DocContext, value: string): string {
  const ids = value.trim().split(/\s+/).filter(Boolean);
  const parts: string[] = [];
  for (const id of ids) {
    const target = ctx.getById(id);
    if (target) parts.push(collectText(target));
  }
  return normalizeWhitespace(parts.join(" "));
}

/** Text provided by a `<label for>` or an ancestor `<label>`. */
export function labelTextFor(
  ctx: DocContext,
  element: ParsedElement,
): string {
  const id = element.getAttribute("id");
  if (id) {
    const labels = ctx.labelFor.get(id);
    if (labels && labels.length > 0) {
      const text = normalizeWhitespace(labels.map((l) => collectText(l)).join(" "));
      if (text) return text;
    }
  }
  const ancestorLabel = element.closest("label");
  if (ancestorLabel) {
    const text = normalizeWhitespace(collectText(ancestorLabel));
    if (text) return text;
  }
  return "";
}

/**
 * Simplified accessible-name computation following the order in the
 * Accessible Name and Description Computation spec.
 */
export function getAccessibleName(
  ctx: DocContext,
  element: ParsedElement,
): string {
  const labelledby = element.getAttribute("aria-labelledby");
  if (labelledby && labelledby.trim()) {
    const name = resolveIdRefs(ctx, labelledby);
    if (name) return name;
  }

  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel && ariaLabel.trim()) return normalizeWhitespace(ariaLabel);

  const tag = tagOf(element);

  if (tag === "img" || tag === "area") {
    const alt = element.getAttribute("alt");
    if (alt && alt.trim()) return normalizeWhitespace(alt);
  }

  if (tag === "input") {
    const type = (element.getAttribute("type") ?? "text").toLowerCase();
    if (type === "image") {
      const alt = element.getAttribute("alt");
      if (alt && alt.trim()) return normalizeWhitespace(alt);
      const value = element.getAttribute("value");
      if (value && value.trim()) return normalizeWhitespace(value);
      return "";
    }
    if (type === "submit" || type === "reset" || type === "button") {
      const value = element.getAttribute("value");
      if (value && value.trim()) return normalizeWhitespace(value);
      if (type === "submit") return "Submit";
      if (type === "reset") return "Reset";
      return "";
    }
    if (type === "hidden") return "";
    const label = labelTextFor(ctx, element);
    if (label) return label;
    const title = element.getAttribute("title");
    if (title && title.trim()) return normalizeWhitespace(title);
    const placeholder = element.getAttribute("placeholder");
    if (placeholder && placeholder.trim()) return normalizeWhitespace(placeholder);
    return "";
  }

  if (tag === "select" || tag === "textarea" || tag === "meter" || tag === "progress") {
    const label = labelTextFor(ctx, element);
    if (label) return label;
    const title = element.getAttribute("title");
    if (title && title.trim()) return normalizeWhitespace(title);
    return "";
  }

  if (tag === "svg") {
    const title = safeQueryAll(element, "title")[0];
    if (title) {
      const text = normalizeWhitespace(title.text);
      if (text) return text;
    }
  }

  const content = normalizeWhitespace(collectText(element));
  if (content) return content;

  const title = element.getAttribute("title");
  if (title && title.trim()) return normalizeWhitespace(title);

  return "";
}

export function isFocusable(element: ParsedElement): boolean {
  if (element.hasAttribute("tabindex")) return true;
  return isNativelyFocusable(tagOf(element), (name) => element.getAttribute(name));
}

export function isTabbable(element: ParsedElement): boolean {
  const tabindex = element.getAttribute("tabindex");
  if (tabindex !== undefined) {
    const value = Number.parseInt(tabindex, 10);
    return Number.isFinite(value) && value >= 0;
  }
  return isNativelyFocusable(tagOf(element), (name) => element.getAttribute(name));
}

/** Does the element's subtree contain any focusable descendant? */
export function hasFocusableDescendant(element: ParsedElement): boolean {
  for (const child of element.childNodes) {
    if (child.nodeType !== ELEMENT_NODE) continue;
    const node = child as ParsedElement;
    if (isFocusable(node) || hasFocusableDescendant(node)) return true;
  }
  return false;
}

export function hasInteractiveDescendant(element: ParsedElement): boolean {
  for (const child of element.childNodes) {
    if (child.nodeType !== ELEMENT_NODE) continue;
    const node = child as ParsedElement;
    const role = getRole(node);
    if (role && INTERACTIVE_ROLES.has(role)) return true;
    if (hasInteractiveDescendant(node)) return true;
  }
  return false;
}

/** Split an id-reference attribute (`aria-labelledby`, `headers`, …). */
export function idRefs(value: string | undefined): string[] {
  if (!value) return [];
  return value.trim().split(/\s+/).filter(Boolean);
}

export function classTokens(element: ParsedElement): string[] {
  return element.classList.value;
}
