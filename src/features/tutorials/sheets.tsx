import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { InlineNote } from '@/components/ui/typography';

/**
 * First-use tutorial sheets for the Nail, Hair, Hair Color and Lookbook screens. Each screen shows
 * its sheet on the first visit and from its own ?, and the Help Center replays the same sheets.
 * `onStart` is the primary action: the screens start their flow, Help opens the feature. Neither
 * ever starts a YouCam preview.
 */
type TutorialProps = { visible: boolean; onClose: () => void; onStart?: () => void };

function Steps({ steps }: { steps: readonly string[] }) {
  return (
    <View className="gap-3 rounded-[22px] border border-blush bg-card p-3">
      {steps.map((step, index) => (
        <View key={step} className="flex-row items-center gap-3">
          <View className={`h-8 w-8 items-center justify-center rounded-full ${index === 0 ? 'bg-plum' : 'bg-blush'}`}>
            <Text
              className={`font-serif-italic text-[18px] leading-[22px] ${index === 0 ? 'text-white' : 'text-plum'}`}>
              {index + 1}
            </Text>
          </View>
          <Text className="flex-1 font-sans text-body-m text-ink">{step}</Text>
        </View>
      ))}
    </View>
  );
}

function SkipLink({ onPress }: { onPress: () => void }) {
  return (
    <Text
      accessibilityRole="button"
      onPress={onPress}
      className="self-center px-4 py-2 font-sans-semibold text-label text-plum">
      Skip Tutorial
    </Text>
  );
}

const start = (onClose: () => void, onStart?: () => void) => () => {
  onClose();
  onStart?.();
};

export function NailTutorial({ visible, onClose, onStart }: TutorialProps) {
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      eyebrow="Nail Studio"
      title={
        <>
          How Nail Try-On <Text className="font-serif-italic text-plum">Works</Text>
        </>
      }>
      <Text className="font-sans text-body-m text-muted">
        Two ways to try a look. Both start with a clear photo of your hand.
      </Text>
      <Steps
        steps={[
          'Add a clear photo of your hand.',
          'Choose an inspiration or customize your nails.',
          'Generate a preview and compare your results.',
        ]}
      />
      <Text className="font-sans text-caption text-muted">Replay this anytime from the ? at the top.</Text>
      <Button label="Let’s Try It" onPress={start(onClose, onStart)} />
    </Sheet>
  );
}

export function HairTutorial({ visible, onClose, onStart }: TutorialProps) {
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      eyebrow="Hair Studio · First time"
      title={
        <>
          How Hair Try-On <Text className="font-serif-italic text-plum">Works</Text>
        </>
      }>
      <Steps
        steps={[
          'Add a clear photo of yourself.',
          'Choose a hairstyle from the gallery.',
          'Generate a preview, compare and save your favorites.',
        ]}
      />
      <Text className="font-sans text-caption text-muted">
        Works from a photo, not a live camera. Replay this anytime from the ? at the top.
      </Text>
      <Button label="Let’s Try It" onPress={start(onClose, onStart)} />
      <SkipLink onPress={onClose} />
    </Sheet>
  );
}

export function HairColorTutorial({ visible, onClose, onStart }: TutorialProps) {
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      eyebrow="Hair Color · First time"
      title={
        <>
          How Hair Color <Text className="font-serif-italic text-plum">Works</Text>
        </>
      }>
      <Steps
        steps={[
          'Add a clear photo of your hair.',
          'Choose a full color or ombre style.',
          'Generate your YouCam preview, compare and save.',
        ]}
      />
      <Text className="font-sans text-caption text-muted">
        Swatches are samples until you generate. Replay this anytime from the ? at the top.
      </Text>
      <Button label="Let’s Try It" onPress={start(onClose, onStart)} />
      <SkipLink onPress={onClose} />
    </Sheet>
  );
}

export function LookbookTutorial({ visible, onClose }: TutorialProps) {
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      eyebrow="Lookbook"
      title={
        <>
          Your Personal <Text className="font-serif-italic text-plum">Style Collection</Text>
        </>
      }>
      <Steps
        steps={[
          'Save your favorite YouCam-generated previews.',
          'Revisit and compare your looks.',
          'Pick a favorite with Look Battle.',
        ]}
      />
      <InlineNote icon="lock" size="sm">
        Your saved looks are private to you. Nothing is shared unless you choose to share it.
      </InlineNote>
      <Button label="Got It" onPress={onClose} />
    </Sheet>
  );
}
