import { AnalyzerWorkspace } from "@/components/analyzer/AnalyzerWorkspace";
import { Badge } from "@/components/ui/Badge";

const HIGHLIGHTS = [
  "Missing accessible names & form labels",
  "Heading hierarchy and ARIA misuse",
  "Keyboard navigation and focus order",
  "WCAG 2.2 references with suggested fixes",
];

export default function Home() {
  return (
    <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-8 max-w-3xl" aria-labelledby="page-title">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-indigo-200 bg-indigo-50 text-indigo-700">WCAG 2.2</Badge>
          <Badge>Rule-based</Badge>
          <Badge>Optional AI summary</Badge>
        </div>
        <h1
          id="page-title"
          className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
        >
          Find accessibility problems in your HTML
        </h1>
        <p className="mt-3 text-base text-slate-600">
          Paste a snippet or a full page. The checker reviews it against more than 40 rules, maps
          every finding to a WCAG success criterion, and shows the exact markup to change — with an
          optional plain-language summary from your own OpenAI-compatible model.
        </p>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {HIGHLIGHTS.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
              <span aria-hidden="true" className="mt-0.5 text-indigo-600">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <AnalyzerWorkspace />
    </main>
  );
}
