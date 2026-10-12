import { classTokens, getAccessibleName, getRole, tagOf } from "../dom";
import { finding, type Rule, type RuleFinding } from "../types";

const REDUNDANT_ALT = /^(image|picture|photo|graphic|icon|logo)\s+of\b/i;
const IMAGE_FILE = /\.(png|jpe?g|gif|svg|webp|avif|bmp)$/i;
const ICON_FONT =
  /^(fa|fas|far|fab|fal|fad|glyphicon|material-icons(-outlined|-round|-sharp|-two-tone)?)$|^fa-|^glyphicon-|^bi-/;

/** Rules about text alternatives for non-text content (WCAG 1.1.1). */
export const imageRules: Rule[] = [
  {
    id: "img-alt-missing",
    title: "Image is missing alternative text",
    description:
      "Every <img> needs an alt attribute: meaningful text for informative images, or alt=\"\" for decorative ones.",
    category: "images",
    severity: "critical",
    wcag: ["1.1.1"],
    run: (ctx) =>
      ctx.elements
        .filter((el) => tagOf(el) === "img")
        .filter((el) => el.getAttribute("alt") === undefined)
        .filter((el) => el.getAttribute("aria-hidden") !== "true")
        .filter((el) => {
          const role = getRole(el);
          return role !== "presentation" && role !== "none";
        })
        .map((el) =>
          finding("This <img> has no alt attribute.", el, {
            suggestion:
              'Add alt text that conveys the image\u2019s purpose, or alt="" if the image is purely decorative.',
            codeExample: {
              before: '<img src="revenue-chart.png">',
              after: '<img src="revenue-chart.png" alt="Revenue grew 24% in Q3">',
            },
          }),
        ),
  },
  {
    id: "img-alt-redundant",
    title: "Alternative text is redundant or unhelpful",
    description:
      'Screen readers already announce images. alt text should not start with "image of" and should not be a file name.',
    category: "images",
    severity: "minor",
    wcag: ["1.1.1"],
    run: (ctx) => {
      const findings: RuleFinding[] = [];
      for (const el of ctx.elements) {
        if (tagOf(el) !== "img") continue;
        const alt = el.getAttribute("alt");
        if (!alt || !alt.trim()) continue;
        const value = alt.trim();
        if (REDUNDANT_ALT.test(value)) {
          findings.push(
            finding(`The alt text "${value}" starts with a redundant phrase.`, el, {
              severity: "minor",
              suggestion:
                'Describe the purpose, not the format. e.g. alt="Revenue chart" instead of "image of a chart".',
            }),
          );
        } else if (IMAGE_FILE.test(value)) {
          findings.push(
            finding(`The alt text "${value}" looks like a file name.`, el, {
              suggestion:
                "Describe what the image communicates, not its file name.",
            }),
          );
        }
      }
      return findings;
    },
  },
  {
    id: "svg-accessible-name",
    title: "Inline SVG has no accessible name",
    description:
      "Meaningful inline <svg> elements need a <title>, aria-label or aria-labelledby so they are announced.",
    category: "images",
    severity: "serious",
    wcag: ["1.1.1", "4.1.2"],
    run: (ctx) => {
      const findings: RuleFinding[] = [];
      for (const el of ctx.elements) {
        if (tagOf(el) !== "svg") continue;
        if (el.getAttribute("aria-hidden") === "true") continue;
        const hasTitle = el.querySelectorAll("title").length > 0;
        const hasLabel =
          (el.getAttribute("aria-label") ?? "").trim() !== "" ||
          (el.getAttribute("aria-labelledby") ?? "").trim() !== "";
        if (!hasTitle && !hasLabel) {
          findings.push(
            finding("This <svg> has no <title> or ARIA label.", el, {
              suggestion:
                'Add a <title> as the first child, or aria-hidden="true" if the icon is decorative.',
              codeExample: {
                before: '<svg viewBox="0 0 24 24"><path d="…"/></svg>',
                after:
                  '<svg viewBox="0 0 24 24" role="img" aria-labelledby="cartIcon">\n  <title id="cartIcon">Cart</title>\n  <path d="…"/>\n</svg>',
              },
            }),
          );
        }
      }
      return findings;
    },
  },
  {
    id: "role-img-name",
    title: "Element with role=img has no accessible name",
    description:
      'Elements that expose role="img" must provide a text alternative via aria-label, aria-labelledby or <title>.',
    category: "images",
    severity: "serious",
    wcag: ["1.1.1", "4.1.2"],
    run: (ctx) => {
      const findings: RuleFinding[] = [];
      for (const el of ctx.elements) {
        if (getRole(el) !== "img") continue;
        if (el.getAttribute("aria-hidden") === "true") continue;
        if (getAccessibleName(ctx, el).length > 0) continue;
        findings.push(
          finding('This element has role="img" but no accessible name.', el, {
            suggestion:
              'Add aria-label="…" or aria-labelledby pointing at visible text.',
          }),
        );
      }
      return findings;
    },
  },
  {
    id: "input-image-alt",
    title: "Image button is missing alt text",
    description:
      '<input type="image"> needs an alt attribute that describes the action, not the graphic.',
    category: "images",
    severity: "serious",
    wcag: ["1.1.1", "4.1.2"],
    run: (ctx) =>
      ctx.elements
        .filter(
          (el) =>
            tagOf(el) === "input" &&
            (el.getAttribute("type") ?? "").toLowerCase() === "image",
        )
        .filter((el) => !(el.getAttribute("alt") ?? "").trim())
        .filter((el) => !(el.getAttribute("aria-label") ?? "").trim())
        .map((el) =>
          finding('This image button has no alt text or accessible name.', el, {
            suggestion:
              'Add alt="Search" (describe the action). A title attribute is not sufficient.',
            codeExample: {
              before: '<input type="image" src="search.png">',
              after: '<input type="image" src="search.png" alt="Search">',
            },
          }),
        ),
  },
  {
    id: "area-alt",
    title: "Image map area is missing alt text",
    description:
      "Each <area> in an image map needs an alt attribute describing the link destination.",
    category: "images",
    severity: "serious",
    wcag: ["1.1.1"],
    run: (ctx) =>
      ctx.elements
        .filter((el) => tagOf(el) === "area")
        .filter((el) => el.getAttribute("alt") === undefined)
        .filter((el) => !(el.getAttribute("aria-label") ?? "").trim())
        .map((el) =>
          finding("This <area> has no alt attribute.", el, {
            suggestion: 'Add alt="…" describing where the link leads.',
          }),
        ),
  },
  {
    id: "object-alt",
    title: "Embedded object has no text alternative",
    description:
      "Content inside <object> must have a text alternative so it is usable when the embed cannot be rendered.",
    category: "images",
    severity: "moderate",
    wcag: ["1.1.1"],
    run: (ctx) => {
      const findings: RuleFinding[] = [];
      for (const el of ctx.elements) {
        if (tagOf(el) !== "object") continue;
        const hasName =
          el.text.trim().length > 0 ||
          (el.getAttribute("title") ?? "").trim() !== "" ||
          (el.getAttribute("aria-label") ?? "").trim() !== "";
        if (!hasName) {
          findings.push(
            finding("This <object> has no fallback text content.", el, {
              suggestion:
                "Provide fallback content inside <object> or an accessible name on the element.",
            }),
          );
        }
      }
      return findings;
    },
  },
  {
    id: "decorative-icon-hidden",
    title: "Decorative icon is not hidden from assistive tech",
    description:
      "Icon fonts (Font Awesome, Material Icons, Bootstrap Icons) should be aria-hidden so screen readers skip them.",
    category: "images",
    severity: "minor",
    wcag: ["1.1.1"],
    run: (ctx) => {
      const findings: RuleFinding[] = [];
      for (const el of ctx.elements) {
        const tokens = classTokens(el);
        if (!tokens.some((token) => ICON_FONT.test(token))) continue;
        if (el.getAttribute("aria-hidden") === "true") continue;
        if (getAccessibleName(ctx, el).length > 0) continue;
        findings.push(
          finding("This icon font element is exposed to assistive technology.", el, {
            suggestion:
              'Add aria-hidden="true" if the icon is decorative, or provide an accessible name if it is meaningful.',
          }),
        );
      }
      return findings;
    },
  },
];
