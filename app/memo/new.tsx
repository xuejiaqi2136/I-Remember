import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PaperBackground } from '@/components/PaperBackground';
import { Theme } from '@/constants/Theme';
import { useMemos } from '@/context/MemoContext';

export default function NewMemoScreen() {
  const router = useRouter();
  const { createMemo } = useMemos();
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function onSave() {
    const t = title.trim();
    if (!t || saving) return;
    setSaving(true);
    try {
      const memo = await createMemo({ title: t, note });
      router.replace(`/memo/${memo.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <PaperBackground>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <Text style={styles.brand}>记一笔</Text>
          <Text style={styles.hint}>先落下标题就好，细节可以以后补。</Text>
          <TextInput
            style={styles.title}
            placeholder="想记什么？"
            placeholderTextColor={Theme.colors.muted}
            value={title}
            onChangeText={setTitle}
            autoFocus
          />
          <TextInput
            style={styles.note}
            placeholder="可选备注…"
            placeholderTextColor={Theme.colors.muted}
            value={note}
            onChangeText={setNote}
            multiline
          />
          <Pressable
            style={[styles.btn, !title.trim() && styles.btnDisabled]}
            disabled={!title.trim() || saving}
            onPress={onSave}>
            <Text style={styles.btnText}>{saving ? '记下…' : '记下'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flex: 1,
    padding: Theme.space.lg,
  },
  brand: {
    fontFamily: Theme.fonts.display,
    fontSize: 32,
    color: Theme.colors.ink,
  },
  hint: {
    marginTop: Theme.space.xs,
    marginBottom: Theme.space.xl,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.muted,
    fontSize: 14,
  },
  title: {
    fontFamily: Theme.fonts.displayRegular,
    fontSize: 26,
    color: Theme.colors.ink,
    marginBottom: Theme.space.md,
  },
  note: {
    minHeight: 120,
    fontFamily: Theme.fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: Theme.colors.ink,
    textAlignVertical: 'top',
  },
  btn: {
    marginTop: Theme.space.xl,
    alignSelf: 'flex-start',
    backgroundColor: Theme.colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Theme.radius.sm,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnText: {
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.white,
    fontSize: 16,
  },
});
