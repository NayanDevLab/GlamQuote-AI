import { getSupabase, invokeEdgeFunction, isSupabaseConfigured } from '@/lib/supabase';

/** A look the user explicitly saved. `imageUrl` is a private, signed link to the genuine result. */
export type SavedLook = {
  id: string;
  taskId: string;
  kind: 'nail_transfer' | 'nail_vto';
  title: string;
  designSource: 'reference' | 'catalogue' | 'custom';
  designId: string | null;
  /** Nail VTO only: 'nail_polish' or 'press_on_nails'. */
  effectType: string | null;
  /** Looks sharing a hash came from the same original photo (Compare Looks eligibility). */
  sourcePhotoHash: string | null;
  imageUrl: string;
  imageWidth: number | null;
  imageHeight: number | null;
  createdAt: string;
};

export const LOOKBOOK_QUERY_KEY = ['lookbook'] as const;

/**
 * Lists saved looks. Opening the Lookbook must not create a guest account, so this returns
 * an empty list when there is no session yet — nothing can have been saved without one.
 */
export async function listSavedLooks(): Promise<SavedLook[]> {
  if (!isSupabaseConfigured) return [];
  const { data } = await getSupabase().auth.getSession();
  if (!data.session) return [];
  const { looks } = await invokeEdgeFunction<{ looks: SavedLook[] }>('lookbook', { method: 'GET' });
  return looks;
}

/**
 * Saves one finished preview. Safe to retry: the server keys the look and its stored image on
 * the task, so a repeat returns the existing look instead of creating another.
 */
export async function saveLook(input: {
  taskId: string;
  title: string;
  designSource: SavedLook['designSource'];
}): Promise<SavedLook> {
  const { look } = await invokeEdgeFunction<{ look: SavedLook }>('lookbook', {
    method: 'POST',
    body: input,
  });
  return look;
}
