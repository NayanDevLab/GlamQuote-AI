import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { SettingsNote, SettingsRow, SettingsScreen, SettingsSection } from '@/features/settings/list';
import { colors } from '@/theme';

type Service = { icon: IconName; name: string; role: string; gets: string[]; note: string };

// Every line describes what the app and its Edge Functions actually do today.
const SERVICES: Service[] = [
  {
    icon: 'image',
    name: 'YouCam',
    role: 'Creates your try-on previews',
    gets: [
      'Your photo (and, for Nail Transfer, the reference photo) with the style you picked',
      'Only after you agree on the Review screen and tap to generate',
    ],
    note: 'YouCam processes images under its own terms, which GlamQuote doesn’t control.',
  },
  {
    icon: 'sparkle',
    name: 'Gemini',
    role: 'Text-only style suggestions',
    gets: [
      'Style details (like “cream finish, almond shape”) and the preferences you choose',
      'Never your photos, previews or image links',
    ],
    note: 'A note you write goes to Gemini only if you turn sharing on for that question.',
  },
  {
    icon: 'lock',
    name: 'GlamQuote storage',
    role: 'Keeps what you save',
    gets: [
      'Saved previews as private images, with their title, style settings and your note',
      'A record of each preview request (feature, style and status) for daily limits',
    ],
    note: 'Your original photos are never stored. Only you can open your saved looks from this app.',
  },
];

const STEPS = [
  'You choose a photo. It stays on this phone until you continue.',
  'On Review, you agree to send it to YouCam.',
  'YouCam creates the preview. Its link lasts about two hours.',
  'It’s kept only if you tap Save to Lookbook.',
];

function ServiceCard({ service }: { service: Service }) {
  return (
    <View className="gap-2.5 rounded-[20px] border border-blush bg-card p-3.5">
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-blush">
          <Icon name={service.icon} size={20} color={colors.plum} />
        </View>
        <View className="flex-1">
          <Text className="font-sans-semibold text-label-s text-ink">{service.name}</Text>
          <Text className="font-sans text-caption text-muted">{service.role}</Text>
        </View>
      </View>
      {service.gets.map((line) => (
        <View key={line} className="flex-row gap-2">
          <Icon name="check" size={16} color={colors.plum} strokeWidth={2.2} />
          <Text className="flex-1 font-sans text-body-s text-ink">{line}</Text>
        </View>
      ))}
      <Text className="font-sans text-caption text-muted">{service.note}</Text>
    </View>
  );
}

// P7A — Privacy & Photos (information only; nothing here changes data).
export default function PrivacyPhotos() {
  return (
    <SettingsScreen title="Privacy & Photos" backLabel="Back to Settings">
      <View className="gap-1.5 px-1">
        <Text accessibilityRole="header" className="font-serif text-title-xl text-ink">
          Your Photos. <Text className="font-serif-italic text-plum">Your Choice.</Text>
        </Text>
        <Text className="font-sans text-body-m text-muted">
          Three services help make your previews. Here’s what each one gets.
        </Text>
      </View>

      {SERVICES.map((service) => (
        <ServiceCard key={service.name} service={service} />
      ))}

      <View className="gap-2">
        <Text accessibilityRole="header" className="px-1 font-sans-semibold text-overline uppercase text-muted">
          How photo processing works
        </Text>
        <View className="gap-3 rounded-[20px] border border-blush bg-card p-3.5">
          {STEPS.map((step, index) => (
            <View key={step} className="flex-row items-center gap-3">
              <View
                className={`h-8 w-8 items-center justify-center rounded-full ${index === 0 ? 'bg-plum' : 'bg-blush'}`}>
                <Text
                  className={`font-serif-italic text-[18px] leading-[22px] ${index === 0 ? 'text-white' : 'text-plum'}`}>
                  {index + 1}
                </Text>
              </View>
              <Text className="flex-1 font-sans text-body-m text-ink">{step}</Text>
            </View>
          ))}
        </View>
      </View>

      <SettingsSection title="Manage">
        <SettingsRow
          first
          icon="bookmark"
          title="Manage Saved Looks"
          subtitle="See everything you’ve saved in your Lookbook"
          onPress={() => router.navigate('/lookbook')}
        />
      </SettingsSection>
      <SettingsNote>
        Deleting saved looks from inside the app isn’t available in this version yet. Saved looks stay private to this
        guest on this phone.
      </SettingsNote>
    </SettingsScreen>
  );
}
