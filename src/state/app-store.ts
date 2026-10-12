import 'expo-sqlite/localStorage/install';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type AppState = {
  /** Set once the user finishes or skips onboarding; returning users go straight to Home. */
  onboardingComplete: boolean;
  completeOnboarding: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      onboardingComplete: false,
      completeOnboarding: () => set({ onboardingComplete: true }),
    }),
    {
      name: 'gq.app',
      // expo-sqlite's localStorage is synchronous, so the flag is ready before first render.
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ onboardingComplete: state.onboardingComplete }),
    },
  ),
);
