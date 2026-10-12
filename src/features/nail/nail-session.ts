import 'expo-sqlite/localStorage/install';

import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** A photo prepared for upload: a JPEG in the app cache, already within the provider's limits. */
export type PickedImage = { uri: string; width: number; height: number };

/**
 * The nail design to transfer. Only a user-supplied reference photo is supported today;
 * curated catalogue designs join this union once licensed, provider-validated photos exist.
 */
export type NailDesign = { source: 'reference'; image: PickedImage; name: string };

/** One Generate tap. The key makes the request idempotent; the inputs are what was actually sent. */
export type NailAttempt = {
  idempotencyKey: string;
  taskId: string | null;
  startedAt: number;
  hand: PickedImage;
  design: NailDesign;
};

/** A genuine YouCam result created in this session. */
export type NailPreview = {
  taskId: string;
  /** Temporary link (about 2 hours); refreshed from the task when it stops loading. */
  resultUrl: string;
  hand: PickedImage;
  designName: string;
  designSource: NailDesign['source'];
  createdAt: number;
  savedLookId: string | null;
};

type NailSession = {
  tutorialSeen: boolean;
  hand: PickedImage | null;
  design: NailDesign | null;
  /** Consent is given per generation and resets whenever an input changes. */
  consent: boolean;
  attempt: NailAttempt | null;
  previews: NailPreview[];

  markTutorialSeen: () => void;
  setHand: (hand: PickedImage | null) => void;
  setDesign: (design: NailDesign | null) => void;
  setConsent: (consent: boolean) => void;
  /** Starts a generation, or returns the one already in flight so a second tap cannot pay twice. */
  startAttempt: () => NailAttempt | null;
  setAttemptTask: (taskId: string) => void;
  endAttempt: () => void;
  addPreview: (preview: NailPreview) => void;
  updatePreview: (taskId: string, patch: Partial<NailPreview>) => void;
};

const MAX_PREVIEWS = 10;

export const useNailSession = create<NailSession>()(
  persist(
    (set, get) => ({
      tutorialSeen: false,
      hand: null,
      design: null,
      consent: false,
      attempt: null,
      previews: [],

      markTutorialSeen: () => set({ tutorialSeen: true }),
      // Changing the photo never clears the design, and the reverse is also true.
      setHand: (hand) => set({ hand, consent: false }),
      setDesign: (design) => set({ design, consent: false }),
      setConsent: (consent) => set({ consent }),

      startAttempt: () => {
        const { attempt, hand, design, consent } = get();
        if (attempt) return attempt;
        if (!hand || !design || !consent) return null;
        const started: NailAttempt = {
          idempotencyKey: Crypto.randomUUID(),
          taskId: null,
          startedAt: Date.now(),
          hand,
          design,
        };
        set({ attempt: started });
        return started;
      },
      setAttemptTask: (taskId) => {
        const { attempt } = get();
        if (attempt) set({ attempt: { ...attempt, taskId } });
      },
      endAttempt: () => set({ attempt: null }),

      addPreview: (preview) =>
        set((state) => ({
          consent: false,
          previews: [preview, ...state.previews.filter((p) => p.taskId !== preview.taskId)].slice(
            0,
            MAX_PREVIEWS,
          ),
        })),
      updatePreview: (taskId, patch) =>
        set((state) => ({
          previews: state.previews.map((p) => (p.taskId === taskId ? { ...p, ...patch } : p)),
        })),
    }),
    {
      name: 'gq.nail',
      storage: createJSONStorage(() => localStorage),
      // Consent is deliberately not persisted. The in-flight attempt is, so a preview that was
      // requested before the app was backgrounded or closed can be picked up again.
      partialize: ({ tutorialSeen, hand, design, attempt, previews }) => ({
        tutorialSeen,
        hand,
        design,
        attempt,
        previews,
      }),
    },
  ),
);

/** Previews made from the same original photo — the only ones Compare Looks may pair. */
export function previewsFromSamePhoto(previews: NailPreview[], preview: NailPreview): NailPreview[] {
  return previews.filter((p) => p.hand.uri === preview.hand.uri);
}
