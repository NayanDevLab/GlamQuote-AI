// Look Finder Edge Function — Gemini picks from GlamQuote's supported style catalogue (text only).
//
//   POST /look-finder  { category, occasion?, style?, change?, effort? }
//        -> { recommendations: [{ style_id, reason }], summary, limitations, cached }
//
// Only catalogue ids are returned; the app resolves names, images and the Studio to open from
// its own copy of the same catalogue — never from model text. Reuses the Decision Assistant's
// guest auth, daily cap, cache table and Gemini client.

import { callGemini, GeminiFailure, type GeminiFailureCode } from '../_shared/gemini.ts';
import { authenticate, fail, json, sha256Hex, type Caller } from '../_shared/http.ts';
import {
  buildLfMessage,
  candidatesFor,
  CATALOGUE_VERSION,
  LF_PROMPT_VERSION,
  LF_SYSTEM_INSTRUCTION,
  lfSchema,
  MIN_PICKS,
  parseAnswers,
  validateLfResult,
} from '../_shared/look-finder.ts';

const DEFAULT_DAILY_LIMIT = 15;
const CACHE_MS = 7 * 24 * 60 * 60 * 1000;

async function handle(req: Request, { db, userId }: Caller): Promise<Response> {
  const parsed = parseAnswers(await req.json().catch(() => null));
  if (!parsed.ok) return fail(400, 'invalid_request', parsed.message);
  const answers = parsed.answers;
  const candidates = candidatesFor(answers.category);
  if (candidates.length < MIN_PICKS) return fail(422, 'no_match', 'Not enough supported styles in this category.');

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  const model = Deno.env.get('GEMINI_MODEL');
  if (!apiKey || !model) {
    console.error('GEMINI_API_KEY or GEMINI_MODEL is not set for look-finder');
    return fail(503, 'gemini_not_configured', 'Look Finder isn’t set up yet.');
  }

  const fingerprint = await sha256Hex(
    new TextEncoder().encode(
      JSON.stringify({ answers, catalogue: CATALOGUE_VERSION, model, version: LF_PROMPT_VERSION }),
    ),
  );
  const { data: cached } = await db
    .from('style_insights')
    .select('response, created_at')
    .eq('user_id', userId)
    .eq('feature', 'look_finder')
    .eq('fingerprint', fingerprint)
    .eq('status', 'ok')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<{ response: Record<string, unknown>; created_at: string }>();
  if (cached && Date.now() - Date.parse(cached.created_at) < CACHE_MS)
    return json({ ...cached.response, cached: true });

  const limit = Number(Deno.env.get('LOOK_FINDER_DAILY_LIMIT')) || DEFAULT_DAILY_LIMIT;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await db
    .from('style_insights')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('feature', 'look_finder')
    .gte('created_at', since);
  if ((count ?? 0) >= limit) return fail(429, 'finder_limit', 'Look Finder is busy right now. Please try again later.');

  const record = (status: 'ok' | 'invalid' | 'error', response: unknown = null) =>
    db.from('style_insights').insert({ user_id: userId, feature: 'look_finder', fingerprint, status, response, model });

  try {
    const raw = await callGemini({
      apiKey,
      model,
      systemInstruction: LF_SYSTEM_INSTRUCTION,
      message: buildLfMessage(answers, candidates),
      schema: lfSchema(candidates),
      maxOutputTokens: 1200,
    });
    const checked = validateLfResult(raw, answers.category);
    if (!checked.ok) {
      console.error('look finder reply rejected', { reason: checked.reason });
      await record('invalid', { failure: 'validation', reason: checked.reason });
      return fail(502, 'invalid_ai_response', 'The AI reply didn’t pass our checks, so we’re not showing it.');
    }
    if (checked.dropped) console.error('look finder dropped picks', { dropped: checked.dropped });
    await record('ok', checked.result);
    return json({ ...checked.result, cached: false });
  } catch (error) {
    const code: GeminiFailureCode = error instanceof GeminiFailure ? error.code : 'gemini_unavailable';
    await record('error', { failure: code, ...(error instanceof GeminiFailure ? error.detail : {}) });
    if (code === 'gemini_quota') return fail(429, code, 'Look Finder is busy right now. Please try again later.');
    if (code === 'invalid_ai_response')
      return fail(502, code, 'The AI reply didn’t pass our checks, so we’re not showing it.');
    if (code === 'gemini_misconfigured') return fail(503, code, 'Look Finder isn’t available right now.');
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
