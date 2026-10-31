import Constants from 'expo-constants';
import { Platform, Text, View } from 'react-native';

import { Monogram } from '@/components/ui/brand';
import { InlineNote } from '@/components/ui/typography';
import { SettingsNote, SettingsRow, SettingsScreen, SettingsSection } from '@/features/settings/list';

const VERSION = Constants.expoConfig?.version ?? '1.0.0';

// P7A — About. Legal links are left out until real Privacy Policy and Terms pages exist.
export default function About() {
  return (
    <SettingsScreen title="About" backLabel="Back to Settings">
      <View className="items-center gap-3 pt-2">
        <Monogram size="lg" />
        <Text accessibilityRole="header" className="text-center font-serif text-title-xl text-ink">
          Your Look. <Text className="font-serif-italic text-plum">Your Choice.</Text>
        </Text>
        <Text className="font-sans text-caption text-muted">
          Version {VERSION} · {Platform.OS === 'android' ? 'Android' : Platform.OS}
        </Text>
        <Text className="text-center font-sans text-body-m text-muted">
          GlamQuote helps you discover, try on, compare and choose hairstyles, hair colors and nail designs before
          making a real-world change.
        </Text>
      </View>

      <SettingsSection title="Technology">
        <SettingsRow
          first
          icon="image"
          title="Virtual try-on"
          subtitle="Perfect Corp. YouCam APIs: Nail Transfer, Nail Virtual Try-On, Hairstyle and Hair Color"
        />
        <SettingsRow
          icon="sparkle"
          title="Decision support"
          subtitle="Text-only style suggestions use Google’s Gemini API"
        />
        <SettingsRow
          icon="lock"
          title="Data & images"
          subtitle="Supabase (guest accounts and saved-look details) and Cloudinary (private saved images)"
        />
      </SettingsSection>

      <SettingsNote>
        GlamQuote is an independent app. It isn’t affiliated with, sponsored or endorsed by Perfect Corp. or Google.
        Product names belong to their owners.
      </SettingsNote>

      <InlineNote icon="info" centered size="sm">
        AI previews are illustrative. Real-world results may vary.
      </InlineNote>
    </SettingsScreen>
  );
}
