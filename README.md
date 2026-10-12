# AI Accessibility Checker

Paste an HTML snippet or a full page and get an instant accessibility report:
missing accessible names and form labels, heading-hierarchy and ARIA problems,
keyboard-navigation barriers, table and media issues, and low-contrast text.
Every finding is mapped to a **WCAG 2.2** success criterion and ships with a
concrete suggested fix, including before/after markup where it helps.

The rule engine runs entirely locally and deterministically. An **optional**
OpenAI-compatible model can add a plain-language, prioritised summary on top —
and the app degrades gracefully to a heuristic summary when no key is set.

## Features

- **62 rule-based checks** across 11 categories: document, images, forms,
  headings, ARIA, keyboard, links, structure, tables, media and contrast.
- **Accessible names & labels** — images/`alt`, icon fonts, inline SVG,
  `role="img"`, form controls, `aria-labelledby`/`aria-describedby` integrity.
- **Heading hierarchy & ARIA review** — skipped levels, multiple `h1`s, empty
  headings, invalid/abstract roles, misused `aria-hidden`, invalid ARIA values.
- **Keyboard navigation** — positive `tabindex`, focusable elements hidden from
  assistive tech, click handlers on non-interactive elements, focus traps.
- **WCAG explanations** — each issue links to the relevant "Understanding"
  document and is grouped by criterion.
- **Report with suggested fixes** — severity score, filters, per-issue diff,
  and Markdown/JSON export.
- **Optional AI summary** — prioritised, plain-language advice from any
  OpenAI-compatible endpoint, with a deterministic fallback.

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. Pick one of the built-in sample snippets, or paste
your own markup, then run the checker.

To build for production:

```bash
npm run build
npm start
```

## Enabling the optional AI summary

The checker works with no configuration. To let a model write the executive
summary and prioritised fix list, create a `.env.local` file:

```bash
cp .env.example .env.local
```

and set at least an API key:

| Variable          | Required | Default                     | Purpose                                                        |
| ----------------- | -------- | --------------------------- | -------------------------------------------------------------- |
| `OPENAI_API_KEY`  | yes      | –                           | Key for your OpenAI-compatible endpoint. Enables AI features.  |
| `OPENAI_BASE_URL` | no       | `https://api.openai.com/v1` | Base URL (OpenRouter, Azure gateway, Ollama, LM Studio, …).    |
| `OPENAI_MODEL`    | no       | `gpt-4o-mini`               | Chat model name.                                               |
| `AI_TIMEOUT_MS`   | no       | `30000`                     | Request timeout for the model call.                            |

`AI_API_KEY`, `AI_BASE_URL` and `AI_MODEL` are accepted as aliases. When the
request fails, the report is still returned with the rule-based summary and an
`ai.error` note, so a network problem never blocks an audit.

## API

The UI is a thin client over one route.

### `GET /api/analyze`

Capability probe used by the UI to decide whether to offer the AI switch.

```json
{ "engineVersion": "…", "aiEnabled": false }
```

### `POST /api/analyze`

```json
{ "html": "<img src=\"logo.png\">", "options": { "useAi": true } }
```

Returns an `AnalysisReport`:

```ts
interface AnalysisReport {
  id: string;
  createdAt: string;
  input: { bytes: number; lines: number; elements: number; isDocument: boolean };
  score: { score: number; grade: "A" | "B" | "C" | "D" | "F"; label: string };
  summary: { critical: number; serious: number; moderate: number; minor: number; total: number };
  categories: { category: string; label: string; count: number; critical: number }[];
  issues: Issue[];
  passed: string[];
  notices: string[];
  skipped: { ruleId: string; title: string; reason: string }[];
  wcag: WcagCriterion[];
  ai: AiInsights;
  engine: { name: string; version: string; rulesRun: number; durationMs: number };
}
```

There is no built-in size limit on the submitted markup and every detected issue
is returned. Very large documents take proportionally longer to analyse.

## Project structure

```
src/
  app/
    api/analyze/route.ts     # GET capability probe + POST analysis endpoint
    layout.tsx               # shell, skip link, header/footer
    page.tsx                 # hero + analyzer workspace
  components/
    analyzer/                # input panel, report view, issue cards, filters
    layout/                  # site header and footer
    ui/                      # Card, Button, Badge, ScoreRing, CodeBlock, …
  lib/
    ai/                      # optional OpenAI-compatible client + prompts
    analyzer/                # rule engine
      rules/                 # rule modules grouped by category
      dom.ts                 # parsing + accessible-name helpers
      aria-data.ts, wcag.ts  # knowledge bases
      scoring.ts, summary.ts # score + narrative
      analyze.ts, index.ts   # orchestrator + public surface
    report/markdown.ts       # Markdown export
    utils/cn.ts              # class-name helper + download util
  types/analysis.ts          # shared domain contract
```

## How scoring works

Each issue removes points weighted by severity (`critical` 10, `serious` 5,
`moderate` 2, `minor` 1). The penalty is normalised by the square root of the
element count so larger pages are not penalised for their size, then mapped
through a bounded exponential curve to a 0–100 score and an A–F grade.

## Limitations

Automated checks find roughly **a third** of real accessibility problems. They
cannot judge intent, reading order in a screen reader, or the quality of alt
text. Always follow an automated pass with keyboard-only testing and a screen
reader review such as NVDA, VoiceOver or Narrator.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
[`node-html-parser`](https://github.com/taoqf/node-html-parser). The only
runtime dependency outside the framework is the HTML parser; the AI client is a
plain `fetch`.
