import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, ScrollView, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { NailErrorState } from '@/features/nail/components';
import {
  errorKindForCode,
  errorKindForThrown,
  shouldKeepAttempt,
  type NailErrorAction,
  type NailErrorKind,
} from '@/features/nail/errors';
import { useNailSession, type NailAttempt } from '@/features/nail/nail-session';
import {
  createNailTransferTask,
  getNailTransferTask,
  type NailTransferTask,
} from '@/features/nail/nail-transfer-api';
import { colors, shadows } from '@/theme';

// YouCam suggests polling about every 10 seconds; it reports no progress percentage.
const POLL_INTERVAL_MS = 10_000;
// After this long we stop implying it's imminent, but keep the same task — never a new one.
const PATIENCE_MS = 5 * 60_000;

/**
 * Creates the task if this attempt has not been submitted yet, then reads its status.
 * The attempt's idempotency key makes re-running this safe: the server returns the task it
 * already created instead of starting — and charging for — another.
 */
async function advance(attempt: NailAttempt): Promise<NailTransferTask> {
  const session = useNailSession.getState();
  let taskId = session.attempt?.idempotencyKey === attempt.idempotencyKey ? session.attempt.taskId : attempt.taskId;
  if (!taskId) {
    const created = await createNailTransferTask({
      hand: { uri: attempt.hand.uri, mimeType: 'image/jpeg' },
      reference: { uri: attempt.design.image.uri, mimeType: 'image/jpeg' },
      idempotencyKey: attempt.idempotencyKey,
    });
    taskId = created.taskId;
    session.setAttemptTask(taskId);
    if (created.status === 'running') return created;
  }
  return getNailTransferTask(taskId);
}

function IndeterminateBar() {
  const sweep = useSharedValue(0);
  useEffect(() => {
    sweep.set(withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1));
  }, [sweep]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: -44 + sweep.get() * 164 }] }));
  return (
    <View className="h-[3px] w-[120px] overflow-hidden rounded-full bg-canvas/70">
      <Animated.View style={style}>
        <View className="h-[3px] w-11 rounded-full bg-plum" />
      </Animated.View>
    </View>
  );
}

function StatusRow({ state, label }: { state: 'done' | 'active' | 'pending'; label: string }) {
  return (
    <View className="flex-row items-center gap-3">
      {state === 'done' ? (
        <View className="h-6 w-6 items-center justify-center rounded-full bg-plum">
          <Icon name="check" size={13} color={colors.white} strokeWidth={2.6} />
        </View>
      ) : state === 'active' ? (
        <View className="h-6 w-6 items-center justify-center rounded-full border-2 border-plum">
          <View className="h-2.5 w-2.5 rounded-full bg-plum" />
        </View>
      ) : (
        <View className="h-6 w-6 rounded-full border border-dashed border-line-strong" />
      )}
      <Text
        className={`flex-1 text-body-l ${
          state === 'active' ? 'font-sans-semibold text-ink' : state === 'done' ? 'font-sans text-ink' : 'font-sans text-muted'
        }`}>
        {label}
      </Text>
    </View>
  );
}

