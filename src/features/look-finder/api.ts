import { useQuery } from '@tanstack/react-query';

import { EdgeFunctionError, invokeEdgeFunction } from '@/lib/supabase';

import { findStyle, type CatalogueStyle, type LfAnswers } from './catalogue';

/**
 * Client for the `look-finder` Edge Function. The app sends only the user's answers; the server
 * sends Gemini only those answers and the allowlisted catalogue, and returns catalogue ids.
 */

type LfResponse = {
  recommendations: { style_id: string; reason: string }[];
  summary: string;
  limitations: string[];
  cached: boolean;
};

export type Pick = { style: CatalogueStyle; reason: string };

export const OCCASION_OPTIONS = [
  { id: 'everyday', label: 'Everyday' },
  { id: 'office', label: 'Office' },
  { id: 'party', label: 'Party / Event' },
  { id: 'new', label: 'Trying Something New' },
] as const;
export const STYLE_OPTIONS = [
  { id: 'natural', label: 'Natural' },
  { id: 'classic', label: 'Classic' },
  { id: 'bold', label: 'Bold' },
  { id: 'trendy', label: 'Trendy' },
] as const;
export const CHANGE_OPTIONS = [
  { id: 'subtle', label: 'Subtle' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'dramatic', label: 'Dramatic' },
] as const;
export const EFFORT_OPTIONS = [
  { id: 'low', label: 'Low maintenance' },
  { id: 'flexible', label: 'Flexible' },
  { id: 'none', label: 'No preference' },
] as const;

/** Chips for the chosen answers, in question order. */
export function answerLabels(answers: LfAnswers): string[] {
  const find = (list: readonly { id: string; label: string }[], id: string | null) =>
    list.find((item) => item.id === id)?.label;
  return [
    answers.category === 'hair' ? 'Hair' : 'Nails',
    find(OCCASION_OPTIONS, answers.occasion),
    find(STYLE_OPTIONS, answers.style),
    answers.change ? `${find(CHANGE_OPTIONS, answers.change)} change` : undefined,
    find(EFFORT_OPTIONS, answers.effort),
  ].filter((label): label is string => Boolean(label));
}

/**
 * Gemini picks for these answers. Ids are re-checked against this app's copy of the catalogue
 * (same file as the server's), so a card's name, image and Studio always come from the catalogue.
 */
export function useLookFinderPicks(answers: LfAnswers | null) {
  return useQuery({
    queryKey: ['look-finder', answers],
    queryFn: async () => {
      const response = await invokeEdgeFunction<LfResponse>('look-finder', { method: 'POST', body: answers! });
      const seen = new Set<string>();
      const picks: Pick[] = [];
      for (const item of response.recommendations) {
        const style = findStyle(item.style_id);
        if (!style || style.category !== answers!.category || seen.has(style.id)) continue;
        seen.add(style.id);
        picks.push({ style, reason: item.reason });
      }
      return { picks, summary: response.summary, limitations: response.limitations };
    },
    enabled: Boolean(answers),
    // One request per Find My Styles tap: no automatic retry or refetch, even after reconnecting.
    retry: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    gcTime: 30 * 60_000,
  });
}

export type FinderErrorKind = 'error' | 'offline' | 'quota' | 'nomatch';

export function finderErrorKind(error: unknown): FinderErrorKind {
  if (error instanceof EdgeFunctionError) {
    if (error.code === 'finder_limit' || error.code === 'gemini_quota') return 'quota';
    if (error.code === 'no_match') return 'nomatch';
    return 'error';
  }
  if (error instanceof Error && (error.name === 'FunctionsFetchError' || error.message === 'Network request failed')) {
    return 'offline';
  }
  return 'error';
}
