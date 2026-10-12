"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AnalysisReport } from "@/types/analysis";
import { Card, CardBody } from "@/components/ui/Card";
import { SAMPLES } from "@/lib/analyzer/samples";
import { InputPanel } from "./InputPanel";
import { ReportPanel } from "./ReportPanel";

interface EngineConfig {
  engineVersion: string;
  aiEnabled: boolean;
}

interface AnalyzeResponse extends Partial<AnalysisReport> {
  error?: string;
  details?: string;
}

const DEFAULT_SAMPLE = SAMPLES[0]?.html ?? "";

/**
 * Owns the client-side analysis flow: the draft markup, the request lifecycle,
 * and the resulting report. The rule engine always runs; the AI summary is an
 * optional add-on that only appears when a provider is configured.
 */
export function AnalyzerWorkspace() {
  const [html, setHtml] = useState(DEFAULT_SAMPLE);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useAi, setUseAi] = useState(false);
  const [config, setConfig] = useState<EngineConfig | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  // Discover whether the server has a model configured before offering the AI switch.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/analyze")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: EngineConfig | null) => {
        if (!cancelled && data) {
          setConfig(data);
          setUseAi(data.aiEnabled);
        }
      })
      .catch(() => {
        /* The rule engine still works without this capability probe. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (html.trim().length === 0 || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html, options: { useAi } }),
      });

      const data = (await response.json()) as AnalyzeResponse;

      if (!response.ok || !data.id) {
        throw new Error(data.error ?? data.details ?? "The analysis could not be completed.");
      }

      setReport(data as AnalysisReport);
      // Move focus to the results so keyboard and screen-reader users land on them.
      window.requestAnimationFrame(() => {
        resultsRef.current?.focus();
      });
    } catch (cause) {
      setReport(null);
      setError(cause instanceof Error ? cause.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [html, loading, useAi]);

  const handleClear = useCallback(() => {
    setHtml("");
    setReport(null);
    setError(null);
  }, []);

  const handleLoadSample = useCallback((id: string) => {
    const sample = SAMPLES.find((item) => item.id === id);
    if (sample) {
      setHtml(sample.html);
      setReport(null);
      setError(null);
    }
  }, []);

  const aiConfigured = config?.aiEnabled ?? false;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start">
      <InputPanel
        html={html}
        loading={loading}
        aiConfigured={aiConfigured}
        useAi={useAi}
        onHtmlChange={setHtml}
        onUseAiChange={setUseAi}
        onAnalyze={handleAnalyze}
        onClear={handleClear}
        onLoadSample={handleLoadSample}
      />

      {/* Live region so assistive tech announces loading and error updates. */}
      <div role="status" aria-live="polite" className="sr-only">
        {loading ? "Analysing accessibility…" : error ? `Error: ${error}` : report ? "Report ready." : ""}
      </div>

      <div ref={resultsRef} tabIndex={-1} className="space-y-4 focus:outline-none">
        {error ? (
          <Card role="alert" className="border-rose-200 bg-rose-50">
            <CardBody>
              <h2 className="text-sm font-semibold text-rose-800">Analysis failed</h2>
              <p className="mt-1 text-sm text-rose-700">{error}</p>
            </CardBody>
          </Card>
        ) : null}

        {loading ? <LoadingState /> : null}

        {!loading && !error && report ? <ReportPanel report={report} /> : null}

        {!loading && !error && !report ? (
          <EmptyState engineVersion={config?.engineVersion} />
        ) : null}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <Card aria-busy="true">
      <CardBody className="flex items-center gap-3 text-sm text-slate-600">
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600 motion-reduce:animate-none"
        />
        Running accessibility checks…
      </CardBody>
    </Card>
  );
}

function EmptyState({ engineVersion }: { engineVersion?: string }) {
  return (
    <Card>
      <CardBody className="space-y-3 py-10 text-center">
        <h2 className="text-base font-semibold text-slate-900">No report yet</h2>
        <p className="mx-auto max-w-md text-sm text-slate-600">
          Paste your markup on the left and run the checker. Every check maps to a WCAG 2.2
          success criterion and includes a suggested fix you can copy straight into your code.
        </p>
        {engineVersion ? (
          <p className="text-xs text-slate-400">Rule engine {engineVersion}</p>
        ) : null}
      </CardBody>
    </Card>
  );
}
