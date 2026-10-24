import { useQuery } from '@tanstack/react-query';
import { Redirect, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { FlowHeader } from '@/components/ui/flow-header';
import { FooterBar } from '@/components/ui/footer-bar';
import { Icon } from '@/components/ui/icon';
import { Thumb } from '@/components/ui/thumb';
import { HAIR_STEPS, TemplateImage } from '@/features/hair/components';
import { HAIR_TEMPLATES_QUERY_KEY, listHairTemplates, type HairTemplate } from '@/features/hair/hair-api';
import { useHairSession } from '@/features/hair/hair-session';
import { colors, shadows } from '@/theme';

function TemplateCard({
  template,
  selected,
  onPress,
}: {
  template: HairTemplate;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={template.title}
      onPress={onPress}
      style={selected ? shadows.card : undefined}
      className={`flex-1 gap-2 rounded-lg border-2 bg-card p-2 ${selected ? 'border-plum' : 'border-blush'}`}>
      <View>
        <TemplateImage template={template} />
        {selected ? (
          <View className="absolute right-2 top-2 h-6 w-6 items-center justify-center rounded-full bg-plum">
            <Icon name="check" size={13} color={colors.white} strokeWidth={2.6} />
          </View>
        ) : null}
      </View>
      <View className="gap-0.5 px-1 pb-1">
        <Text numberOfLines={2} className="font-sans-semibold text-label-s text-ink">
          {template.title}
        </Text>
      </View>
    </Pressable>
  );
}

// P4A-5 — Hairstyle gallery. The styles are YouCam's own predefined templates (no units to list).
export default function HairStyles() {
  const insets = useSafeAreaInsets();
  const selfie = useHairSession((state) => state.selfie);
  const template = useHairSession((state) => state.template);
  const setTemplate = useHairSession((state) => state.setTemplate);
  const [search, setSearch] = useState('');

  const {
    data: templates = [],
    isPending,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: HAIR_TEMPLATES_QUERY_KEY,
    queryFn: listHairTemplates,
    staleTime: 30 * 60_000,
  });

  // YouCam's only categories are gendered; the design rules out gender filters and labels, so
  // every style is shown to everyone and search matches style names only.
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? templates.filter((item) => item.title.toLowerCase().includes(term)) : templates;
  }, [templates, search]);

  if (!selfie) return <Redirect href="/hair/photo" />;

  const rows: HairTemplate[][] = [];
  for (let i = 0; i < visible.length; i += 2) rows.push(visible.slice(i, i + 2));

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <FlowHeader step={2} steps={HAIR_STEPS} />
      <ScrollView
        contentContainerClassName="gap-4 pb-6 pt-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="gap-4 px-5">
          <Text accessibilityRole="header" className="font-serif text-hero text-ink">
            Find Your Next <Text className="font-serif-italic text-plum">Hairstyle.</Text>
          </Text>

          <View className="flex-row items-center gap-3 rounded-lg border border-blush bg-card p-3">
            <Thumb uri={selfie.uri} size={48} />
            <View className="flex-1">
              <Text className="font-sans-semibold text-label-s text-ink">Your photo</Text>
              <Text className="font-sans text-body-s text-muted">Kept while you browse</Text>
            </View>
            <Text
              accessibilityRole="button"
              onPress={() => router.push('/hair/photo?edit=1')}
              className="py-2 pl-3 font-sans-semibold text-label-s text-plum">
              Change
            </Text>
          </View>

          <View className="h-[52px] flex-row items-center gap-2.5 rounded-full border border-line bg-card px-[18px]">
            <Icon name="search" size={20} color={colors.muted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search hairstyles"
              placeholderTextColor={colors.placeholder}
              accessibilityLabel="Search hairstyles"
              returnKeyType="search"
              autoCorrect={false}
              className="h-12 flex-1 p-0 font-sans text-[16px] text-ink"
            />
          </View>
        </View>

        <View className="gap-3 px-5">
          <View className="flex-row items-center justify-between">
            <Text className="font-sans-semibold text-overline uppercase text-muted">YouCam hairstyles</Text>
            {!isPending && !isError ? (
              <Text className="font-sans text-body-s text-muted">
                {visible.length} {visible.length === 1 ? 'style' : 'styles'}
              </Text>
            ) : null}
          </View>

          {isPending ? (
            <View className="items-center gap-3 py-10">
              <ActivityIndicator color={colors.plum} />
              <Text className="font-sans text-body-m text-muted">Loading hairstyles…</Text>
            </View>
          ) : isError ? (
            <View accessibilityLiveRegion="polite" className="gap-2 rounded-lg bg-blush p-4">
              <Text className="font-sans-semibold text-label-s text-ink">Hairstyles couldn’t be loaded.</Text>
              <Text className="font-sans text-body-s text-muted">
                Check your connection and try again. Your photo is kept.
              </Text>
              <Text
                accessibilityRole="button"
                onPress={() => refetch()}
                className="self-start py-1.5 font-sans-semibold text-label-s text-plum">
                {isRefetching ? 'Trying…' : 'Try Again'}
              </Text>
            </View>
          ) : visible.length === 0 ? (
            <View className="gap-1 rounded-lg bg-blush p-4">
              <Text className="font-sans-semibold text-label-s text-ink">No hairstyles match.</Text>
              <Text className="font-sans text-body-s text-muted">Try another search or filter.</Text>
            </View>
          ) : (
            rows.map((row) => (
              <View key={row[0].id} className="flex-row gap-3">
                {row.map((item) => (
                  <TemplateCard
                    key={item.id}
                    template={item}
                    selected={template?.id === item.id}
                    onPress={() => setTemplate(item)}
                  />
                ))}
                {row.length === 1 ? <View className="flex-1" /> : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <FooterBar>
        <View className="flex-row items-center justify-between gap-4">
          <Text className="font-sans text-body-s text-muted">Selected</Text>
          <Text numberOfLines={1} className="flex-1 text-right font-sans-semibold text-label-s text-ink">
            {template ? template.title : 'No hairstyle yet'}
          </Text>
        </View>
        <Button
          label="Preview This Hairstyle"
          trailingIcon="arrowRight"
          disabled={!template}
          onPress={() => router.push('/hair/review')}
        />
      </FooterBar>
    </View>
  );
}
