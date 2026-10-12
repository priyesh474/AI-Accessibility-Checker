"use client";

import { useId } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { SAMPLES } from "@/lib/analyzer/samples";
import { cn } from "@/lib/utils/cn";

interface InputPanelProps {
  html: string;
  loading: boolean;
  aiConfigured: boolean;
  useAi: boolean;
  onHtmlChange: (value: string) => void;
  onUseAiChange: (value: boolean) => void;
  onAnalyze: () => void;
  onClear: () => void;
  onLoadSample: (id: string) => void;
}

/** Left-hand panel: the HTML editor, sample picker and run controls. */
export function InputPanel({
  html,
  loading,
  aiConfigured,
  useAi,
  onHtmlChange,
  onUseAiChange,
  onAnalyze,
  onClear,
  onLoadSample,
}: InputPanelProps) {
  const textareaId = useId();
  const aiId = useId();
  const charCount = html.length;
  const canAnalyze = html.trim().length > 0 && !loading;

  return (
    <Card className="lg:sticky lg:top-6">
      <CardHeader>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">HTML input</h2>
          <p className="text-xs text-slate-500">Paste a snippet or a whole page</p>
        </div>
        <span className="text-xs tabular-nums text-slate-500">
          {charCount.toLocaleString()} chars
        </span>
      </CardHeader>

      <CardBody className="space-y-4">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (canAnalyze) onAnalyze();
          }}
        >
          <div className="space-y-1.5">
            <label htmlFor={textareaId} className="block text-sm font-medium text-slate-700">
              Markup to analyse
            </label>
            <textarea
              id={textareaId}
              value={html}
              onChange={(event) => onHtmlChange(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && canAnalyze) {
                  event.preventDefault();
                  onAnalyze();
                }
              }}
              spellCheck={false}
              rows={16}
              placeholder={'<button>\n  <svg aria-hidden="true">…</svg>\n</button>'}
              className="w-full resize-y rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-900 placeholder:text-slate-400 focus:bg-white"
              aria-describedby={`${textareaId}-hint`}
            />
            <p id={`${textareaId}-hint`} className="text-xs text-slate-500">
              Press{" "}
              <kbd className="rounded border border-slate-300 bg-slate-100 px-1 py-0.5 font-mono text-[10px]">
                Ctrl/⌘
              </kbd>{" "}
              +{" "}
              <kbd className="rounded border border-slate-300 bg-slate-100 px-1 py-0.5 font-mono text-[10px]">
                Enter
              </kbd>{" "}
              to run the check.
            </p>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Load a sample
            </legend>
            <div className="flex flex-wrap gap-2">
              {SAMPLES.map((sample) => (
                <Button
                  key={sample.id}
                  size="sm"
                  variant="secondary"
                  onClick={() => onLoadSample(sample.id)}
                >
                  {sample.label}
                </Button>
              ))}
            </div>
          </fieldset>

          <div
            className={cn(
              "rounded-lg border p-3",
              aiConfigured ? "border-indigo-200 bg-indigo-50/60" : "border-slate-200 bg-slate-50",
            )}
          >
            <div className="flex items-start gap-3">
              <input
                id={aiId}
                type="checkbox"
                checked={useAi && aiConfigured}
                disabled={!aiConfigured}
                onChange={(event) => onUseAiChange(event.target.checked)}
                className="mt-0.5 size-4 rounded border-slate-300 text-indigo-600 disabled:opacity-50"
              />
              <div>
                <label htmlFor={aiId} className="text-sm font-medium text-slate-800">
                  Add an AI-written summary
                </label>
                <p className="text-xs text-slate-500">
                  {aiConfigured
                    ? "Sends a condensed report to your configured OpenAI-compatible model for a prioritised explanation."
                    : "Set OPENAI_API_KEY (and optionally OPENAI_BASE_URL / OPENAI_MODEL) to enable a live model. The rule-based summary is always shown."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={!canAnalyze} className="flex-1">
              {loading ? "Analysing…" : "Analyse accessibility"}
            </Button>
            <Button variant="ghost" onClick={onClear} disabled={loading || charCount === 0}>
              Clear
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
