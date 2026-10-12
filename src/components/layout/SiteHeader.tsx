import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

/** Static site header with the product identity. */
export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 rounded-lg focus-visible:outline-offset-4">
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3v18M3 12h18" />
            </svg>
          </span>
          <span className="flex flex-col">
            <span className="text-sm font-semibold leading-tight text-slate-900">
              AI Accessibility Checker
            </span>
            <span className="text-xs text-slate-500">Static WCAG analysis + optional AI review</span>
          </span>
        </Link>
        <div className="hidden items-center gap-2 sm:flex">
          <Badge className="border-indigo-200 bg-indigo-50 text-indigo-700">WCAG 2.2</Badge>
          <Badge>40+ rules</Badge>
        </div>
      </div>
    </header>
  );
}
