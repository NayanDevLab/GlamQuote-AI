import 'expo-sqlite/localStorage/install';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { BattleCategory } from './looks';

/** The user's choice (design spec: favoriteLookId, comparedWithLookId, category, note, decidedAt). */
export type BattleDecision = {
  favoriteKey: string;
  comparedWithKey: string;
  category: BattleCategory;
  note: string;
  decidedAt: number;
};

type BattleSession = {
  tutorialSeen: boolean;
  category: BattleCategory;
  /** Look A and Look B per category (task ids), kept when navigating back. */
  picks: Record<BattleCategory, string[]>;
  /** Kept on this device only; saved to the Lookbook only by an explicit Save. */
  decision: BattleDecision | null;

  markTutorialSeen: () => void;
  setCategory: (category: BattleCategory) => void;
  /** Adds a look as A then B; tapping a picked look removes it. */
  togglePick: (category: BattleCategory, key: string) => void;
  setPicks: (category: BattleCategory, keys: string[]) => void;
  swap: (category: BattleCategory) => void;
  decide: (decision: Omit<BattleDecision, 'decidedAt' | 'note'> & { note?: string }) => void;
  setNote: (note: string) => void;
};

export const useBattleSession = create<BattleSession>()(
  persist(
    (set, get) => ({
      tutorialSeen: false,
      category: 'nails',
      picks: { nails: [], hair: [] },
      decision: null,

      markTutorialSeen: () => set({ tutorialSeen: true }),
      setCategory: (category) => set({ category }),
      togglePick: (category, key) =>
        set((state) => {
          const current = state.picks[category];
          const next = current.includes(key)
            ? current.filter((item) => item !== key)
            : current.length < 2
              ? [...current, key]
              : current;
          return { picks: { ...state.picks, [category]: next } };
        }),
      setPicks: (category, keys) => set((state) => ({ picks: { ...state.picks, [category]: keys.slice(0, 2) } })),
      swap: (category) =>
        set((state) => ({ picks: { ...state.picks, [category]: [...state.picks[category]].reverse() } })),
      decide: ({ note, ...decision }) => {
        const previous = get().decision;
        // Choosing the same favorite again keeps the note the user already wrote.
        const keepNote = previous && previous.favoriteKey === decision.favoriteKey ? previous.note : '';
        set({ decision: { ...decision, note: note ?? keepNote, decidedAt: Date.now() } });
      },
      setNote: (note) => {
        const { decision } = get();
        if (decision) set({ decision: { ...decision, note } });
      },
    }),
    {
      name: 'gq.lookBattle',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
