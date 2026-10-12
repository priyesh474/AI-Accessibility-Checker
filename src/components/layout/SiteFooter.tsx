/** Static footer with a reminder about the limits of automated testing. */
export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 text-sm text-slate-500 sm:px-6 lg:px-8">
        <p>
          Automated checks find roughly a third of accessibility problems. Always follow up with
          keyboard-only testing and a screen reader pass.
        </p>
      </div>
    </footer>
  );
}
