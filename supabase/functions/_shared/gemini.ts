// Minimal Gemini (Generative Language API) client shared by the text-only AI features.
// Structured output: `responseMimeType: application/json` + `responseJsonSchema` on
// models.generateContent. Never logs the key, the prompt or the reply.

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const TIMEOUT_MS = 10_000;

export type GeminiFailureCode = 'gemini_quota' | 'gemini_unavailable' | 'gemini_misconfigured' | 'invalid_ai_response';

/** `detail` is diagnostic only: an HTTP status and the provider's status word — never content. */
export class GeminiFailure extends Error {
  readonly code: GeminiFailureCode;
  readonly detail: { http?: number; provider_status?: string | null; reason?: string };
  constructor(code: GeminiFailureCode, detail: GeminiFailure['detail'] = {}) {
    super(code);
    this.code = code;
    this.detail = detail;
  }
}

export async function callGemini(input: {
  apiKey: string;
  model: string;
  systemInstruction: string;
  message: string;
  schema: object;
  maxOutputTokens?: number;
}): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${GEMINI_URL}/${encodeURIComponent(input.model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': input.apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: input.systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: input.message }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseJsonSchema: input.schema,
          temperature: 0.3,
          maxOutputTokens: input.maxOutputTokens ?? 900,
        },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    throw new GeminiFailure('gemini_unavailable', { reason: error instanceof Error ? error.name : 'fetch_failed' });
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    // Only the HTTP status and the provider's status word are kept — never the prompt or key.
    const detail = { http: response.status, provider_status: body?.error?.status ?? null };
    console.error('gemini request failed', detail);
    if (response.status === 429) throw new GeminiFailure('gemini_quota', detail);
    if (response.status < 500) throw new GeminiFailure('gemini_misconfigured', detail);
    throw new GeminiFailure('gemini_unavailable', detail);
  }

  const body = await response.json().catch(() => null);
  const parts: { text?: string }[] = body?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((part) => part.text ?? '').join('');
  if (!text.trim()) {
    throw new GeminiFailure('invalid_ai_response', { reason: body?.candidates?.[0]?.finishReason ?? 'empty' });
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new GeminiFailure('invalid_ai_response', { reason: 'not_json' });
  }
}
