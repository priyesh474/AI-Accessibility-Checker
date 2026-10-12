import type { AiPriority, AnalysisReport } from "@/types/analysis";
import { buildMessages } from "./prompts";
import {
  chatComplete,
  getAiConfig,
  isAiConfigured,
  parseJsonObject,
  type AiConfig,
} from "./provider";

export { isAiConfigured };

function coercePriorities(value: unknown): AiPriority[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      title: String(item.title ?? "").trim(),
      why: String(item.why ?? "").trim(),
      how: String(item.how ?? "").trim(),
      ruleIds: Array.isArray(item.ruleIds)
        ? item.ruleIds.map((id) => String(id)).filter(Boolean)
        : undefined,
    }))
    .filter((priority) => priority.title.length > 0 && priority.how.length > 0)
    .slice(0, 5);
}

/**
 * Optionally replace the heuristic narrative with a model-written one.
 *
 * Returns the original report unchanged when AI is not configured, and a report
 * carrying an `ai.error` when a configured provider fails, so a network problem
 * never breaks analysis.
 */
export async function enrichReportWithAi(
  report: AnalysisReport,
  config: AiConfig | null = getAiConfig(),
): Promise<AnalysisReport> {
  if (!config) return report;

  try {
    const raw = await chatComplete(buildMessages(report), config);
    const parsed = parseJsonObject(raw) as { summary?: unknown; priorities?: unknown };
    const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : "";
    const priorities = coercePriorities(parsed.priorities);
    if (!summary) throw new Error("AI response did not include a summary");

    return {
      ...report,
      ai: {
        enabled: true,
        provider: "openai-compatible",
        model: config.model,
        summary,
        priorities: priorities.length > 0 ? priorities : report.ai.priorities,
      },
    };
  } catch (error) {
    return {
      ...report,
      ai: {
        ...report.ai,
        error: error instanceof Error ? error.message : "AI enrichment failed",
      },
    };
  }
}
