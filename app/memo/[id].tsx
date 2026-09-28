import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { BreakDownPanel } from '@/components/BreakDownPanel';
import { Celebration } from '@/components/Celebration';
import { MotivationSheet } from '@/components/MotivationSheet';
import { PaperBackground } from '@/components/PaperBackground';
import { Theme } from '@/constants/Theme';
import { useMemos } from '@/context/MemoContext';
import { memoDoneCopy, motivationCopy, stepDoneCopy } from '@/lib/copy';
import { createId } from '@/lib/id';
import {
  cancelReminder,
  ensureNotificationPermission,
  scheduleMemoReminder,
} from '@/lib/notifications';
import type { MemoStep, ReminderRepeat } from '@/lib/types';

function defaultReminderAt(): string {
  const d = new Date();
  d.setHours(d.getHours() + 2, 0, 0, 0);
  return d.toISOString();
}

export default function MemoDetailScreen() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const router = useRouter();
  const { getMemo, updateMemo, setSteps, removeMemo, setReminder } = useMemos();
  const memo = getMemo(id);

  const [stepTitle, setStepTitle] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const [showMotivation, setShowMotivation] = useState(false);
  const [motivation, setMotivation] = useState('');
  const [highlightStepId, setHighlightStepId] = useState<string | null>(null);
  const [repeat, setRepeat] = useState<ReminderRepeat>('once');
  const [remindAt, setRemindAt] = useState(defaultReminderAt());
  const [showReminder, setShowReminder] = useState(false);

  const overdue = useMemo(() => {
    if (!memo || memo.status !== 'pending') return false;
    if (memo.dueAt && new Date(memo.dueAt).getTime() < Date.now()) return true;
    if (memo.reminderRule && new Date(memo.reminderRule.at).getTime() < Date.now()) return true;
    return false;
  }, [memo]);

  useEffect(() => {
    if (!memo) return;
    if (memo.reminderRule) {
      setRepeat(memo.reminderRule.repeat);
      setRemindAt(memo.reminderRule.at);
    }
  }, [memo?.id]);

  useEffect(() => {
    if (!memo || memo.status === 'done') return;
    const fromNotify = from === 'notify';
    if (fromNotify || overdue || memo.snoozeCount >= 2) {
      setMotivation(motivationCopy(memo.snoozeCount + memo.title.length));
      setShowMotivation(true);
      if (fromNotify) {
        updateMemo(memo.id, { snoozeCount: memo.snoozeCount + 1 }).catch(() => undefined);
      }
    }
  }, [memo?.id, from]);

  if (!memo) {
    return (
      <PaperBackground>
        <View style={styles.missing}>
          <Text style={styles.missingText}>这条备忘好像不在了。</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.link}>回去看看</Text>
          </Pressable>
        </View>
      </PaperBackground>
    );
  }

  const current = memo;
  const doneSteps = current.steps.filter((s) => s.done).length;

  async function addStep() {
    const title = stepTitle.trim();
    if (!title) return;
    const next: MemoStep[] = [
      ...current.steps,
      { id: createId('step'), title, done: false, order: current.steps.length },
    ];
    await setSteps(current.id, next);
    setStepTitle('');
  }

  async function toggleStep(stepId: string) {
    const next = current.steps.map((s) =>
      s.id === stepId ? { ...s, done: !s.done } : s
    );
    const turnedOn = next.find((s) => s.id === stepId)?.done;
    await setSteps(current.id, next);
    if (turnedOn) {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // web / unavailable
      }
      setToast(stepDoneCopy());
    }
  }

  async function removeStep(stepId: string) {
    await setSteps(
      current.id,
      current.steps.filter((s) => s.id !== stepId).map((s, i) => ({ ...s, order: i }))
    );
  }

  async function completeMemo() {
    await updateMemo(current.id, { status: 'done' });
    if (current.reminderRule?.notificationId) {
      await cancelReminder(current.reminderRule.notificationId);
      await setReminder(current.id, null);
    }
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // ignore
    }
    setCelebrate(memoDoneCopy());
  }

  async function reopenMemo() {
    await updateMemo(current.id, { status: 'pending' });
  }

  async function saveReminder() {
    const permitted = await ensureNotificationPermission();
    if (!permitted) {
      setToast('还没有通知权限，可在设置里打开。');
      return;
    }
    if (current.reminderRule?.notificationId) {
      await cancelReminder(current.reminderRule.notificationId);
    }
    const rule = await scheduleMemoReminder({
      memoId: current.id,
      title: current.title,
      rule: { at: remindAt, repeat },
    });
    if (!rule) {
      setToast('提醒没有设上，稍后再试。');
      return;
    }
    await setReminder(current.id, rule);
    setToast(
      repeat === 'once'
        ? '好，到点我会轻轻叫你一声。'
        : repeat === 'daily'
          ? '好，每天这个点轻轻提醒。'
          : '好，每周这个点轻轻提醒。'
    );
  }

  async function clearReminder() {
    if (current.reminderRule?.notificationId) {
      await cancelReminder(current.reminderRule.notificationId);
    }
    await setReminder(current.id, null);
    setToast('提醒已放下。');
  }

  async function onImportSteps(titles: string[]) {
    const base = current.steps.length;
    const imported: MemoStep[] = titles.map((title, i) => ({
      id: createId('step'),
      title,
      done: false,
      order: base + i,
    }));
    await setSteps(current.id, [...current.steps, ...imported]);
  }

  function confirmDelete() {
    Alert.alert('忘掉这条？', '删掉后就找不回来了。', [
      { text: '再想想', style: 'cancel' },
      {
        text: '忘掉',
        style: 'destructive',
        onPress: async () => {
          if (current.reminderRule?.notificationId) {
            await cancelReminder(current.reminderRule.notificationId);
          }
          await removeMemo(current.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <PaperBackground>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{current.title}</Text>
        {current.note ? <Text style={styles.note}>{current.note}</Text> : null}
        <Text style={styles.meta}>
          {current.status === 'done' ? '已完成' : '进行中'}
          {current.steps.length ? ` · 已完成 ${doneSteps}/${current.steps.length} 步` : ''}
        </Text>

        <View style={styles.block}>
          <Text style={styles.heading}>小步骤</Text>
          {current.steps.length === 0 ? (
            <Text style={styles.hint}>太大就拆开。每一步越轻越好。</Text>
          ) : (
            current.steps.map((step) => (
              <View
                key={step.id}
                style={[
                  styles.stepRow,
                  highlightStepId === step.id && styles.stepHighlight,
                ]}>
                <Pressable onPress={() => toggleStep(step.id)} style={styles.stepMain}>
                  <View style={[styles.check, step.done && styles.checkOn]} />
                  <Text style={[styles.stepText, step.done && styles.stepDone]}>
                    {step.title}
                  </Text>
                </Pressable>
                <Pressable onPress={() => removeStep(step.id)}>
                  <Text style={styles.stepRemove}>去掉</Text>
                </Pressable>
              </View>
            ))
          )}
          <View style={styles.addRow}>
            <TextInput
              style={styles.stepInput}
              placeholder="加一小步…"
              placeholderTextColor={Theme.colors.muted}
              value={stepTitle}
              onChangeText={setStepTitle}
              onSubmitEditing={addStep}
            />
            <Pressable style={styles.smallBtn} onPress={addStep}>
              <Text style={styles.smallBtnText}>添加</Text>
            </Pressable>
          </View>
        </View>

        <BreakDownPanel memo={current} onImportSteps={onImportSteps} />

        <View style={styles.block}>
          <Pressable onPress={() => setShowReminder((v) => !v)} style={styles.sectionToggle}>
            <Text style={styles.heading}>轻提醒</Text>
            <Text style={styles.toggleHint}>
              {showReminder || current.reminderRule ? '收起' : '设置'}
            </Text>
          </Pressable>
          {(showReminder || current.reminderRule) && (
            <>
              <Text style={styles.hint}>一次、每天或每周。文案只会轻轻说一声。</Text>
              <View style={styles.repeatRow}>
                {([
                  ['once', '一次'],
                  ['daily', '每天'],
                  ['weekly', '每周'],
                ] as const).map(([value, label]) => (
                  <Pressable
                    key={value}
                    onPress={() => setRepeat(value)}
                    style={[styles.chip, repeat === value && styles.chipOn]}>
                    <Text style={[styles.chipText, repeat === value && styles.chipTextOn]}>
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.timeLabel}>
                {new Date(remindAt).toLocaleString()}
              </Text>
              <TextInput
                style={styles.stepInput}
                value={remindAt}
                onChangeText={setRemindAt}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.row}>
                <Pressable style={styles.primary} onPress={saveReminder}>
                  <Text style={styles.primaryText}>设提醒</Text>
                </Pressable>
                {current.reminderRule ? (
                  <Pressable style={styles.ghost} onPress={clearReminder}>
                    <Text style={styles.ghostText}>取消提醒</Text>
                  </Pressable>
                ) : null}
              </View>
            </>
          )}
        </View>

        <View style={styles.row}>
          {current.status === 'pending' ? (
            <Pressable style={styles.primary} onPress={completeMemo}>
              <Text style={styles.primaryText}>完成这件事</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.secondary} onPress={reopenMemo}>
              <Text style={styles.secondaryText}>重新打开</Text>
            </Pressable>
          )}
          <Pressable style={styles.ghost} onPress={confirmDelete}>
            <Text style={styles.dangerText}>忘掉</Text>
          </Pressable>
        </View>

        {toast ? <Text style={styles.toast}>{toast}</Text> : null}
      </ScrollView>

      <MotivationSheet
        visible={showMotivation}
        message={motivation}
        hasSteps={current.steps.some((s) => !s.done)}
        onClose={() => setShowMotivation(false)}
        onFirstStep={() => {
          const first = current.steps.find((s) => !s.done);
          if (first) setHighlightStepId(first.id);
        }}
      />
      <Celebration
        visible={Boolean(celebrate)}
        message={celebrate ?? ''}
        onClose={() => setCelebrate(null)}
      />
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Theme.space.lg,
    paddingBottom: 60,
  },
  title: {
    fontFamily: Theme.fonts.display,
    fontSize: 30,
    lineHeight: 40,
    color: Theme.colors.ink,
  },
  note: {
    marginTop: Theme.space.sm,
    fontFamily: Theme.fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: Theme.colors.inkSoft,
  },
  meta: {
    marginTop: Theme.space.md,
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: Theme.colors.muted,
  },
  block: {
    marginTop: Theme.space.xl,
  },
  heading: {
    fontFamily: Theme.fonts.display,
    fontSize: 22,
    color: Theme.colors.ink,
    marginBottom: Theme.space.xs,
  },
  sectionToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleHint: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: Theme.colors.accent,
  },
  hint: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    lineHeight: 20,
    color: Theme.colors.muted,
    marginBottom: Theme.space.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.colors.line,
    gap: 8,
  },
  stepHighlight: {
    backgroundColor: Theme.colors.warmSoft,
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: Theme.radius.sm,
  },
  stepMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  check: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: Theme.colors.accent,
  },
  checkOn: {
    backgroundColor: Theme.colors.accent,
  },
  stepText: {
    flex: 1,
    fontFamily: Theme.fonts.body,
    fontSize: 15,
    color: Theme.colors.ink,
    lineHeight: 22,
  },
  stepDone: {
    color: Theme.colors.muted,
    textDecorationLine: 'line-through',
  },
  stepRemove: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: Theme.colors.muted,
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Theme.space.md,
  },
  stepInput: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.colors.line,
    backgroundColor: 'rgba(255,252,247,0.7)',
    borderRadius: Theme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: Theme.fonts.body,
    fontSize: 14,
    color: Theme.colors.ink,
  },
  smallBtn: {
    backgroundColor: Theme.colors.accentSoft,
    borderRadius: Theme.radius.sm,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  smallBtnText: {
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.accent,
  },
  repeatRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Theme.space.md,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Theme.radius.sm,
    backgroundColor: 'rgba(255,252,247,0.7)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.colors.line,
  },
  chipOn: {
    backgroundColor: Theme.colors.accentSoft,
    borderColor: Theme.colors.accent,
  },
  chipText: {
    fontFamily: Theme.fonts.body,
    color: Theme.colors.inkSoft,
    fontSize: 13,
  },
  chipTextOn: {
    color: Theme.colors.accent,
    fontFamily: Theme.fonts.bodyMedium,
  },
  timeLabel: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: Theme.colors.muted,
    marginBottom: 8,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.space.sm,
    marginTop: Theme.space.lg,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: Theme.colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Theme.radius.sm,
  },
  primaryText: {
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.white,
    fontSize: 15,
  },
  secondary: {
    backgroundColor: Theme.colors.accentSoft,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Theme.radius.sm,
  },
  secondaryText: {
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.accent,
    fontSize: 15,
  },
  ghost: {
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  ghostText: {
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.accent,
    fontSize: 14,
  },
  dangerText: {
    fontFamily: Theme.fonts.body,
    color: Theme.colors.warm,
    fontSize: 14,
  },
  toast: {
    marginTop: Theme.space.md,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.accent,
    fontSize: 13,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.space.lg,
  },
  missingText: {
    fontFamily: Theme.fonts.body,
    color: Theme.colors.inkSoft,
    marginBottom: Theme.space.md,
  },
  link: {
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.accent,
  },
});
