import type { Matter, Preferences } from '@/features/assistant/api';

import { useLookFinderSession } from './session';

/**
 * This guest's Look Finder answers as Decision Assistant defaults, for the same category only.
 * Look Finder's "style" and "effort" map where the assistant has an equivalent; the rest is left
 * empty rather than guessed. Returns null when nothing maps. No note is ever copied.
 */
export function finderToAssistant(category: 'hair' | 'nails'): Preferences | null {
  const answers = useLookFinderSession.getState().submitted;
  if (!answers || answers.category !== category) return null;
  const matters: Matter[] = [];
  if (answers.style === 'natural') matters.push('natural');
  if (answers.style === 'bold') matters.push('bold');
  if (answers.effort === 'low') matters.push('easy');
  const preferences: Preferences = { occasion: answers.occasion, matters: matters.slice(0, 2), change: answers.change };
  return preferences.occasion || preferences.change || preferences.matters.length ? preferences : null;
}
