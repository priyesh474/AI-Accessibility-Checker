import { attr } from "../dom";
import { finding, type Rule, type RuleFinding } from "../types";

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

const NAMED_COLORS: Record<string, string> = {
  black: "#000000",
  white: "#ffffff",
  red: "#ff0000",
  green: "#008000",
  blue: "#0000ff",
  gray: "#808080",
  grey: "#808080",
  silver: "#c0c0c0",
  maroon: "#800000",
  olive: "#808000",
  lime: "#00ff00",
  aqua: "#00ffff",
  cyan: "#00ffff",
  teal: "#008080",
  navy: "#000080",
  fuchsia: "#ff00ff",
  magenta: "#ff00ff",
  purple: "#800080",
  yellow: "#ffff00",
  orange: "#ffa500",
};

function parseHex(value: string): Rgba | null {
  let hex = value.slice(1);
  if (![3, 4, 6, 8].includes(hex.length)) return null;
  if (hex.length <= 4) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  const a = hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1;
  if ([r, g, b, a].some((n) => Number.isNaN(n))) return null;
  return { r, g, b, a };
}

function parseRgbFunction(value: string): Rgba | null {
  const match = value.match(/^rgba?\(([^)]+)\)$/i);
  if (!match) return null;
  const parts = match[1].split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3) return null;
  const channel = (part: string): number => {
    const n = part.endsWith("%")
      ? (Number.parseFloat(part) / 100) * 255
      : Number.parseFloat(part);
    return Math.max(0, Math.min(255, Math.round(n)));
  };
  const r = channel(parts[0]);
  const g = channel(parts[1]);
  const b = channel(parts[2]);
  const a = parts[3] !== undefined ? Number.parseFloat(parts[3]) : 1;
  if ([r, g, b, a].some((n) => Number.isNaN(n))) return null;
  return { r, g, b, a };
}

function parseColor(raw: string): Rgba | null {
  const value = raw.trim().toLowerCase();
  if (!value) return null;
  if (value.startsWith("#")) return parseHex(value);
  if (value.startsWith("rgb")) return parseRgbFunction(value);
  if (NAMED_COLORS[value]) return parseHex(NAMED_COLORS[value]);
  return null;
}

function relativeLuminance({ r, g, b }: Rgba): number {
  const channel = (value: number): number => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(foreground: Rgba, background: Rgba): number {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function parseDeclarations(style: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const declaration of style.split(";")) {
    const index = declaration.indexOf(":");
    if (index === -1) continue;
    const property = declaration.slice(0, index).trim().toLowerCase();
    const value = declaration.slice(index + 1).trim();
    if (property) out[property] = value;
  }
  return out;
}

function fontSizePx(declarations: Record<string, string>): number | null {
  const raw = declarations["font-size"];
  if (!raw) return null;
  const match = raw.match(/^([\d.]+)\s*(px|rem|em|pt)?$/);
  if (!match) return null;
  const value = Number.parseFloat(match[1]);
  switch (match[2]) {
    case "rem":
    case "em":
      return value * 16;
    case "pt":
      return value * (96 / 72);
    default:
      return value;
  }
}

function isBold(declarations: Record<string, string>): boolean {
  const weight = declarations["font-weight"];
  if (!weight) return false;
  if (weight === "bold" || weight === "bolder") return true;
  const numeric = Number.parseInt(weight, 10);
  return Number.isFinite(numeric) && numeric >= 700;
}

/** Best-effort contrast check for colours declared in inline styles. */
export const contrastRules: Rule[] = [
  {
    id: "inline-style-contrast",
    title: "Inline text colour may not meet contrast requirements",
    description:
      "Text declared with an inline colour must reach a 4.5:1 contrast ratio (3:1 for large text).",
    category: "contrast",
    severity: "serious",
    wcag: ["1.4.3"],
    run: (ctx) => {
      const findings: RuleFinding[] = [];
      for (const el of ctx.elements) {
        const style = attr(el, "style");
        if (!style) continue;
        const declarations = parseDeclarations(style);
        const colorValue = declarations["color"];
        if (!colorValue) continue;
        const backgroundValue =
          declarations["background-color"] ?? declarations["background"];
        if (!backgroundValue) continue;
        if (/var\(|currentcolor|inherit|initial|unset/i.test(`${colorValue} ${backgroundValue}`)) {
          continue;
        }
        const foreground = parseColor(colorValue);
        const background = parseColor(backgroundValue);
        if (!foreground || !background || foreground.a < 1 || background.a < 1) continue;
        const ratio = contrastRatio(foreground, background);
        const size = fontSizePx(declarations);
        const large = size !== null && (size >= 24 || (size >= 18.66 && isBold(declarations)));
        const required = large ? 3 : 4.5;
        if (ratio >= required) continue;
        findings.push(
          finding(
            `Contrast ratio is ${ratio.toFixed(2)}:1 but ${required}:1 is required for this text.`,
            el,
            {
              suggestion:
                "Darken the text colour or lighten the background until the ratio meets the threshold. Verify with a contrast checker.",
              codeExample: {
                before: 'style="color:#999;background:#fff"',
                after: 'style="color:#595959;background:#fff"',
              },
            },
          ),
        );
      }
      return findings;
    },
  },
];
