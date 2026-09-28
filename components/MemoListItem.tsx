import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Theme } from '@/constants/Theme';
import type { Memo } from '@/lib/types';

type Props = {
  memo: Memo;
  index: number;
  onPress: () => void;
};

export function MemoListItem({ memo, index, onPress }: Props) {
  const doneSteps = memo.steps.filter((s) => s.done).length;
  const totalSteps = memo.steps.length;
  const overdue =
    memo.status === 'pending' &&
    memo.dueAt &&
    new Date(memo.dueAt).getTime() < Date.now();

  return (
    <Animated.View entering={FadeInUp.delay(Math.min(index, 8) * 40).duration(320)}>
      <Pressable onPress={onPress} style={styles.row}>
        <View style={[styles.dot, memo.status === 'done' && styles.dotDone]} />
        <View style={styles.body}>
          <Text style={[styles.title, memo.status === 'done' && styles.titleDone]} numberOfLines={2}>
            {memo.title}
          </Text>
          <View style={styles.meta}>
            {totalSteps > 0 ? (
              <Text style={styles.metaText}>
                已完成 {doneSteps}/{totalSteps} 步
              </Text>
            ) : (
              <Text style={styles.metaText}>随手记下</Text>
            )}
            {overdue ? <Text style={styles.overdue}>还在等你</Text> : null}
            {memo.reminderRule ? <Text style={styles.metaText}>有轻提醒</Text> : null}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.colors.line,
    gap: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 7,
    backgroundColor: Theme.colors.warm,
  },
  dotDone: {
    backgroundColor: Theme.colors.muted,
  },
  body: {
    flex: 1,
  },
  title: {
    fontFamily: Theme.fonts.bodyMedium,
    fontSize: 17,
    color: Theme.colors.ink,
    lineHeight: 24,
  },
  titleDone: {
    color: Theme.colors.muted,
    textDecorationLine: 'line-through',
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  metaText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: Theme.colors.muted,
  },
  overdue: {
    fontFamily: Theme.fonts.bodyMedium,
    fontSize: 12,
    color: Theme.colors.warm,
  },
});
