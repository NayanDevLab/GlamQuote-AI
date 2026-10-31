import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { useGuestStatus, type GuestStatus } from '@/features/settings/guest';
import { SettingsRow, SettingsScreen, SettingsSection } from '@/features/settings/list';
import { resetAllTutorials } from '@/features/tutorials/reset';
import { useAppStore } from '@/state/app-store';
import { colors } from '@/theme';

const VERSION = Constants.expoConfig?.version ?? '1.0.0';

function guestLine(status: GuestStatus): string {
  switch (status.state) {
    case 'loading':
      return 'Checking this device…';
    case 'guest':
      return `Guest since ${status.since.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`;
    case 'none':
      return 'Your guest account is created the first time you try a look.';
    case 'unavailable':
      return 'Guest mode isn’t available right now.';
  }
}

// P7A-1 — Settings & Profile. Only sections backed by a real feature are shown.
export default function Settings() {
  const guest = useGuestStatus();
  const [tutorialsReset, setTutorialsReset] = useState(false);

  return (
    <SettingsScreen title="Settings" backLabel="Back to Home">
      <Text accessibilityRole="header" className="px-1 font-serif text-title-xl text-ink">
        Your <Text className="font-serif-italic text-plum">GlamQuote</Text>
      </Text>

      <View className="gap-2">
        <Text accessibilityRole="header" className="px-1 font-sans-semibold text-overline uppercase text-muted">
          Account
        </Text>
        <View className="gap-2.5 rounded-[22px] border border-blush bg-card p-3.5">
          <View className="flex-row items-center gap-3">
            <View className="h-[52px] w-[52px] items-center justify-center rounded-full bg-plum">
              <Icon name="user" size={24} color={colors.plumTint} />
            </View>
            <View className="flex-1 gap-0.5">
              <View className="flex-row items-center gap-2">
                <Text className="font-sans-semibold text-label-l text-ink">Guest</Text>
                <Text className="rounded-full bg-blush px-2 py-0.5 font-sans-bold text-[12px] leading-[15px] text-plum">
                  Guest mode
                </Text>
              </View>
              <Text className="font-sans text-caption text-muted">{guestLine(guest)}</Text>
            </View>
          </View>
          <Text className="font-sans text-body-s text-muted">
            No sign-up needed. Your saved looks are linked to this app on this phone. Uninstalling GlamQuote or clearing
            its app data removes access to them — there’s no account to sign back into.
          </Text>
        </View>
      </View>

      <SettingsSection title="My experience">
        <SettingsRow
          first
          icon="help"
          title="Tutorials & Help"
          subtitle="Replay any feature guide"
          onPress={() => router.push('/help')}
        />
        <SettingsRow
          icon="replay"
          title="Replay Onboarding"
          subtitle="Brings you back here when you finish"
          onPress={() => {
            useAppStore.getState().replayOnboarding('/settings');
            router.push('/discover');
          }}
        />
        <SettingsRow
          icon="bookmark"
          title="Manage Saved Looks"
          subtitle="Open your Lookbook"
          onPress={() => router.navigate('/lookbook')}
        />
        <SettingsRow
          icon="shield"
          title="Privacy & Photos"
          subtitle="What’s shared, what’s saved, and where"
          onPress={() => router.push('/settings/privacy')}
        />
      </SettingsSection>

      <SettingsSection title="Preferences">
        <SettingsRow
          first
          icon="replay"
          title="Reset all tutorials"
          subtitle="Show each feature’s guide again on its next visit"
          onPress={() => {
            resetAllTutorials();
            setTutorialsReset(true);
          }}
        />
        <SettingsRow
          icon="globe"
          title="Language"
          subtitle="English is the only language available right now"
          trailing={<Text className="font-sans text-body-s text-muted">English</Text>}
        />
      </SettingsSection>

      {tutorialsReset ? (
        <View
          accessibilityLiveRegion="polite"
          className="-mt-2 flex-row items-center gap-2 rounded-[14px] bg-ink px-3 py-2.5">
          <View className="h-5 w-5 items-center justify-center rounded-full bg-champagne">
            <Icon name="check" size={12} color={colors.ink} strokeWidth={3} />
          </View>
          <Text className="flex-1 font-sans text-caption text-canvas">
            Tutorials will show again the next time you open each feature.
          </Text>
        </View>
      ) : null}

      <SettingsSection title="Information">
        <SettingsRow
          first
          icon="info"
          title="About GlamQuote"
          subtitle="Version, technology and notices"
          onPress={() => router.push('/settings/about')}
        />
      </SettingsSection>

      <Text className="text-center font-sans text-caption text-muted">GlamQuote AI · Version {VERSION}</Text>
    </SettingsScreen>
  );
}
