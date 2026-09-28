import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PaperBackground } from '@/components/PaperBackground';
import { Theme } from '@/constants/Theme';
import { testConnection } from '@/lib/ai/client';
import {
  isAiConfigured,
  loadAiConfig,
  normalizeBaseUrl,
  saveAiConfig,
} from '@/lib/ai/secureConfig';
import { ensureNotificationPermission } from '@/lib/notifications';
import { getSourceUrl } from '@/lib/hltb/index';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notifyStatus, setNotifyStatus] = useState<string | null>(null);

  useEffect(() => {
    loadAiConfig().then((c) => {
      setBaseUrl(c.baseUrl);
      setApiKey(c.apiKey);
      setModel(c.model);
    });
  }, []);

  async function onSave() {
    setBusy(true);
    setStatus(null);
    try {
      const saved = await saveAiConfig({ baseUrl, apiKey, model });
      setBaseUrl(saved.baseUrl);
      setStatus(isAiConfigured(saved) ? '已保存在本机。' : '已清空不完整的配置。');
    } finally {
      setBusy(false);
    }
  }

  async function onTest() {
    setBusy(true);
    setStatus(null);
    try {
      const config = await saveAiConfig({ baseUrl, apiKey, model });
      setBaseUrl(config.baseUrl);
      const reply = await testConnection(config);
      setStatus(`连通正常。中转站回复：${reply.slice(0, 40)}`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : '测试失败');
    } finally {
      setBusy(false);
    }
  }

  async function onNotify() {
    const ok = await ensureNotificationPermission();
    setNotifyStatus(ok ? '通知权限已打开，提醒会温柔一点。' : '暂时没拿到通知权限，可稍后在系统设置里打开。');
  }

  return (
    <PaperBackground>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>设置</Text>
        <Text style={styles.lead}>Key 只留在你的手机上，用来接你自己的中转站。</Text>

        <Text style={styles.label}>API Base URL</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="https://api.example.com/v1"
          placeholderTextColor={Theme.colors.muted}
          value={baseUrl}
          onChangeText={setBaseUrl}
          onBlur={() => setBaseUrl((v) => (v ? normalizeBaseUrl(v) : v))}
        />

        <Text style={styles.label}>API Key</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          placeholder="sk-..."
          placeholderTextColor={Theme.colors.muted}
          value={apiKey}
          onChangeText={setApiKey}
        />

        <Text style={styles.label}>模型名</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="gpt-4o-mini"
          placeholderTextColor={Theme.colors.muted}
          value={model}
          onChangeText={setModel}
        />

        <View style={styles.row}>
          <Pressable style={styles.primary} onPress={onSave} disabled={busy}>
            <Text style={styles.primaryText}>保存</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={onTest} disabled={busy}>
            {busy ? (
              <ActivityIndicator color={Theme.colors.accent} />
            ) : (
              <Text style={styles.secondaryText}>测试连接</Text>
            )}
          </Pressable>
        </View>
        {status ? <Text style={styles.status}>{status}</Text> : null}

        <View style={styles.block}>
          <Text style={styles.blockTitle}>轻提醒</Text>
          <Text style={styles.blockBody}>
            提醒用语都很轻，不会催骂。需要系统通知权限才能按时送达。
          </Text>
          <Pressable style={styles.secondary} onPress={onNotify}>
            <Text style={styles.secondaryText}>检查通知权限</Text>
          </Pressable>
          {notifyStatus ? <Text style={styles.status}>{notifyStatus}</Text> : null}
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>人生指南</Text>
          <Text style={styles.blockBody}>
            底部「指南」页提供提问模板：先本地检索《高性价比人生指南》，再按书回答。备忘详情里的「拆成步骤」是简单清单，不走这本书。许可 Unlicense。{'\n'}
            {getSourceUrl()}
          </Text>
        </View>
      </ScrollView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Theme.space.lg,
  },
  brand: {
    fontFamily: Theme.fonts.display,
    fontSize: 36,
    color: Theme.colors.ink,
  },
  lead: {
    marginTop: Theme.space.sm,
    marginBottom: Theme.space.xl,
    fontFamily: Theme.fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: Theme.colors.inkSoft,
  },
  label: {
    fontFamily: Theme.fonts.bodyMedium,
    fontSize: 13,
    color: Theme.colors.muted,
    marginBottom: 6,
    marginTop: Theme.space.md,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.colors.line,
    backgroundColor: 'rgba(255,252,247,0.7)',
    borderRadius: Theme.radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: Theme.fonts.body,
    fontSize: 15,
    color: Theme.colors.ink,
  },
  row: {
    flexDirection: 'row',
    gap: Theme.space.sm,
    marginTop: Theme.space.lg,
  },
  primary: {
    backgroundColor: Theme.colors.accent,
    paddingHorizontal: 18,
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
    alignSelf: 'flex-start',
  },
  secondaryText: {
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.accent,
    fontSize: 15,
  },
  status: {
    marginTop: Theme.space.sm,
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    lineHeight: 20,
    color: Theme.colors.inkSoft,
  },
  block: {
    marginTop: Theme.space.xxl,
    paddingTop: Theme.space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Theme.colors.line,
  },
  blockTitle: {
    fontFamily: Theme.fonts.display,
    fontSize: 22,
    color: Theme.colors.ink,
    marginBottom: Theme.space.sm,
  },
  blockBody: {
    fontFamily: Theme.fonts.body,
    fontSize: 14,
    lineHeight: 22,
    color: Theme.colors.inkSoft,
    marginBottom: Theme.space.md,
  },
});
