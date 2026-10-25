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

  markTutorialSeen: () => void;
  setPair: (pair: [string, string]) => void;
  setPreferences: (patch: Partial<Preferences>) => void;
  toggleMatter: (matter: Matter) => void;
  clearPreferences: () => void;
  setNote: (note: string) => void;
  setShareNote: (share: boolean) => void;
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

      markTutorialSeen: () => set({ tutorialSeen: true }),
      setPair: (pair) => set({ pair }),
      setPreferences: (patch) => set((state) => ({ preferences: { ...state.preferences, ...patch } })),
      toggleMatter: (matter) =>
        set((state) => {
          const current = state.preferences.matters;
          const matters = current.includes(matter)
            ? current.filter((item) => item !== matter)
            : current.length < 2
              ? [...current, matter]
              : current;
          return { preferences: { ...state.preferences, matters } };
        }),
      clearPreferences: () => set({ preferences: EMPTY_PREFERENCES }),
      setNote: (note) => set({ note }),
      setShareNote: (shareNote) => set({ shareNote }),
    }),
    { name: 'gq.assistant', version: 1, storage: createJSONStorage(() => localStorage) },
  ),
);
