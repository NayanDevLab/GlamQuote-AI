import 'expo-sqlite/localStorage/install';

import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { PickedImage } from '@/lib/photo';

import {
  DEFAULT_FULL,
  DEFAULT_OMBRE,
  type ColorChoice,
  type FullDraft,
  type HairColorMode,
  type OmbreDraft,
} from './presets';

/** One Generate tap. The key makes the request idempotent; the inputs are what was actually sent. */
export type HairColorAttempt = {
  idempotencyKey: string;
  taskId: string | null;
  startedAt: number;
  photo: PickedImage;
  choice: ColorChoice;
};

/** A genuine YouCam hair color result created on this device. */
export type HairColorPreview = {
  taskId: string;
  /** Temporary link (about 2 hours); refreshed from the task when it stops loading. */
  resultUrl: string;
  photo: PickedImage;
  choice: ColorChoice;
  createdAt: number;
  savedLookId: string | null;
};

type HairColorSession = {
  tutorialSeen: boolean;
  /** The user's original photo — never an AI hairstyle preview. */
  photo: PickedImage | null;
  mode: HairColorMode;
  // Each mode keeps its own draft; switching modes never clears the other.
  full: FullDraft;
  ombre: OmbreDraft;
  /** Consent is given per generation and resets whenever the photo or colors change. */
  consent: boolean;
  attempt: HairColorAttempt | null;
  previews: HairColorPreview[];

  markTutorialSeen: () => void;
  setPhoto: (photo: PickedImage | null) => void;
  setMode: (mode: HairColorMode) => void;
  updateFull: (patch: Partial<FullDraft>) => void;
  updateOmbre: (patch: Partial<OmbreDraft>) => void;
  /** Restores the custom settings of a mode (the preset choice is kept). */
  resetCustom: (mode: HairColorMode) => void;
  setConsent: (consent: boolean) => void;
  /** Starts a generation, or returns the one already in flight so a second tap cannot pay twice. */
  startAttempt: (choice: ColorChoice) => HairColorAttempt | null;
  setAttemptTask: (taskId: string) => void;
  endAttempt: () => void;
  addPreview: (preview: HairColorPreview) => void;
  updatePreview: (taskId: string, patch: Partial<HairColorPreview>) => void;
};

const MAX_PREVIEWS = 10;

export const useHairColorSession = create<HairColorSession>()(
  persist(
    (set, get) => ({
      tutorialSeen: false,
      photo: null,
      mode: 'full',
      full: DEFAULT_FULL,
      ombre: DEFAULT_OMBRE,
      consent: false,
      attempt: null,
      previews: [],

      markTutorialSeen: () => set({ tutorialSeen: true }),
      setPhoto: (photo) => set({ photo, consent: false }),
      setMode: (mode) => set({ mode, consent: false }),
      // Editing a draft is local only: it never starts a (billable) YouCam task.
      updateFull: (patch) => set((state) => ({ full: { ...state.full, ...patch }, consent: false })),
      updateOmbre: (patch) =>
        set((state) => ({
          ombre: { ...state.ombre, ...patch },
          consent: false,
        })),
      resetCustom: (mode) =>
        set((state) =>
          mode === 'full'
            ? {
                full: {
                  ...DEFAULT_FULL,
                  source: 'custom',
                  presetIndex: state.full.presetIndex,
                },
                consent: false,
              }
            : {
                ombre: {
                  ...DEFAULT_OMBRE,
                  source: 'custom',
                  presetIndex: state.ombre.presetIndex,
                },
                consent: false,
              },
        ),
      setConsent: (consent) => set({ consent }),

      startAttempt: (choice) => {
        const { attempt, photo, consent } = get();
        if (attempt) return attempt;
        if (!photo || !consent) return null;
        const started: HairColorAttempt = {
          idempotencyKey: Crypto.randomUUID(),
          taskId: null,
          startedAt: Date.now(),
          photo,
          choice,
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
          previews: [preview, ...state.previews.filter((p) => p.taskId !== preview.taskId)].slice(0, MAX_PREVIEWS),
        })),
      updatePreview: (taskId, patch) =>
        set((state) => ({
          previews: state.previews.map((p) => (p.taskId === taskId ? { ...p, ...patch } : p)),
        })),
    }),
    {
      name: 'gq.hairColor',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Consent is deliberately not persisted. The in-flight attempt is, so a preview requested
      // before the app was closed can be picked up again without a second task.
      partialize: ({ tutorialSeen, photo, mode, full, ombre, attempt, previews }) => ({
        tutorialSeen,
        photo,
        mode,
        full,
        ombre,
        attempt,
        previews,
      }),
    },
  ),
);
