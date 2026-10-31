import { useAssistantSession } from '@/features/assistant/session';
import { useBattleSession } from '@/features/battle/battle-session';
import { useHairColorSession } from '@/features/hair-color/hair-color-session';
import { useHairSession } from '@/features/hair/hair-session';
import { useLookFinderSession } from '@/features/look-finder/session';
import { useNailSession } from '@/features/nail/nail-session';

/**
 * Each feature's tutorial shows again the next time it is opened. Nothing else is cleared.
 * (Lookbook shows its tutorial only from its ?, so it has nothing to reset.)
 */
export function resetAllTutorials() {
  useNailSession.setState({ tutorialSeen: false });
  useHairSession.setState({ tutorialSeen: false });
  useHairColorSession.setState({ tutorialSeen: false });
  useBattleSession.setState({ tutorialSeen: false });
  useAssistantSession.setState({ tutorialSeen: false });
  useLookFinderSession.setState({ tutorialSeen: false });
}
