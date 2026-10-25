import { EdgeFunctionError, invokeEdgeFunction } from '@/lib/supabase';

/**
 * Client for the `style-insight` Edge Function (Gemini Decision Assistant). The app sends only
 * the two preview ids and the user's answers; the server builds Gemini's text-only input from
 * its own records. No image, URL or photo data is ever part of this request.
 */

export type Occasion = 'everyday' | 'office' | 'party' | 'new';
export type Matter = 'natural' | 'easy' | 'bold' | 'versatile';
export type Change = 'subtle' | 'moderate' | 'dramatic';
/** 'diff' is answered from the style details alone — no Gemini request. */
export type Question = 'subtle' | 'diff' | 'effort' | 'consider';

export type Preferences = { occasion: Occasion | null; matters: Matter[]; change: Change | null };

export const OCCASIONS: { id: Occasion; label: string }[] = [
  { id: 'everyday', label: 'Everyday' },
  { id: 'office', label: 'Office' },
  { id: 'party', label: 'Party / Event' },
  { id: 'new', label: 'Trying Something New' },
];
export const MATTERS: { id: Matter; label: string }[] = [
  { id: 'easy', label: 'Easy to maintain' },
  { id: 'natural', label: 'Natural appearance' },
  { id: 'bold', label: 'Bold transformation' },
  { id: 'versatile', label: 'Versatility' },
];
export const CHANGES: { id: Change; label: string }[] = [
  { id: 'subtle', label: 'Subtle' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'dramatic', label: 'Dramatic' },
];
export const QUESTIONS: { id: Question; label: string }[] = [
  { id: 'subtle', label: 'Which option better matches my preference for a subtle look?' },
  { id: 'diff', label: 'What are the differences in these two styles?' },
  { id: 'effort', label: 'Which option may need more styling effort?' },
  { id: 'consider', label: 'What should I consider before deciding?' },
];

export const NOTE_MAX = 120;
/** Contact details, links or long numbers are never sent to AI (same check as the server). */
export const NOTE_PII = /(@|\d{5,}|https?:|www\.)/i;
export const GEMINI_TERMS_URL = 'https://ai.google.dev/gemini-api/terms';

/** Labels for the chosen answers, in display order. */
export function preferenceLabels(prefs: Preferences): string[] {
  return [
    ...(prefs.occasion ? [OCCASIONS.find((item) => item.id === prefs.occasion)!.label] : []),
    ...prefs.matters.map((id) => MATTERS.find((item) => item.id === id)!.label),
    ...(prefs.change ? [`${CHANGES.find((item) => item.id === prefs.change)!.label} change`] : []),
  ];
}

export type Insight = {
  look_a_reason: string;
  look_b_reason: string;
  tradeoffs: string[];
  suggested_look: 'A' | 'B' | null;
  suggestion_reason: string | null;
  limitations: string[];
};

export type Answer = { points: string[]; unknowns: string[]; leaning: 'A' | 'B' | null };

type Request = { lookA: string; lookB: string; preferences: Preferences; note: string | null };

export function requestInsight(request: Request): Promise<{ insight: Insight; cached: boolean }> {
  return invokeEdgeFunction('style-insight', { method: 'POST', body: request });
}

export function requestAnswer(
  request: Request & { question: Exclude<Question, 'diff'> },
): Promise<{ answer: Answer; cached: boolean }> {
  return invokeEdgeFunction('style-insight', { method: 'POST', body: request });
}

/** P5B-7 states (plus the not-comparable case, which sends the user back to Look Battle). */
export type AssistErrorKind = 'quota' | 'provider' | 'network' | 'invalid' | 'noMetadata' | 'unavailable';

export function assistErrorKind(error: unknown): AssistErrorKind {
  if (error instanceof EdgeFunctionError) {
    switch (error.code) {
      case 'insight_limit':
      case 'gemini_quota':
        return 'quota';
      case 'invalid_ai_response':
        return 'invalid';
      case 'no_metadata':
        return 'noMetadata';
      case 'gemini_unavailable':
        return 'provider';
      default:
        // Not configured, not comparable, not found or an expired guest session.
        return 'unavailable';
    }
  }
  if (error instanceof Error && (error.name === 'FunctionsFetchError' || error.message === 'Network request failed')) {
    return 'network';
  }
  return 'provider';
}
