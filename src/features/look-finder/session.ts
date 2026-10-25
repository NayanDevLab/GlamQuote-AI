import 'expo-sqlite/localStorage/install';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { LfAnswers, LfCategory } from './catalogue';

type Draft = Omit<LfAnswers, 'category'> & { category: LfCategory | null };

type LookFinderSession = {
  tutorialSeen: boolean;
  /** This device's (guest's) last answers — kept so Back, Edit and Refine return prefilled. */
  answers: Draft;
  /** True once the user has submitted answers at least once (shows "previous answers kept"). */
  hasSubmitted: boolean;

  markTutorialSeen: () => void;
  setAnswer: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
  clearAnswers: () => void;
  markSubmitted: () => void;
};

export const EMPTY_ANSWERS: Draft = { category: null, occasion: null, style: null, change: null, effort: null };

export const useLookFinderSession = create<LookFinderSession>()(
  persist(
    (set) => ({
      tutorialSeen: false,
      answers: EMPTY_ANSWERS,
      hasSubmitted: false,

      markTutorialSeen: () => set({ tutorialSeen: true }),
      setAnswer: (key, value) => set((state) => ({ answers: { ...state.answers, [key]: value } })),
      clearAnswers: () => set({ answers: EMPTY_ANSWERS, hasSubmitted: false }),
      markSubmitted: () => set({ hasSubmitted: true }),
    }),
    { name: 'gq.lookFinder', version: 1, storage: createJSONStorage(() => localStorage) },
  ),
);

/** The answers as a request, or null until a category is chosen (the only required answer). */
export function submittedAnswers(draft: Draft): LfAnswers | null {
  return draft.category ? { ...draft, category: draft.category } : null;
}
