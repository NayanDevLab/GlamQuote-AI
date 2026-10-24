import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { IndeterminateBar, StatusRow } from '@/components/ui/progress';
import { Sheet } from '@/components/ui/sheet';
import { HairErrorState } from '@/features/hair/components';
import {
  hairErrorKindForCode,
  hairErrorKindForThrown,
  shouldKeepHairAttempt,
  type HairErrorAction,
  type HairErrorKind,
} from '@/features/hair/errors';
import {
  createHairstyleTask,
  getHairstyleTask,
  HAIR_MAX_LONG_SIDE,
  type HairTask,
} from '@/features/hair/hair-api';
import { useHairSession, type HairAttempt } from '@/features/hair/hair-session';
import { isPhotoReadable, PhotoUnavailableError, uploadUriFor } from '@/lib/photo';
import { colors, shadows } from '@/theme';

// YouCam suggests polling about every 10 seconds; it reports no progress percentage.
const POLL_INTERVAL_MS = 10_000;
// After this long we stop implying it's imminent, but keep the same task — never a new one.
const PATIENCE_MS = 5 * 60_000;

/**
 * Creates the task if this attempt has not been submitted yet, then reads its status. The
 * attempt's idempotency key makes re-running this safe: the server returns the task it already
 * created instead of starting — and charging for — another.
 */
async function advance(attempt: HairAttempt): Promise<HairTask> {
  const session = useHairSession.getState();
  let taskId = session.attempt?.idempotencyKey === attempt.idempotencyKey ? session.attempt.taskId : attempt.taskId;
  if (!taskId) {
    // Android reports an unreadable upload file as a network failure, so check first: nothing is
    // sent (or charged) if the selfie has gone missing from the app cache.
    if (!(await isPhotoReadable(attempt.selfie.uri))) throw new PhotoUnavailableError('selfie');
    const created = await createHairstyleTask({
      selfieUri: await uploadUriFor(attempt.selfie, HAIR_MAX_LONG_SIDE),
      templateId: attempt.template.id,
      idempotencyKey: attempt.idempotencyKey,
    });
    taskId = created.taskId;
    session.setAttemptTask(taskId);
    if (created.status === 'running') return created;
  }
  return getHairstyleTask(taskId);
}

