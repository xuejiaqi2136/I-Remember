import { Link, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';

import { MemoListItem } from '@/components/MemoListItem';
import { PaperBackground } from '@/components/PaperBackground';
import { Theme } from '@/constants/Theme';
import { useMemos } from '@/context/MemoContext';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { memos, ready } = useMemos();
  const [showDone, setShowDone] = useState(false);

  const pending = useMemo(() => memos.filter((m) => m.status === 'pending'), [memos]);
  const done = useMemo(() => memos.filter((m) => m.status === 'done'), [memos]);

  return (
    <PaperBackground>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(450)}>
          <Text style={styles.brand}>我记着呢</Text>
          <Text style={styles.tagline}>你慢慢来，我替你记着。</Text>
        </Animated.View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>进行中</Text>
          {!ready ? (
            <Text style={styles.empty}>正在打开笔记本…</Text>
          ) : pending.length === 0 ? (
            <Text style={styles.empty}>此刻空着也很好。想到什么就记一笔。</Text>
          ) : (
            pending.map((memo, index) => (
              <MemoListItem
                key={memo.id}
                memo={memo}
                index={index}
                onPress={() => router.push(`/memo/${memo.id}`)}
              />
            ))
          )}
        </View>

        {done.length > 0 ? (
          <View style={styles.section}>
            <Pressable onPress={() => setShowDone((v) => !v)} style={styles.doneToggle}>
              <Text style={styles.sectionTitle}>已完成 · {done.length}</Text>
              <Text style={styles.toggleHint}>{showDone ? '收起' : '展开'}</Text>
            </Pressable>
            {showDone
              ? done.map((memo, index) => (
                  <MemoListItem
                    key={memo.id}
                    memo={memo}
                    index={index}
                    onPress={() => router.push(`/memo/${memo.id}`)}
                  />
                ))
              : null}
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.fabWrap, { bottom: insets.bottom + 24 }]}>
        <Link href="/memo/new" asChild>
          <Pressable style={styles.fab}>
            <Text style={styles.fabText}>记一笔</Text>
          </Pressable>
        </Link>
      </View>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Theme.space.lg,
  },
  brand: {
    fontFamily: Theme.fonts.display,
    fontSize: 48,
    lineHeight: 58,
    color: Theme.colors.ink,
    letterSpacing: 1,
  },
  tagline: {
    marginTop: Theme.space.sm,
    fontFamily: Theme.fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: Theme.colors.inkSoft,
    maxWidth: 280,
  },
  section: {
    marginTop: Theme.space.xxl,
  },
  sectionTitle: {
    fontFamily: Theme.fonts.bodyMedium,
    fontSize: 13,
    color: Theme.colors.muted,
    marginBottom: Theme.space.sm,
    letterSpacing: 0.5,
  },
  empty: {
    fontFamily: Theme.fonts.body,
    fontSize: 15,
    lineHeight: 24,
    color: Theme.colors.inkSoft,
    paddingVertical: Theme.space.md,
  },
  doneToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleHint: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: Theme.colors.accent,
  },
  fabWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fab: {
    backgroundColor: Theme.colors.accent,
    paddingHorizontal: 34,
    paddingVertical: 14,
    borderRadius: Theme.radius.md,
    shadowColor: '#1F2A24',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  fabText: {
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.white,
    fontSize: 17,
  },
});
