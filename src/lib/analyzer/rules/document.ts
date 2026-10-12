import { attr, tagOf } from "../dom";
import { finding, type Rule, type RuleFinding } from "../types";

const LANG_PATTERN = /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/;

/** Document-level checks: language, title, zoom and duplicate ids. */
export const documentRules: Rule[] = [
  {
    id: "document-lang",
    title: "Page language is not declared",
    description:
      "The root <html> element must declare a valid lang attribute so assistive technology can choose the right pronunciation and rules.",
    category: "document",
    severity: "critical",
    wcag: ["3.1.1"],
    applies: (ctx) => ctx.isDocument,
    run: (ctx) => {
      const html = ctx.html;
      if (!html) return [];
      if (attr(html, "lang") === undefined) {
        return [
          finding("The <html> element is missing a lang attribute.", html, {
            suggestion:
              'Add a valid language tag, for example <html lang="en">. Use the primary language of the page content.',
            codeExample: {
              before: "<html>",
              after: '<html lang="en">',
            },
          }),
        ];
      }
      return [];
    },
  },
  {
    id: "document-lang-valid",
    title: "Page language value looks invalid",
    description:
      "The lang attribute should be a well formed BCP 47 language tag such as `en` or `en-GB`.",
    category: "document",
    severity: "minor",
    wcag: ["3.1.1"],
    applies: (ctx) => ctx.isDocument,
    run: (ctx) => {
      const html = ctx.html;
      if (!html) return [];
      const lang = attr(html, "lang");
      if (lang === undefined || lang.trim() === "") return [];
      if (LANG_PATTERN.test(lang.trim())) return [];
      return [
        finding(`The lang value "${lang}" is not a valid language tag.`, html, {
          suggestion:
            'Use an ISO 639 language code, optionally with a region, e.g. lang="en" or lang="en-GB".',
        }),
      ];
    },
  },
  {
    id: "page-title",
    title: "Page has no meaningful title",
    description:
      "Every page needs a unique, descriptive <title> so users can tell pages apart in tabs, history and screen reader output.",
    category: "document",
    severity: "serious",
    wcag: ["2.4.2"],
    applies: (ctx) => ctx.isDocument,
    run: (ctx) => {
      if (ctx.title && ctx.title.length > 0) return [];
      const titleElement = ctx.elements.find((el) => tagOf(el) === "title");
      return [
        finding("The document does not contain a non-empty <title>.", titleElement, {
          suggestion:
            "Add a concise, descriptive <title> inside <head>, e.g. <title>Checkout – ACME Store</title>.",
          codeExample: {
            before: "<head></head>",
            after: "<head>\n  <title>Checkout – ACME Store</title>\n</head>",
          },
          snippet: "<head>…</head>",
        }),
      ];
    },
  },
  {
    id: "meta-viewport-zoom",
    title: "Page blocks pinch zoom",
    description:
      "Disabling zoom prevents low-vision users from magnifying content. Avoid user-scalable=no and maximum-scale values below 2.",
    category: "document",
    severity: "serious",
    wcag: ["1.4.4"],
    run: (ctx) => {
      const findings: RuleFinding[] = [];
      const metas = ctx.elements.filter(
        (el) =>
          tagOf(el) === "meta" &&
          (attr(el, "name") ?? "").toLowerCase() === "viewport",
      );
      for (const meta of metas) {
        const content = (attr(meta, "content") ?? "").toLowerCase();
        if (!content) continue;
        const blocksZoom = /user-scalable\s*=\s*(no|0)/.test(content);
        const maxScale = content.match(/maximum-scale\s*=\s*([\d.]+)/);
        const restricted = maxScale ? Number.parseFloat(maxScale[1]) < 2 : false;
        if (blocksZoom || restricted) {
          findings.push(
            finding(
              `Viewport meta tag restricts zooming (${content.trim()}).`,
              meta,
              {
                suggestion:
                  "Remove user-scalable=no and keep maximum-scale at 5 or omit it so users can magnify content.",
                codeExample: {
                  before:
                    '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">',
                  after:
                    '<meta name="viewport" content="width=device-width, initial-scale=1">',
                },
              },
            ),
          );
        }
      }
      return findings;
    },
  },
  {
    id: "duplicate-id",
    title: "Duplicate id attribute",
    description:
      "ids must be unique. Duplicates break label associations, aria references and in-page links.",
    category: "document",
    severity: "serious",
    wcag: ["4.1.2"],
    run: (ctx) => {
      const findings: RuleFinding[] = [];
      for (const [id, elements] of ctx.byId) {
        if (elements.length < 2) continue;
        for (const element of elements.slice(1)) {
          findings.push(
            finding(`The id "${id}" is used ${elements.length} times.`, element, {
              suggestion:
                "Give every element a unique id and update any for/aria-* references to the correct element.",
            }),
          );
        }
      }
      return findings;
    },
  },
];