export default function NailGenerating() {
  const insets = useSafeAreaInsets();
  // The attempt this screen is working on. The store's copy is cleared when it ends, so the
  // inputs that were actually sent are kept here for the error state and the result.
  const [attempt, setAttempt] = useState(() => useNailSession.getState().attempt);
  const [timedOut, setTimedOut] = useState(false);
  const [patienceRound, setPatienceRound] = useState(0);

  const query = useQuery({
    queryKey: ['nail-transfer', attempt?.idempotencyKey],
    queryFn: () => advance(attempt as NailAttempt),
    enabled: attempt !== null,
    refetchInterval: (current) => (current.state.data?.status === 'running' ? POLL_INTERVAL_MS : false),
    refetchIntervalInBackground: false,
    // No automatic retries: every retry is an explicit tap, and it reuses the same key.
    retry: false,
    staleTime: Infinity,
    gcTime: 0,
  });
  const { data: task, error, refetch } = query;

  const thrownKind = error ? errorKindForThrown(error) : null;
  const failure: NailErrorKind | null =
    thrownKind ??
    (task?.status === 'error' ? errorKindForCode(task.errorCode) : null) ??
    (task?.status === 'success' && !task.resultUrl ? 'expired' : null) ??
    (timedOut && task?.status !== 'success' ? 'timeout' : null);

  // Settle the attempt when it reaches an outcome.
  useEffect(() => {
    if (!attempt) return;
    const session = useNailSession.getState();
    const endIfCurrent = () => {
      if (session.attempt?.idempotencyKey === attempt.idempotencyKey) session.endAttempt();
    };
    if (task?.status === 'success' && task.resultUrl) {
      session.addPreview({
        taskId: task.taskId,
        resultUrl: task.resultUrl,
        hand: attempt.hand,
        designName: attempt.design.name,
        designSource: attempt.design.source,
        createdAt: Date.now(),
        savedLookId: null,
      });
      endIfCurrent();
      router.replace({ pathname: '/nail/result', params: { taskId: task.taskId } });
    } else if (task?.status === 'error' || (thrownKind && !shouldKeepAttempt(thrownKind))) {
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

  if (!attempt) return <Redirect href="/nail/review" />;

  const onAction = (action: NailErrorAction) => {
    if (action === 'keep_waiting') {
      setTimedOut(false);
      setPatienceRound((round) => round + 1);
      refetch();
    } else if (action === 'retry') {
      const session = useNailSession.getState();
      if (session.attempt?.idempotencyKey === attempt.idempotencyKey) {
        // Outcome unknown (e.g. offline): same key, so the server cannot create a second task.
        refetch();
      } else {
        // The previous attempt ended, so this is a new, explicit generation with the same
        // inputs and consent. If the inputs are gone, send the user back to Review.
        const next = session.startAttempt();
        if (next) {
          setTimedOut(false);
          setAttempt(next);
        } else {
          router.back();
        }
      }
    } else if (action === 'change_photo') {
      router.replace('/nail/photo?edit=1');
    } else if (action === 'change_design') {
      router.dismissTo('/nail/designs');
    } else {
      router.dismissTo('/nail');
    }
  };

  if (failure) {
    return (
      <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}>
        <View className="h-12 flex-row items-center justify-between px-2">
          <IconButton icon="arrowLeft" label="Back" strokeWidth={1.8} onPress={() => router.back()} />
          <Text className="pr-4 font-sans-semibold text-overline uppercase text-muted">Nail Studio</Text>
        </View>
        <NailErrorState kind={failure} onAction={onAction} hand={attempt.hand} designImage={attempt.design.image} />
      </View>
    );
  }

  const submitted = task !== undefined;

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <View className="h-12 flex-row items-center justify-between px-2">
        <IconButton icon="close" label="Stop waiting" strokeWidth={1.8} onPress={() => router.back()} />
        <Text className="pr-4 font-sans-semibold text-overline uppercase text-muted">Nail Studio</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        contentContainerClassName="gap-4 px-5 pt-2"
        showsVerticalScrollIndicator={false}>
        <View style={shadows.card} className="h-[240px] overflow-hidden rounded-lg bg-blush">
          <Image
            source={{ uri: attempt.hand.uri }}
            contentFit="cover"
            accessibilityLabel="Your hand photo"
            style={{ width: '100%', height: '100%' }}
          />
          <View className="absolute left-3 top-3 flex-row items-center gap-1.5 rounded-full bg-canvas/95 px-2.5 py-[5px]">
            <View className="h-2 w-2 rounded-full bg-plum" />
            <Text className="font-sans-semibold text-caption text-plum">
              {submitted ? 'Processing with YouCam' : 'Sending to YouCam'}
            </Text>
          </View>
          <View className="absolute bottom-4 left-0 right-0 items-center">
            <IndeterminateBar />
          </View>
        </View>

        <View className="gap-2">
          <Text accessibilityRole="header" className="font-serif text-hero text-ink">
            Creating Your Nail <Text className="font-serif-italic text-plum">Preview…</Text>
          </Text>
          <Text className="font-sans text-body-l text-muted">
            We’re applying your selected design to your photo.
          </Text>
          <View className="self-start rounded-full bg-blush px-3 py-1.5">
            <Text className="font-sans-semibold text-caption text-plum">YouCam AI Nail Transfer task</Text>
          </View>
        </View>

        <View
          accessibilityRole="progressbar"
          accessibilityLabel={submitted ? 'Processing with YouCam' : 'Sending your photo'}
          className="gap-3 rounded-lg border border-blush bg-card p-4">
          <StatusRow
            state={submitted ? 'done' : 'active'}
            label={submitted ? 'Photo sent securely' : 'Sending your photo securely'}
          />
          <StatusRow state={submitted ? 'done' : 'pending'} label="Task accepted by YouCam" />
          <StatusRow state={submitted ? 'active' : 'pending'} label="Processing — reported by YouCam" />
          <StatusRow state="pending" label="Preview ready" />
        </View>

        <View className="flex-row gap-2">
          <View className="mt-0.5">
            <Icon name="clock" size={16} color={colors.muted} />
          </View>
          <Text className="flex-1 font-sans text-body-s text-muted">
            Most previews take under a minute, but it can take longer when the service is busy. No need
            to tap again.
          </Text>
        </View>

        <Text
          accessibilityRole="button"
          onPress={() => router.back()}
          className="self-center px-4 py-3 font-sans-semibold text-label text-plum">
          Stop Waiting
        </Text>
        <Text className="-mt-3 text-center font-sans text-body-s text-muted">
          This preview has already been requested and will finish in the background. Your photo and
          design stay selected.
        </Text>
      </ScrollView>
    </View>
  );
}
