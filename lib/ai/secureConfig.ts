import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { normalizeBaseUrl } from '@/lib/ai/url';
import type { AiConfig } from '@/lib/types';

export { normalizeBaseUrl } from '@/lib/ai/url';

const KEY_API = 'ai_api_key';
const KEY_BASE = 'ai_base_url';
const KEY_MODEL = 'ai_model';

async function setSecure(key: string, value: string) {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getSecure(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function deleteSecure(key: string) {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function loadAiConfig(): Promise<AiConfig> {
  const [apiKey, baseUrl, model] = await Promise.all([
    getSecure(KEY_API),
    getSecure(KEY_BASE),
    getSecure(KEY_MODEL),
  ]);
  return {
    apiKey: apiKey ?? '',
    baseUrl: baseUrl ?? '',
    model: model ?? '',
  };
}

export async function saveAiConfig(config: AiConfig): Promise<AiConfig> {
  const normalized: AiConfig = {
    apiKey: config.apiKey.trim(),
    baseUrl: normalizeBaseUrl(config.baseUrl),
    model: config.model.trim(),
  };
  await Promise.all([
    normalized.apiKey ? setSecure(KEY_API, normalized.apiKey) : deleteSecure(KEY_API),
    normalized.baseUrl ? setSecure(KEY_BASE, normalized.baseUrl) : deleteSecure(KEY_BASE),
    normalized.model ? setSecure(KEY_MODEL, normalized.model) : deleteSecure(KEY_MODEL),
  ]);
  return normalized;
}

export function isAiConfigured(config: AiConfig): boolean {
  return Boolean(config.apiKey && config.baseUrl && config.model);
}