// P4A-7 — Processing, with P4A-10 recovery states.
export default function HairGenerating() {
  const insets = useSafeAreaInsets();
  // The attempt this screen is working on. The store's copy is cleared when it ends, so the
  // inputs that were actually sent are kept here for the error state and the result.
  const [attempt, setAttempt] = useState(() => useHairSession.getState().attempt);
  const [timedOut, setTimedOut] = useState(false);
  const [patienceRound, setPatienceRound] = useState(0);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const query = useQuery({
    queryKey: ['hairstyle', attempt?.idempotencyKey],
    queryFn: () => advance(attempt as HairAttempt),
    enabled: attempt !== null,
    refetchInterval: (current) => (current.state.data?.status === 'running' ? POLL_INTERVAL_MS : false),
    refetchIntervalInBackground: false,
    // No automatic retries: every retry is an explicit tap, and it reuses the same key.
    retry: false,
    staleTime: Infinity,
    gcTime: 0,
  });
  const { data: task, error, refetch } = query;

  const thrownKind = error ? hairErrorKindForThrown(error) : null;
  // Development builds log the technical cause once per failure (name and message only).
  useEffect(() => {
    if (!__DEV__ || !error) return;
    console.warn(`[hair] ${thrownKind}: ${error.name}: ${error.message}`);
  }, [error, thrownKind]);
  const failure: HairErrorKind | null =
    thrownKind ??
    (task?.status === 'error' ? hairErrorKindForCode(task.errorCode) : null) ??
    (task?.status === 'success' && !task.resultUrl ? 'expired' : null) ??
    (timedOut && task?.status !== 'success' ? 'timeout' : null);

  // Settle the attempt when it reaches an outcome.
  useEffect(() => {
    if (!attempt) return;
    const session = useHairSession.getState();
    const endIfCurrent = () => {
      if (session.attempt?.idempotencyKey === attempt.idempotencyKey) session.endAttempt();
    };
    if (task?.status === 'success' && task.resultUrl) {
      session.addPreview({
        taskId: task.taskId,
        resultUrl: task.resultUrl,
        selfie: attempt.selfie,
        template: attempt.template,
        createdAt: Date.now(),
        savedLookId: null,
      });
      endIfCurrent();
      router.replace({ pathname: '/hair/result', params: { taskId: task.taskId } });
    } else if (task?.status === 'error' || (thrownKind && !shouldKeepHairAttempt(thrownKind))) {
      endIfCurrent();
    }
  }, [attempt, task, thrownKind]);

  // Patience timer: restarts for each attempt and each "Keep Waiting".
  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), PATIENCE_MS);
    return () => clearTimeout(timer);
  }, [attempt, patienceRound]);

  // Polling pauses in the background; check straight away when the app comes back.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refetch();
    });
    return () => subscription.remove();
  }, [refetch]);

  if (!attempt) return <Redirect href="/hair" />;

  const onAction = (action: HairErrorAction) => {
    if (action === 'keep_waiting') {
      setTimedOut(false);
      setPatienceRound((round) => round + 1);
      refetch();
    } else if (action === 'retry') {
      const session = useHairSession.getState();
      if (session.attempt?.idempotencyKey === attempt.idempotencyKey) {
        // Outcome unknown (e.g. offline): same key, so the server cannot create a second task.
        refetch();
      } else {
        // The previous attempt ended, so this is a new, explicit generation with the same inputs
        // and consent. If they are gone, send the user back to Review.
        const next = session.startAttempt();
        if (next) {
          setTimedOut(false);
          setAttempt(next);
        } else {
          router.back();
        }
      }
    } else if (action === 'change_photo' || action === 'retake' || action === 'gallery') {
      router.replace('/hair/photo?edit=1');
    } else if (action === 'change_style') {
      router.dismissTo('/hair/styles');
    } else if (action === 'lookbook') {
      router.navigate('/lookbook');
    } else {
      router.dismissTo('/hair');
    }
  };

  if (failure) {
    return (
      <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}>
        <View className="h-12 flex-row items-center justify-between px-2">
          <IconButton icon="arrowLeft" label="Back" strokeWidth={1.8} onPress={() => router.back()} />
          <Text className="pr-4 font-sans-semibold text-overline uppercase text-muted">Hair Studio</Text>
        </View>
        <HairErrorState kind={failure} onAction={onAction} selfie={attempt.selfie} template={attempt.template} />
      </View>
    );
  }

  const submitted = task !== undefined;

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <View className="h-12 flex-row items-center justify-between px-2">
        <IconButton icon="close" label="Stop waiting" strokeWidth={1.8} onPress={() => setConfirmLeave(true)} />
        <Text className="pr-4 font-sans-semibold text-overline uppercase text-muted">Hair Studio</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        contentContainerClassName="gap-4 px-5 pt-2"
        showsVerticalScrollIndicator={false}>
        <View style={shadows.card} className="h-[260px] overflow-hidden rounded-lg bg-blush">
          <Image
            source={{ uri: attempt.selfie.uri }}
            contentFit="cover"
            accessibilityLabel="Your original photo"
            style={{ width: '100%', height: '100%' }}
          />
          <View className="absolute left-3 top-3 flex-row items-center gap-1.5 rounded-full bg-canvas/95 px-2.5 py-[5px]">
            <View className="h-2 w-2 rounded-full bg-plum" />
            <Text className="font-sans-semibold text-caption text-plum">Your original photo · in progress</Text>
          </View>
          <View className="absolute bottom-4 left-0 right-0 items-center">
            <IndeterminateBar />
          </View>
        </View>

        <View className="gap-2">
          <Text accessibilityRole="header" className="font-serif text-hero text-ink">
            Creating Your Hairstyle <Text className="font-serif-italic text-plum">Preview…</Text>
          </Text>
          <View className="self-start rounded-full bg-blush px-3 py-1.5">
            <Text className="font-sans-semibold text-caption text-plum">
              YouCam AI Hairstyle Virtual Try-On · {attempt.template.title}
            </Text>
          </View>
        </View>

        <View
          accessibilityRole="progressbar"
          accessibilityLabel={submitted ? 'Waiting for YouCam' : 'Uploading your photo'}
          className="gap-3 rounded-lg border border-blush bg-card p-4">
          <StatusRow state={submitted ? 'done' : 'active'} label="Uploading photo" />
          <StatusRow state={submitted ? 'done' : 'pending'} label="Creating YouCam task" />
          <StatusRow
            state={submitted ? 'active' : 'pending'}
            label="Waiting for result"
            detail="Checking until YouCam reports success or an error"
          />
          <StatusRow state="pending" label="Preview ready" />
        </View>

        <View className="flex-row gap-2">
          <View className="mt-0.5">
            <Icon name="clock" size={16} color={colors.muted} />
          </View>
          <Text className="flex-1 font-sans text-body-s text-muted">
            Processing time varies. No need to tap again — one request is already running.
          </Text>
        </View>

        <Text
          accessibilityRole="button"
          onPress={() => setConfirmLeave(true)}
          className="self-center px-4 py-3 font-sans-semibold text-label text-plum">
          Cancel
        </Text>
        <Text className="-mt-3 text-center font-sans text-body-s text-muted">
          Your photo and hairstyle stay selected.
        </Text>
      </ScrollView>

      {/* YouCam has no way to cancel a task once it is created, so be honest about what leaving does. */}
      <Sheet
        visible={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        eyebrow="Hair Studio"
        title={
          <>
            Stop <Text className="font-serif-italic text-plum">waiting?</Text>
          </>
        }>
        <Text className="font-sans text-body-m text-muted">
          {submitted
            ? 'This preview has already been requested and will still finish — leaving doesn’t cancel it. You can come back to it from Hair Studio.'
            : 'Your photo is being sent now. If it reaches YouCam, the preview will still finish and you can open it from Hair Studio.'}
        </Text>
        <Button label="Keep Waiting" onPress={() => setConfirmLeave(false)} />
        <Button
          label="Leave"
          variant="secondary"
          onPress={() => {
            setConfirmLeave(false);
            router.back();
          }}
        />
      </Sheet>
    </View>
  );
}
