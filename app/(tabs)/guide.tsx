import { ScrollView, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';

import { GuidePanel } from '@/components/GuidePanel';
import { PaperBackground } from '@/components/PaperBackground';
import { Theme } from '@/constants/Theme';
import { useMemos } from '@/context/MemoContext';

export default function GuideScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { createMemo } = useMemos();

  return (
    <PaperBackground>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(400)}>
          <Text style={styles.eyebrow}>提问模板</Text>
          <Text style={styles.brand}>人生指南</Text>
          <Text style={styles.lead}>
            按《高性价比人生指南》查了再答。该不该做、值不值、出事了先做什么，都可以问。
          </Text>
        </Animated.View>

        <GuidePanel
          onSaveAsMemo={async ({ title, note }) => {
            const memo = await createMemo({ title, note });
            router.push(`/memo/${memo.id}`);
          }}
        />
      </ScrollView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Theme.space.lg,
  },
  eyebrow: {
    fontFamily: Theme.fonts.bodyMedium,
    fontSize: 12,
    color: Theme.colors.muted,
    letterSpacing: 1,
    marginBottom: 6,
  },
  brand: {
    fontFamily: Theme.fonts.display,
    fontSize: 40,
    lineHeight: 50,
    color: Theme.colors.ink,
  },
  lead: {
    marginTop: Theme.space.sm,
    marginBottom: Theme.space.xl,
    fontFamily: Theme.fonts.body,
    fontSize: 15,
    lineHeight: 24,
    color: Theme.colors.inkSoft,
    maxWidth: 340,
  },
});
