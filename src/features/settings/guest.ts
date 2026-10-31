import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

export type GuestStatus =
  | { state: 'loading' }
  /** No guest yet: one is created the first time the app talks to the backend. */
  | { state: 'none' }
  | { state: 'guest'; since: Date; anonymous: boolean }
  | { state: 'unavailable' };

/** The real Supabase session on this device (read only — never signs in or out). */
export function useGuestStatus(): GuestStatus {
  const [status, setStatus] = useState<GuestStatus>({ state: 'loading' });
  useFocusEffect(
    useCallback(() => {
      if (!isSupabaseConfigured) {
        setStatus({ state: 'unavailable' });
        return;
      }
      let active = true;
      getSupabase()
        .auth.getSession()
        .then(({ data }) => {
          if (!active) return;
          const user = data.session?.user;
          setStatus(
            user
              ? { state: 'guest', since: new Date(user.created_at), anonymous: user.is_anonymous ?? false }
              : { state: 'none' },
          );
        })
        .catch(() => active && setStatus({ state: 'unavailable' }));
      return () => {
        active = false;
      };
    }, []),
  );
  return status;
}
