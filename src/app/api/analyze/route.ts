import { NextResponse } from "next/server";
import { enrichReportWithAi, isAiConfigured } from "@/lib/ai/enrich";
import { ENGINE_VERSION, analyzeHtml } from "@/lib/analyzer";
import type { AnalyzeRequest } from "@/types/analysis";

/** Report engine capabilities so the UI can show the right AI state. */
export async function GET() {
  return NextResponse.json({
    engineVersion: ENGINE_VERSION,
    aiEnabled: isAiConfigured(),
  });
}

export async function POST(request: Request) {
  let body: AnalyzeRequest;
  try {
    body = (await request.json()) as AnalyzeRequest;
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (typeof body?.html !== "string" || body.html.trim() === "") {
    return NextResponse.json(
      { error: "Provide an `html` string containing the markup to analyse." },
      { status: 400 },
    );
  }

  try {
    const report = analyzeHtml(body.html);
    const useAi = body.options?.useAi !== false && isAiConfigured();
    const withAi = useAi ? await enrichReportWithAi(report) : report;
    return NextResponse.json(withAi);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Analysis failed while processing the markup.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
