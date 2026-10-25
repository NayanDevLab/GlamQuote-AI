import 'expo-sqlite/localStorage/install';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Matter, Preferences } from './api';

type AssistantSession = {
  tutorialSeen: boolean;
  /** Look A and Look B (task ids) the assistant is working on, set when it is opened. */
  pair: [string, string] | null;
  /** The user's own answers, kept across Back and Refine. All optional. */
  preferences: Preferences;
  note: string;
  /** The note is sent to AI only when the user turns this on. */
  shareNote: boolean;
  /** Set when the answers were prefilled from Look Finder (shown with a Clear action). */
  prefilledFromFinder: boolean;
  /** The user cleared a prefill; never prefill again. */
  prefillDismissed: boolean;

  markTutorialSeen: () => void;
  setPair: (pair: [string, string]) => void;
  setPreferences: (patch: Partial<Preferences>) => void;
  toggleMatter: (matter: Matter) => void;
  clearPreferences: () => void;
  setNote: (note: string) => void;
  setShareNote: (share: boolean) => void;
  prefillFromFinder: (preferences: Preferences) => void;
  dismissPrefill: () => void;
};

export const EMPTY_PREFERENCES: Preferences = { occasion: null, matters: [], change: null };

export const useAssistantSession = create<AssistantSession>()(
  persist(
    (set) => ({
      tutorialSeen: false,
      pair: null,
      preferences: EMPTY_PREFERENCES,
      note: '',
      shareNote: false,
      prefilledFromFinder: false,
      prefillDismissed: false,

      markTutorialSeen: () => set({ tutorialSeen: true }),
      setPair: (pair) => set({ pair }),
      // Editing an answer makes it the user's own, so the Look Finder banner goes away.
      setPreferences: (patch) =>
        set((state) => ({ preferences: { ...state.preferences, ...patch }, prefilledFromFinder: false })),
      toggleMatter: (matter) =>
        set((state) => {
          const current = state.preferences.matters;
          const matters = current.includes(matter)
            ? current.filter((item) => item !== matter)
            : current.length < 2
              ? [...current, matter]
              : current;
          return { preferences: { ...state.preferences, matters }, prefilledFromFinder: false };
        }),
      clearPreferences: () => set({ preferences: EMPTY_PREFERENCES, prefilledFromFinder: false }),
      setNote: (note) => set({ note }),
      setShareNote: (shareNote) => set({ shareNote }),
      // Only into empty answers: anything the user already chose is never overwritten.
      prefillFromFinder: (preferences) =>
        set((state) => {
          const empty = !state.preferences.occasion && !state.preferences.change && state.preferences.matters.length === 0;
          return empty && !state.prefillDismissed ? { preferences, prefilledFromFinder: true } : {};
        }),
      dismissPrefill: () => set({ preferences: EMPTY_PREFERENCES, prefilledFromFinder: false, prefillDismissed: true }),
    }),
    { name: 'gq.assistant', version: 1, storage: createJSONStorage(() => localStorage) },
  ),
);
