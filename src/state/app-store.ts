import 'expo-sqlite/localStorage/install';

import type { Href } from 'expo-router';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type AppState = {
  /** Set once the user finishes or skips onboarding; returning users go straight to Home. */
  onboardingComplete: boolean;
  completeOnboarding: () => void;
  /**
   * Set while onboarding is replayed from Settings or Help: finishing returns there instead of
   * Welcome. Kept in memory only.
   */
  onboardingReplayReturn: Href | null;
  replayOnboarding: (returnTo: Href) => void;
  endOnboardingReplay: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      onboardingComplete: false,
      completeOnboarding: () => set({ onboardingComplete: true }),
      onboardingReplayReturn: null,
      replayOnboarding: (returnTo) => set({ onboardingReplayReturn: returnTo }),
      endOnboardingReplay: () => set({ onboardingReplayReturn: null }),
    }),
    {
      name: 'gq.app',
      // expo-sqlite's localStorage is synchronous, so the flag is ready before first render.
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ onboardingComplete: state.onboardingComplete }),
    },
  ),
);
