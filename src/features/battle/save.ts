import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useHairColorSession } from '@/features/hair-color/hair-color-session';
import { useHairSession } from '@/features/hair/hair-session';
import { LOOKBOOK_QUERY_KEY, saveLook, type SavedLook } from '@/features/lookbook/lookbook-api';
import { useNailSession } from '@/features/nail/nail-session';

import type { BattleLook } from './looks';
import { BATTLE_LOOKS_QUERY_KEY } from './use-battle-looks';

/** Keeps the studio that made the preview in sync, so it shows "Saved" there too. */
function markSaved(look: BattleLook, saved: SavedLook) {
  if (look.save?.origin === 'nail') useNailSession.getState().updatePreview(look.key, { savedLookId: saved.id });
  if (look.save?.origin === 'hair') useHairSession.getState().updatePreview(look.key, { savedLookId: saved.id });
  if (look.save?.origin === 'hairColor')
    useHairColorSession.getState().updatePreview(look.key, { savedLookId: saved.id });
}

/**
 * Explicit Save from Look Battle. An unsaved preview is copied to private storage by the
 * lookbook function; an already-saved look is never uploaded again (only a new note is sent).
 * Success is reported only after the backend confirms the saved record.
 */
export function useSaveLooks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ looks, note }: { looks: BattleLook[]; note?: string }) => {
      const results: SavedLook[] = [];
      for (const look of looks) {
        if (look.savedLookId && !note) continue;
        const saved = await saveLook({
          taskId: look.key,
          title: look.save?.title ?? look.title,
          designSource: look.save?.designSource ?? 'custom',
          designId: look.save?.designId,
          note: note?.trim() || undefined,
        });
        markSaved(look, saved);
        results.push(saved);
      }
      return results;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: LOOKBOOK_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: BATTLE_LOOKS_QUERY_KEY });
    },
  });
}
