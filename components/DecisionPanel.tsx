import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link } from 'expo-router';

import { Theme } from '@/constants/Theme';
import { chatCompletion } from '@/lib/ai/client';
import { isAiConfigured, loadAiConfig } from '@/lib/ai/secureConfig';
import {
  detectSafety,
  emptyBookAnswer,
  getSourceUrl,
  safetyPreface,
  searchEntries,
} from '@/lib/hltb/index';
import { buildDecisionMessages, extractActionSteps } from '@/lib/hltb/prompt';
import { createId } from '@/lib/id';
import type { AdviceRecord, Memo } from '@/lib/types';

type Props = {
  memo: Memo;
  onSaved: (record: AdviceRecord) => Promise<void>;
  onImportSteps: (titles: string[]) => Promise<void>;
};

export function DecisionPanel({ memo, onSaved, onImportSteps }: Props) {
  const [question, setQuestion] = useState(
    [memo.title, memo.note].filter(Boolean).join('\n')
  );
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(
    memo.adviceHistory[0]?.answer ?? null
  );
  const [error, setError] = useState<string | null>(null);
  const [lastEntryIds, setLastEntryIds] = useState<string[]>(
    memo.adviceHistory[0]?.entryIds ?? []
  );
  const [toast, setToast] = useState<string | null>(null);

  async function runAdvice() {
    setError(null);
    setToast(null);
    const q = question.trim();
    if (!q) {
      setError('先写一点你想参谋的事。');
      return;
    }

    const config = await loadAiConfig();
    if (!isAiConfigured(config)) {
      setError('还没有配置中转站。去设置里填 Base URL、API Key 和模型名即可。');
      return;
    }

    setLoading(true);
    try {
      const kind = detectSafety(q);
      const preface = safetyPreface(kind);
      const hits = searchEntries(q, 8);

      if (!hits.length) {
        const fallback = [preface, emptyBookAnswer(q)].filter(Boolean).join('\n\n');
        setAnswer(fallback);
        setLastEntryIds([]);
        return;
      }

      const content = await chatCompletion(
        config,
        buildDecisionMessages({ question: q, hits, preface }),
        { temperature: 0.25, maxTokens: 2000 }
      );
      setAnswer(content);
      setLastEntryIds(hits.map((h) => h.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : '参谋失败了，稍后再试。');
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!answer) return;
    const record: AdviceRecord = {
      id: createId('advice'),
      question: question.trim(),
      answer,
      entryIds: lastEntryIds,
      createdAt: new Date().toISOString(),
    };
    await onSaved(record);
    setToast('参谋记录已收进这条备忘。');
  }

  async function importSteps() {
    if (!answer) return;
    const steps = extractActionSteps(answer);
    if (!steps.length) {
      setToast('没有识别到「先做这几条」，可以手动拆步骤。');
      return;
    }
    await onImportSteps(steps);
    setToast(`已收成 ${steps.length} 个小步骤。`);
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>按指南参谋</Text>
      <Text style={styles.hint}>
        先本地检索《高性价比人生指南》，再把条目原文交给你的中转站整理。没查到就不瞎编。
      </Text>
      <TextInput
        style={styles.input}
        multiline
        value={question}
        onChangeText={setQuestion}
        placeholder="把犹豫写清楚一点…"
        placeholderTextColor={Theme.colors.muted}
      />
      <View style={styles.actions}>
        <Pressable style={styles.primary} onPress={runAdvice} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={Theme.colors.white} />
          ) : (
            <Text style={styles.primaryText}>按指南参谋</Text>
          )}
        </Pressable>
        <Link href="/(tabs)/settings" asChild>
          <Pressable style={styles.ghost}>
            <Text style={styles.ghostText}>中转站设置</Text>
          </Pressable>
        </Link>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {answer ? (
        <View style={styles.answerBox}>
          <Text style={styles.answer}>{answer}</Text>
          <Text style={styles.source}>书本索引来源：{getSourceUrl()}</Text>
          <View style={styles.actions}>
            <Pressable style={styles.secondary} onPress={save}>
              <Text style={styles.secondaryText}>保存参谋记录</Text>
            </Pressable>
            <Pressable style={styles.secondary} onPress={importSteps}>
              <Text style={styles.secondaryText}>把建议收成步骤</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      {toast ? <Text style={styles.toast}>{toast}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: Theme.space.xl,
    paddingTop: Theme.space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Theme.colors.line,
  },
  heading: {
    fontFamily: Theme.fonts.display,
    fontSize: 22,
    color: Theme.colors.ink,
    marginBottom: Theme.space.xs,
  },
  hint: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    lineHeight: 20,
    color: Theme.colors.muted,
    marginBottom: Theme.space.md,
  },
  input: {
    minHeight: 96,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.colors.line,
    backgroundColor: 'rgba(255,252,247,0.65)',
    borderRadius: Theme.radius.md,
    padding: Theme.space.md,
    fontFamily: Theme.fonts.body,
    fontSize: 15,
    color: Theme.colors.ink,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.space.sm,
    marginTop: Theme.space.md,
  },
  primary: {
    backgroundColor: Theme.colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Theme.radius.sm,
    minWidth: 120,
    alignItems: 'center',
  },
  primaryText: {
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.white,
    fontSize: 15,
  },
  ghost: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  ghostText: {
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.accent,
    fontSize: 14,
  },
  secondary: {
    backgroundColor: Theme.colors.accentSoft,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Theme.radius.sm,
  },
  secondaryText: {
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.accent,
    fontSize: 14,
  },
  error: {
    marginTop: Theme.space.sm,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.warm,
    fontSize: 13,
    lineHeight: 20,
  },
  answerBox: {
    marginTop: Theme.space.md,
  },
  answer: {
    fontFamily: Theme.fonts.body,
    fontSize: 15,
    lineHeight: 24,
    color: Theme.colors.ink,
  },
  source: {
    marginTop: Theme.space.sm,
    fontFamily: Theme.fonts.body,
    fontSize: 11,
    color: Theme.colors.muted,
  },
  toast: {
    marginTop: Theme.space.sm,
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: Theme.colors.accent,
  },
});
