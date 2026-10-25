// Style Insight Edge Function — Gemini Decision Assistant (text only).
//
//   POST /style-insight  { lookA, lookB, preferences, note?, question? }
//        -> { insight }   (no question)
//        -> { answer }    (question: 'subtle' | 'effort' | 'consider')
//
// The app sends two of the guest's own preview (task) ids and the answers it chose. The server
// verifies ownership, success, same category and same source photo, then builds Gemini's input
// from its own stored settings. Gemini never receives images, URLs, ids or hashes. Its reply is
// schema- and content-checked before it is returned; failures are never shown as advice.

import { callGemini, GeminiFailure, type GeminiFailureCode } from '../_shared/gemini.ts';
import { authenticate, fail, json, sha256Hex, type Caller } from '../_shared/http.ts';
import {
  allowedHexes,
  ANSWER_SCHEMA,
  buildUserMessage,
  categoryOf,
  hasComparableMetadata,
  INSIGHT_SCHEMA,
  lookFacts,
  parseInput,
  PROMPT_VERSION,
  SYSTEM_INSTRUCTION,
  validateAnswer,
  validateInsight,
  type StoredLook,
} from '../_shared/style-insight.ts';

const DEFAULT_DAILY_LIMIT = 15;
// Cached replies stay valid for a week; any changed answer or note is a different fingerprint.
const CACHE_MS = 7 * 24 * 60 * 60 * 1000;

type TaskRow = {
  id: string;
  kind: StoredLook['kind'];
  status: string;
  effect_type: string | null;
  config: unknown;
  source_photo_hash: string | null;
};

/** Loads one of the caller's own finished previews, with its saved title if it was saved. */
async function loadLook(
  { db, userId }: Caller,
  taskId: string,
): Promise<(TaskRow & { saved_title: string | null }) | null> {
  const { data: task } = await db
    .from('generation_tasks')
    .select('id, kind, status, effect_type, config, source_photo_hash')
    .eq('id', taskId)
    .eq('user_id', userId)
    .maybeSingle<TaskRow>();
  if (!task || task.status !== 'success') return null;
  const { data: saved } = await db
    .from('saved_looks')
    .select('title')
    .eq('task_id', taskId)
    .eq('user_id', userId)
    .maybeSingle<{ title: string }>();
  return { ...task, saved_title: saved?.title ?? null };
}

async function handle(req: Request, caller: Caller): Promise<Response> {
  const parsed = parseInput(await req.json().catch(() => null));
  if (!parsed.ok) return fail(400, 'invalid_request', parsed.message);
  const input = parsed.input;

  const [a, b] = await Promise.all([loadLook(caller, input.lookA), loadLook(caller, input.lookB)]);
  // Another guest's preview, an unfinished one or a made-up id all look the same: not found.
  if (!a || !b) return fail(404, 'not_found', 'One of these previews isn’t available.');
  if (
    categoryOf(a.kind) !== categoryOf(b.kind) ||
    !a.source_photo_hash ||
    a.source_photo_hash !== b.source_photo_hash
  ) {
    return fail(422, 'not_comparable', 'These two previews can’t be compared.');
  }
  if (!hasComparableMetadata(a, b)) {
    return fail(422, 'no_metadata', 'These looks don’t have enough shared style details for an AI insight.');
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  const model = Deno.env.get('GEMINI_MODEL');
  if (!apiKey || !model) {
    console.error('GEMINI_API_KEY or GEMINI_MODEL is not set for style-insight');
    return fail(503, 'gemini_not_configured', 'Style insights aren’t set up yet.');
  }

  const factsA = lookFacts(a);
  const factsB = lookFacts(b);
  // Order, looks, settings, answers, shared note, question, model and prompt version all change it.
  const fingerprint = await sha256Hex(
    new TextEncoder().encode(
      JSON.stringify({
        a: a.id,
        b: b.id,
        factsA,
        factsB,
        prefs: input.preferences,
        note: input.note,
        question: input.question,
        model,
        version: PROMPT_VERSION,
      }),
    ),
  );

  const { db, userId } = caller;
  const { data: cached } = await db
    .from('style_insights')
    .select('response, created_at')
    .eq('user_id', userId)
    .eq('fingerprint', fingerprint)
    .eq('status', 'ok')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<{ response: Record<string, unknown>; created_at: string }>();
  if (cached && Date.now() - Date.parse(cached.created_at) < CACHE_MS) {
    return json({ ...cached.response, cached: true });
  }

  // Per-guest daily cap on real Gemini calls (cache hits don't count).
  const limit = Number(Deno.env.get('INSIGHT_DAILY_LIMIT')) || DEFAULT_DAILY_LIMIT;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await db
    .from('style_insights')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('feature', 'decision')
    .gte('created_at', since);
  if ((count ?? 0) >= limit)
    return fail(429, 'insight_limit', 'You’ve used today’s style insights. They refresh tomorrow.');

  const record = (status: 'ok' | 'invalid' | 'error', response: unknown = null) =>
    db.from('style_insights').insert({ user_id: userId, feature: 'decision', fingerprint, status, response, model });

  try {
    const raw = await callGemini({
      apiKey,
      model,
      systemInstruction: SYSTEM_INSTRUCTION,
      message: buildUserMessage(factsA, factsB, input),
      schema: input.question ? ANSWER_SCHEMA : INSIGHT_SCHEMA,
    });
    const hexes = allowedHexes(factsA, factsB);
    const checked = input.question ? validateAnswer(raw, hexes) : validateInsight(raw, hexes);
    if (!checked.ok) {
      console.error('style insight rejected', { reason: checked.reason });
      await record('invalid', { failure: 'validation', reason: checked.reason });
      return fail(502, 'invalid_ai_response', 'The AI reply didn’t pass our checks, so we’re not showing it.');
    }
    const payload = 'insight' in checked ? { insight: checked.insight } : { answer: checked.answer };
    await record('ok', payload);
    return json({ ...payload, cached: false });
  } catch (error) {
    const code: GeminiFailureCode = error instanceof GeminiFailure ? error.code : 'gemini_unavailable';
    // Diagnostic only (failure code, HTTP status, provider status word) — no prompt or reply.
    await record('error', { failure: code, ...(error instanceof GeminiFailure ? error.detail : {}) });
    if (code === 'gemini_quota') return fail(429, code, 'You’ve used today’s style insights. They refresh tomorrow.');
    if (code === 'invalid_ai_response')
      return fail(502, code, 'The AI reply didn’t pass our checks, so we’re not showing it.');
    if (code === 'gemini_misconfigured') return fail(503, code, 'Style insights aren’t available right now.');
    return fail(503, code, 'The AI service didn’t respond this time.');
  }
}

export default {
  fetch: async (req: Request): Promise<Response> => {
    const caller = await authenticate(req);
    if (caller instanceof Response) return caller;
    if (req.method !== 'POST') return fail(405, 'method_not_allowed', 'Use POST.');
    return handle(req, caller);
  },
};
