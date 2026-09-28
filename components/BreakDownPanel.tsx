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
import { buildBreakDownMessages, parseSimpleSteps } from '@/lib/ai/steps';
import type { Memo } from '@/lib/types';

type Props = {
  memo: Memo;
  onImportSteps: (titles: string[]) => Promise<void>;
};

export function BreakDownPanel({ memo, onImportSteps }: Props) {
  const [prompt, setPrompt] = useState(
    [memo.title, memo.note].filter(Boolean).join('\n')
  );
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string[]>([]);
  const [raw, setRaw] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function runBreakDown() {
    setError(null);
    setToast(null);
    const text = prompt.trim();
    if (!text) {
      setError('先写一点要拆开的事。');
      return;
    }

    const config = await loadAiConfig();
    if (!isAiConfigured(config)) {
      setError('还没有配置中转站。去设置里填一下即可。');
      return;
    }

    setLoading(true);
    try {
      const [titleLine, ...rest] = text.split('\n');
      const content = await chatCompletion(
        config,
        buildBreakDownMessages({
          title: titleLine || memo.title,
          note: rest.join('\n') || memo.note,
        }),
        { temperature: 0.35, maxTokens: 500 }
      );
      setRaw(content);
      const steps = parseSimpleSteps(content);
      if (!steps.length) {
        setError('没拆出步骤，换个说法再试一次。');
        setPreview([]);
        return;
      }
      setPreview(steps);
    } catch (e) {
      setError(e instanceof Error ? e.message : '拆步骤失败了，稍后再试。');
    } finally {
      setLoading(false);
    }
  }

  async function importSteps() {
    if (!preview.length) return;
    await onImportSteps(preview);
    setToast(`已收成 ${preview.length} 个小步骤。`);
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>帮我拆开</Text>
      <Text style={styles.hint}>让 AI 把这件事列成几步很小的动作，再一键收进清单。</Text>
      <TextInput
        style={styles.input}
        multiline
        value={prompt}
        onChangeText={setPrompt}
        placeholder="想拆开什么…"
        placeholderTextColor={Theme.colors.muted}
      />
      <View style={styles.actions}>
        <Pressable style={styles.primary} onPress={runBreakDown} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={Theme.colors.white} />
          ) : (
            <Text style={styles.primaryText}>拆成步骤</Text>
          )}
        </Pressable>
        <Link href="/(tabs)/settings" asChild>
          <Pressable style={styles.ghost}>
            <Text style={styles.ghostText}>中转站</Text>
          </Pressable>
        </Link>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {preview.length > 0 ? (
        <View style={styles.preview}>
          {preview.map((step, i) => (
            <View key={`${i}-${step}`} style={styles.previewRow}>
              <Text style={styles.previewIndex}>{i + 1}</Text>
              <Text style={styles.previewText}>{step}</Text>
            </View>
          ))}
          <Pressable style={styles.secondary} onPress={importSteps}>
            <Text style={styles.secondaryText}>把建议收成步骤</Text>
          </Pressable>
          {raw ? <Text style={styles.rawHint}>已按简单列表解析</Text> : null}
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
    fontSize: 24,
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
    minHeight: 72,
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
    alignItems: 'center',
  },
  primary: {
    backgroundColor: Theme.colors.accent,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: Theme.radius.sm,
    minWidth: 110,
    alignItems: 'center',
  },
  primaryText: {
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.white,
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
  secondary: {
    marginTop: Theme.space.md,
    alignSelf: 'flex-start',
    backgroundColor: Theme.colors.warmSoft,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: Theme.radius.sm,
  },
  secondaryText: {
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.warm,
    fontSize: 14,
  },
  error: {
    marginTop: Theme.space.sm,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.warm,
    fontSize: 13,
    lineHeight: 20,
  },
  preview: {
    marginTop: Theme.space.lg,
  },
  previewRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.colors.line,
  },
  previewIndex: {
    fontFamily: Theme.fonts.display,
    fontSize: 16,
    color: Theme.colors.accent,
    width: 22,
  },
  previewText: {
    flex: 1,
    fontFamily: Theme.fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: Theme.colors.ink,
  },
  rawHint: {
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
