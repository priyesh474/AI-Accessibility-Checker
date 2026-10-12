/**
 * Minimal OpenAI-compatible chat client.
 *
 * The checker works offline with its rule engine, but if an API key is present
 * it can add a model-written summary and prioritised fix list. No SDK is
 * required: a plain `fetch` against `/chat/completions` keeps the dependency
 * footprint small and lets the app talk to OpenAI, Azure-compatible gateways,
 * OpenRouter, Ollama, and so on.
 */

export interface AiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  /** Request timeout in milliseconds. */
  timeoutMs: number;
}

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_TIMEOUT_MS = 30_000;

function firstDefined(...values: (string | undefined)[]): string | undefined {
  return values.find((value) => value !== undefined && value.trim() !== "");
}

/** Read configuration from the environment, or return null when unset. */
export function getAiConfig(): AiConfig | null {
  const apiKey = firstDefined(process.env.OPENAI_API_KEY, process.env.AI_API_KEY);
  if (!apiKey) return null;

  const baseUrl =
    firstDefined(process.env.OPENAI_BASE_URL, process.env.AI_BASE_URL) ?? DEFAULT_BASE_URL;
  const model =
    firstDefined(process.env.OPENAI_MODEL, process.env.AI_MODEL) ?? DEFAULT_MODEL;
  const timeout = Number(firstDefined(process.env.AI_TIMEOUT_MS));
  const timeoutMs = Number.isFinite(timeout) && timeout > 0 ? timeout : DEFAULT_TIMEOUT_MS;

  return { apiKey, baseUrl, model, timeoutMs };
}

export function isAiConfigured(): boolean {
  return getAiConfig() !== null;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Call a chat completion endpoint and return the raw assistant text. */
export async function chatComplete(
  messages: ChatMessage[],
  config: AiConfig,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(`${config.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `AI provider responded ${response.status}${detail ? `: ${detail.slice(0, 300)}` : ""}`,
      );
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: unknown } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.trim() === "") {
      throw new Error("AI provider returned an empty response");
    }
    return content;
  } finally {
    clearTimeout(timer);
  }
}

/** Extract a JSON object from a model response that may include code fences. */
export function parseJsonObject(raw: string): unknown {
  const trimmed = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("AI response was not valid JSON");
  }
}
