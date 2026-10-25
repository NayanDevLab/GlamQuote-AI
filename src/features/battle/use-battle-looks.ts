import { useQuery } from '@tanstack/react-query';

import { getHairColorTask } from '@/features/hair-color/hair-color-api';
import { useHairColorSession } from '@/features/hair-color/hair-color-session';
import { getHairstyleTask } from '@/features/hair/hair-api';
import { useHairSession } from '@/features/hair/hair-session';
import { listSavedLooks, type SavedLook } from '@/features/lookbook/lookbook-api';
import { getNailTask } from '@/features/nail/nail-transfer-api';
import { useNailSession } from '@/features/nail/nail-session';
import { isPhotoReadable, type PickedImage } from '@/lib/photo';

import { categoryOf, type BattleLook, type LookKind, type LookOrigin } from './looks';

export const BATTLE_LOOKS_QUERY_KEY = ['battle-looks'] as const;

/** A preview made on this device, before we know whether (and how) it can be compared. */
type LocalPreview = {
  taskId: string;
  kind: LookKind;
  origin: LookOrigin;
  title: string;
  photo: PickedImage;
  createdAt: number;
  save: NonNullable<BattleLook['save']>;
};

function useLocalPreviews(): LocalPreview[] {
  const nail = useNailSession((state) => state.previews);
  const hair = useHairSession((state) => state.previews);
  const hairColor = useHairColorSession((state) => state.previews);
  return [
    ...nail.map((p) => ({
      taskId: p.taskId,
      kind: p.kind,
      origin: 'nail' as const,
      title: p.designName,
      photo: p.hand,
      createdAt: p.createdAt,
      save: { title: p.designName, designSource: p.designSource, origin: 'nail' as const },
    })),
    ...hair.map((p) => ({
      taskId: p.taskId,
      kind: 'hairstyle' as const,
      origin: 'hair' as const,
      title: p.template.title,
      photo: p.selfie,
      createdAt: p.createdAt,
      save: {
        title: p.template.title,
        designSource: 'template' as const,
        designId: p.template.id,
        origin: 'hair' as const,
      },
    })),
    ...hairColor.map((p) => ({
      taskId: p.taskId,
      kind: 'hair_color' as const,
      origin: 'hairColor' as const,
      title: p.choice.name,
      photo: p.photo,
      createdAt: p.createdAt,
      save: { title: p.choice.name, designSource: p.choice.source, origin: 'hairColor' as const },
    })),
  ];
}

/** Re-reads a finished task: a fresh result link plus its source-photo hash. Creates nothing. */
function readTask(preview: LocalPreview) {
  if (preview.origin === 'hair') return getHairstyleTask(preview.taskId);
  if (preview.origin === 'hairColor') return getHairColorTask(preview.taskId);
  return getNailTask(preview.kind === 'nail_vto' ? 'nail_vto' : 'nail_transfer', preview.taskId);
}

const ratio = (width: number | null | undefined, height: number | null | undefined) =>
  width && height ? Math.min(1.25, Math.max(0.75, width / height)) : 1;

async function loadLooks(local: LocalPreview[]): Promise<{ looks: BattleLook[]; unavailable: number }> {
  const saved: SavedLook[] = await listSavedLooks();
  const savedTasks = new Set(saved.map((look) => look.taskId));
  const localByTask = new Map(local.map((preview) => [preview.taskId, preview]));
  // The original photo is shown only if its file is still on this device.
  const originalOf = async (taskId: string) => {
    const uri = localByTask.get(taskId)?.photo.uri;
    return uri && (await isPhotoReadable(uri)) ? uri : null;
  };

  const looks: BattleLook[] = [];
  for (const look of saved) {
    // Looks saved before source photos were recorded cannot be paired honestly.
    if (!look.sourcePhotoHash) continue;
    looks.push({
      key: look.taskId,
      category: categoryOf(look.kind),
      kind: look.kind,
      effectType: look.effectType,
      config: look.config,
      title: look.title,
      photoHash: look.sourcePhotoHash,
      imageUrl: look.imageUrl,
      aspectRatio: ratio(look.imageWidth, look.imageHeight),
      createdAt: Date.parse(look.createdAt),
      savedLookId: look.id,
      note: look.note,
      originalUri: await originalOf(look.taskId),
      save: null,
    });
  }

  // Unsaved session previews qualify only while YouCam still serves their result.
  let unavailable = 0;
  const unsaved = local.filter((preview) => !savedTasks.has(preview.taskId));
  const reads = await Promise.allSettled(unsaved.map(readTask));
  for (const [index, preview] of unsaved.entries()) {
    const read = reads[index];
    const task = read.status === 'fulfilled' ? read.value : null;
    if (!task || task.status !== 'success' || !task.resultUrl || !task.sourcePhotoHash) {
      unavailable++;
      continue;
    }
    looks.push({
      key: preview.taskId,
      category: categoryOf(preview.kind),
      kind: preview.kind,
      effectType: task.effectType ?? null,
      config: task.config ?? null,
      title: preview.title,
      photoHash: task.sourcePhotoHash,
      imageUrl: task.resultUrl,
      aspectRatio: ratio(preview.photo.width, preview.photo.height),
      createdAt: preview.createdAt,
      savedLookId: null,
      note: null,
      originalUri: await originalOf(preview.taskId),
      save: preview.save,
    });
  }
  return { looks, unavailable };
}

/**
 * Every look Look Battle may compare: saved looks plus this device's unsaved previews whose
 * results are still available. Reading them never creates, reprocesses or saves anything.
 */
export function useBattleLooks() {
  const local = useLocalPreviews();
  const query = useQuery({
    queryKey: [...BATTLE_LOOKS_QUERY_KEY, local.map((preview) => preview.taskId).join(',')],
    queryFn: () => loadLooks(local),
    staleTime: 60_000,
    retry: false,
  });
  return {
    looks: query.data?.looks ?? [],
    unavailable: query.data?.unavailable ?? 0,
    isPending: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
  };
}
