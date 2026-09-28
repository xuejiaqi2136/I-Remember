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
import { buildDecisionMessages } from '@/lib/hltb/prompt';

const TEMPLATES = [
  '拖延严重，怎么开始动手？',
  '替朋友担保签不签？',
  '失业了能领什么、去哪求助？',
  '租房押金被扣怎么办？',
];

type Props = {
  onSaveAsMemo?: (input: { title: string; note: string }) => Promise<void>;
};

export function GuidePanel({ onSaveAsMemo }: Props) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function ask(qRaw?: string) {
    setError(null);
    setToast(null);
    const q = (qRaw ?? question).trim();
    if (!q) {
      setError('先写一个具体问题。');
      return;
    }
    setQuestion(q);

    const config = await loadAiConfig();
    if (!isAiConfigured(config)) {
      setError('还没有配置中转站。去设置里填 Base URL、API Key 和模型名。');
      return;
    }

    setLoading(true);
    try {
      const kind = detectSafety(q);
      const preface = safetyPreface(kind);
      const hits = searchEntries(q, 8);

      if (!hits.length) {
        setAnswer([preface, emptyBookAnswer(q)].filter(Boolean).join('\n\n'));
        return;
      }

      const content = await chatCompletion(
        config,
        buildDecisionMessages({ question: q, hits, preface }),
        { temperature: 0.25, maxTokens: 2000 }
      );
      setAnswer(content);
    } catch (e) {
      setError(e instanceof Error ? e.message : '问答失败了，稍后再试。');
    } finally {
      setLoading(false);
    }
  }

  async function saveMemo() {
    if (!onSaveAsMemo || !answer) return;
    await onSaveAsMemo({
      title: question.trim().slice(0, 40) || '指南问答',
      note: answer,
    });
    setToast('已记成一条备忘，可在「备忘」里继续拆步骤。');
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>
        先本地检索《高性价比人生指南》，再按书里条目回答。没查到就直说书里没写。
      </Text>

      <View style={styles.templates}>
        {TEMPLATES.map((t) => (
          <Pressable key={t} style={styles.chip} onPress={() => ask(t)}>
            <Text style={styles.chipText}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        style={styles.input}
        multiline
        value={question}
        onChangeText={setQuestion}
        placeholder="例如：该不该签这份担保…"
        placeholderTextColor={Theme.colors.muted}
      />

      <View style={styles.actions}>
        <Pressable style={styles.primary} onPress={() => ask()} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={Theme.colors.white} />
          ) : (
            <Text style={styles.primaryText}>按指南回答</Text>
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
          <Text style={styles.answerLabel}>答复</Text>
          <Text style={styles.answer}>{answer}</Text>
          <Text style={styles.source}>书本索引：{getSourceUrl()}</Text>
          {onSaveAsMemo ? (
            <Pressable style={styles.secondary} onPress={saveMemo}>
              <Text style={styles.secondaryText}>记成备忘</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {toast ? <Text style={styles.toast}>{toast}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  hint: {
    fontFamily: Theme.fonts.body,
    fontSize: 14,
    lineHeight: 22,
    color: Theme.colors.inkSoft,
    marginBottom: Theme.space.md,
  },
  templates: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Theme.space.md,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.radius.sm,
    backgroundColor: Theme.colors.accentSoft,
  },
  chipText: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: Theme.colors.accent,
  },
  input: {
    minHeight: 100,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.colors.line,
    backgroundColor: 'rgba(255,252,247,0.7)',
    borderRadius: Theme.radius.md,
    padding: Theme.space.md,
    fontFamily: Theme.fonts.body,
    fontSize: 16,
    color: Theme.colors.ink,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.space.sm,
    marginTop: Theme.space.md,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: Theme.colors.accent,
    paddingHorizontal: 18,
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
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  ghostText: {
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.accent,
    fontSize: 14,
  },
  secondary: {
    marginTop: Theme.space.md,
    alignSelf: 'flex-start',
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
    marginTop: Theme.space.xl,
    paddingTop: Theme.space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Theme.colors.line,
  },
  answerLabel: {
    fontFamily: Theme.fonts.bodyMedium,
    fontSize: 12,
    color: Theme.colors.muted,
    marginBottom: Theme.space.sm,
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
