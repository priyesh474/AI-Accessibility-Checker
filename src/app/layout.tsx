import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export const metadata: Metadata = {
  title: "AI Accessibility Checker",
  description:
    "Paste HTML and get an instant WCAG 2.2 accessibility report: missing names and labels, heading and ARIA problems, keyboard traps, and suggested fixes — plus an optional AI-written summary.",
  applicationName: "AI Accessibility Checker",
  keywords: [
    "accessibility",
    "a11y",
    "WCAG",
    "ARIA",
    "screen reader",
    "keyboard navigation",
    "audit",
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-slate-50 text-slate-900 antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to content
        </a>
        <div className="flex min-h-dvh flex-col">
          <SiteHeader />
          {children}
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
