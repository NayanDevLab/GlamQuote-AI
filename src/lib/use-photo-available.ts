import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { photoExists } from './photo';

/**
 * Whether a chosen photo's file is still on this device. Prepared photos live in the app cache,
 * which Android may clear while the app is in the background, so the (cheap, local) file check
 * runs again whenever the screen gains focus or the app returns to the foreground. `true` when
 * there is no photo yet (screens handle "no photo" themselves).
 */
export function usePhotoAvailable(uri: string | null | undefined): boolean {
  const [, recheck] = useState(0);

  useFocusEffect(
    useCallback(() => {
      recheck((count) => count + 1);
    }, []),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') recheck((count) => count + 1);
    });
    return () => subscription.remove();
  }, []);

  return !uri || photoExists(uri);
}
