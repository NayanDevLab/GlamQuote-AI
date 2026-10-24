import 'expo-sqlite/localStorage/install';

import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { PickedImage } from '@/lib/photo';

import type { HairTemplate } from './hair-api';

/** One Generate tap. The key makes the request idempotent; the inputs are what was actually sent. */
export type HairAttempt = {
  idempotencyKey: string;
  taskId: string | null;
  startedAt: number;
  selfie: PickedImage;
  template: HairTemplate;
};

/** A genuine YouCam hairstyle result created on this device. */
export type HairPreview = {
  taskId: string;
  /** Temporary link (about 2 hours); refreshed from the task when it stops loading. */
  resultUrl: string;
  selfie: PickedImage;
  template: HairTemplate;
  createdAt: number;
  savedLookId: string | null;
};

type HairSession = {
  tutorialSeen: boolean;
  selfie: PickedImage | null;
  template: HairTemplate | null;
  /** Consent is given per generation and resets whenever the selfie changes. */
  consent: boolean;
  attempt: HairAttempt | null;
  previews: HairPreview[];

  markTutorialSeen: () => void;
  setSelfie: (selfie: PickedImage | null) => void;
  setTemplate: (template: HairTemplate | null) => void;
  setConsent: (consent: boolean) => void;
  /**
   * Starts a generation, or returns the one already in flight so a second tap cannot pay twice.
   * Returns null without a selfie, a hairstyle or consent.
   */
  startAttempt: () => HairAttempt | null;
  setAttemptTask: (taskId: string) => void;
  endAttempt: () => void;
  addPreview: (preview: HairPreview) => void;
  updatePreview: (taskId: string, patch: Partial<HairPreview>) => void;
};

const MAX_PREVIEWS = 10;

export const useHairSession = create<HairSession>()(
  persist(
    (set, get) => ({
      tutorialSeen: false,
      selfie: null,
      template: null,
      consent: false,
      attempt: null,
      previews: [],

      markTutorialSeen: () => set({ tutorialSeen: true }),
      // A new selfie keeps the chosen hairstyle but needs fresh consent. Changing the hairstyle
      // keeps the selfie and its consent (design P4A state model).
      setSelfie: (selfie) => set({ selfie, consent: false }),
      setTemplate: (template) => set({ template }),
      setConsent: (consent) => set({ consent }),

      startAttempt: () => {
        const { attempt, selfie, template, consent } = get();
        if (attempt) return attempt;
        if (!selfie || !template || !consent) return null;
        const started: HairAttempt = {
          idempotencyKey: Crypto.randomUUID(),
          taskId: null,
          startedAt: Date.now(),
          selfie,
          template,
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
          previews: [preview, ...state.previews.filter((p) => p.taskId !== preview.taskId)].slice(0, MAX_PREVIEWS),
        })),
      updatePreview: (taskId, patch) =>
        set((state) => ({
          previews: state.previews.map((p) => (p.taskId === taskId ? { ...p, ...patch } : p)),
        })),
    }),
    {
      name: 'gq.hair',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Consent is deliberately not persisted. The in-flight attempt is, so a preview requested
      // before the app was closed can be picked up again without a second task.
      partialize: ({ tutorialSeen, selfie, template, attempt, previews }) => ({
        tutorialSeen,
        selfie,
        template,
        attempt,
        previews,
      }),
    },
  ),
);

/** Previews made from the same selfie — the only ones Compare Looks may pair. */
export function previewsFromSameSelfie(previews: HairPreview[], preview: HairPreview): HairPreview[] {
  return previews.filter((p) => p.selfie.uri === preview.selfie.uri);
}
