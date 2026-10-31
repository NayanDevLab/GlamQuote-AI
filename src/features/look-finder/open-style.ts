import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';

import { useHairColorSession } from '@/features/hair-color/hair-color-session';
import { FULL_PRESETS, ombrePresetName, OMBRE_PRESETS } from '@/features/hair-color/presets';
import { HAIR_TEMPLATES_QUERY_KEY, listHairTemplates } from '@/features/hair/hair-api';
import { useHairSession } from '@/features/hair/hair-session';
import { useNailSession } from '@/features/nail/nail-session';
import type { Finger } from '@/features/nail/vto';

import type { CatalogueStyle } from './catalogue';

const allFingers = (hex: string): Record<Finger, string> => ({
  thumb: hex,
  index: hex,
  middle: hex,
  ring: hex,
  pinky: hex,
});

/**
 * "Try This Look": preselects the catalogue style in its existing Studio and opens it. This only
 * edits that Studio's local draft — nothing is uploaded or generated. The user still chooses a
 * photo, reviews, consents and taps Generate there. Destinations come from the trusted catalogue.
 */
export async function openStyle(style: CatalogueStyle, queryClient: QueryClient): Promise<void> {
  const d = style.destination;
  switch (d.studio) {
    case 'hairstyle': {
      const templates = await queryClient.fetchQuery({
        queryKey: HAIR_TEMPLATES_QUERY_KEY,
        queryFn: listHairTemplates,
        staleTime: 30 * 60_000,
      });
      const template = templates.find((item) => item.id === d.templateId);
      if (!template) throw new Error('This hairstyle is not available right now.');
      useHairSession.getState().setTemplate(template);
      router.push('/hair/styles');
      return;
    }
    case 'hair_color': {
      const session = useHairColorSession.getState();
      session.setMode(d.mode);
      if (d.mode === 'full') {
        const presetIndex = FULL_PRESETS.findIndex((preset) => preset.name === d.preset);
        if (presetIndex < 0) throw new Error('This shade is not available right now.');
        session.updateFull({ source: 'preset', presetIndex });
        router.push('/hair/color/full');
      } else {
        const presetIndex = OMBRE_PRESETS.findIndex((_, index) => ombrePresetName(index) === d.preset);
        if (presetIndex < 0) throw new Error('This ombre is not available right now.');
        session.updateOmbre({ source: 'preset', presetIndex });
        router.push('/hair/color/ombre');
      }
      return;
    }
    case 'nail_polish': {
      const session = useNailSession.getState();
      session.setVtoMode('polish');
      session.updatePolish({ applyToAll: true, colors: allFingers(d.color), finish: d.finish });
      router.push('/nail/editor');
      return;
    }
    case 'press_on': {
      const session = useNailSession.getState();
      session.setVtoMode('press');
      session.updatePress({ tip: d.tip, base: d.base, length: d.length, color: d.color, finish: d.finish });
      router.push('/nail/editor');
      return;
    }
  }
}

/** "Try This Look" with one-at-a-time opening and a readable problem message. */
export function useTryLook() {
  const queryClient = useQueryClient();
  const [opening, setOpening] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const tryLook = async (style: CatalogueStyle) => {
    if (opening) return;
    setOpening(style.id);
    setProblem(null);
    try {
      await openStyle(style, queryClient);
    } catch (error) {
      setProblem(error instanceof Error ? error.message : 'This style couldn’t be opened right now.');
    } finally {
      setOpening(null);
    }
  };
  return { tryLook, opening, problem };
}

/** The settings a catalogue style preselects, in plain words (from its trusted destination). */
export function styleSetupLines(style: CatalogueStyle): string[] {
  const d = style.destination;
  switch (d.studio) {
    case 'hairstyle':
      return [`YouCam hairstyle template: ${style.name}`];
    case 'hair_color':
      return [`${d.mode === 'full' ? 'Full color' : 'Ombre'} preset: ${d.preset}`];
    case 'nail_polish':
      return [
        `Color: ${style.name.split(' · ')[0]} (${d.color})`,
        `Finish: ${style.name.split(' · ')[1]}`,
        'All fingers',
      ];
    case 'press_on': {
      const [shapeAndLength, colorAndFinish] = style.name.split(' · ');
      const cap = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);
      return [
        `${cap(d.tip)} tip, ${cap(d.base)} base`,
        `Length: ${shapeAndLength.replace(/\s*\S+$/, '')}`,
        `Color & finish: ${colorAndFinish} (${d.color})`,
      ];
    }
  }
}
