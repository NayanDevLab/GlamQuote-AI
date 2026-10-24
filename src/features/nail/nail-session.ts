import 'expo-sqlite/localStorage/install';

import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { NailTaskKind } from './nail-transfer-api';
import {
  buildPolishConfig,
  buildPressConfig,
  DEFAULT_POLISH,
  DEFAULT_PRESS,
  FINGERS,
  summarizePolish,
  summarizePress,
  type NailVtoConfig,
  type PolishDraft,
  type PressDraft,
  type SummaryRow,
  type VtoMode,
} from './vto';

/** A photo prepared for upload: a JPEG in the app cache, already within the provider's limits. */
export type PickedImage = { uri: string; width: number; height: number };

/** Nail Transfer input: a reference photo of the design the user wants. */
export type ReferenceDesign = { source: 'reference'; image: PickedImage; name: string };

/** Nail VTO input: a Nail Polish or Press-On customization. `swatches` are for sample display only. */
export type CustomDesign = {
  source: 'custom';
  mode: VtoMode;
  name: string;
  config: NailVtoConfig;
  swatches: string[];
  summary: SummaryRow[];
};

export type NailDesign = ReferenceDesign | CustomDesign;

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
  kind: NailTaskKind;
  /** Temporary link (about 2 hours); refreshed from the task when it stops loading. */
  resultUrl: string;
  hand: PickedImage;
  designName: string;
  designSource: NailDesign['source'];
  /** Customization details for Nail VTO previews. */
  summary: SummaryRow[];
  createdAt: number;
  savedLookId: string | null;
};

type NailSession = {
  tutorialSeen: boolean;
  /** The same hand photo serves both Nail Transfer and Nail VTO. */
  hand: PickedImage | null;
  design: ReferenceDesign | null;
  // Nail VTO drafts are kept per mode, so switching modes never overwrites the other.
  vtoMode: VtoMode;
  polish: PolishDraft;
  press: PressDraft;
  /** Consent is given per generation and resets whenever an input changes. */
  consent: boolean;
  attempt: NailAttempt | null;
  previews: NailPreview[];

  markTutorialSeen: () => void;
  setHand: (hand: PickedImage | null) => void;
  setDesign: (design: ReferenceDesign | null) => void;
  setVtoMode: (mode: VtoMode) => void;
  updatePolish: (patch: Partial<PolishDraft>) => void;
  updatePress: (patch: Partial<PressDraft>) => void;
  resetDraft: (mode: VtoMode) => void;
  setConsent: (consent: boolean) => void;
  /**
   * Starts a generation for `design`, or returns the one already in flight so a second tap
   * cannot pay twice. Returns null if there is no photo or no consent.
   */
  startAttempt: (design: NailDesign) => NailAttempt | null;
  setAttemptTask: (taskId: string) => void;
  endAttempt: () => void;
  addPreview: (preview: NailPreview) => void;
  updatePreview: (taskId: string, patch: Partial<NailPreview>) => void;
};

const MAX_PREVIEWS = 10;

/** Snapshots the current Nail VTO draft as the design a generation will use. */
export function customDesignFrom(mode: VtoMode, polish: PolishDraft, press: PressDraft): CustomDesign {
  if (mode === 'polish') {
    const summary = summarizePolish(polish);
    return {
      source: 'custom',
      mode,
      name: `${summary.find((row) => row.label === 'Color')?.value ?? 'Custom colors'} · ${summary.at(-1)?.value}`,
      config: buildPolishConfig(polish),
      swatches: FINGERS.map(({ id }) => polish.colors[id]),
      summary,
    };
  }
  const summary = summarizePress(press);
  return {
    source: 'custom',
    mode,
    name: `${summary[1].value} press-ons`,
    config: buildPressConfig(press),
    swatches: FINGERS.map(() => press.color),
    summary,
  };
}

export const useNailSession = create<NailSession>()(
  persist(
    (set, get) => ({
      tutorialSeen: false,
      hand: null,
      design: null,
      vtoMode: 'polish',
      polish: DEFAULT_POLISH,
      press: DEFAULT_PRESS,
      consent: false,
      attempt: null,
      previews: [],

      markTutorialSeen: () => set({ tutorialSeen: true }),
      // Changing the photo never clears a design or customization, and the reverse is also true.
      setHand: (hand) => set({ hand, consent: false }),
      setDesign: (design) => set({ design, consent: false }),
      setVtoMode: (vtoMode) => set({ vtoMode, consent: false }),
      // Editing a draft is local only: it never starts a (billable) YouCam task.
      updatePolish: (patch) => set((state) => ({ polish: { ...state.polish, ...patch }, consent: false })),
      updatePress: (patch) => set((state) => ({ press: { ...state.press, ...patch }, consent: false })),
      resetDraft: (mode) =>
        set(mode === 'polish' ? { polish: DEFAULT_POLISH, consent: false } : { press: DEFAULT_PRESS, consent: false }),
      setConsent: (consent) => set({ consent }),

      startAttempt: (design) => {
        const { attempt, hand, consent } = get();
        if (attempt) return attempt;
        if (!hand || !consent) return null;
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
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // v0 (Nail Transfer only) previews and attempts lack the fields added for Nail VTO.
      migrate: (persisted) => ({ ...(persisted as object), attempt: null, previews: [] }),
      // Consent is deliberately not persisted. The in-flight attempt is, so a preview that was
      // requested before the app was backgrounded or closed can be picked up again.
      partialize: ({ tutorialSeen, hand, design, vtoMode, polish, press, attempt, previews }) => ({
        tutorialSeen,
        hand,
        design,
        vtoMode,
        polish,
        press,
        attempt,
        previews,
      }),
    },
  ),
);

/**
 * Previews made from the same original photo — the only ones Compare Looks may pair. Nail
 * Polish, Press-On and Nail Transfer previews all qualify; hair previews never share a photo.
 */
export function previewsFromSamePhoto(previews: NailPreview[], preview: NailPreview): NailPreview[] {
  return previews.filter((p) => p.hand.uri === preview.hand.uri);
}
