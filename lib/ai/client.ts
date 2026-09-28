import { chatCompletionsUrl } from '@/lib/ai/url';
import type { AiConfig } from '@/lib/types';

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export { chatCompletionsUrl } from '@/lib/ai/url';

export class AiClientError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'AiClientError';
    this.status = status;
  }
}

export async function chatCompletion(
  config: AiConfig,
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number; timeoutMs?: number }
): Promise<string> {
  if (!config.apiKey || !config.baseUrl || !config.model) {
    throw new AiClientError('还没有配置中转站，去设置里填一下 Base URL、Key 和模型名吧。');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? 45000);

  try {
    const res = await fetch(chatCompletionsUrl(config.baseUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: options?.temperature ?? 0.3,
        max_tokens: options?.maxTokens ?? 1800,
      }),
      signal: controller.signal,
    });

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!res.ok) {
      const detail =
        data?.error?.message ||
        data?.message ||
        (text ? text.slice(0, 160) : `HTTP ${res.status}`);
      throw new AiClientError(
        `中转站没回应清楚：${detail}。可以检查地址或 Key。`,
        res.status
      );
    }

    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      throw new AiClientError('中转站返回了空内容，换个模型或稍后再试。');
    }
    return content.trim();
  } catch (err) {
    if (err instanceof AiClientError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new AiClientError('等太久了，中转站没有及时回应。');
    }
    throw new AiClientError('连不上中转站，可检查网络或 Base URL。');
  } finally {
    clearTimeout(timeout);
  }
}

export async function testConnection(config: AiConfig): Promise<string> {
  return chatCompletion(
    config,
    [
      { role: 'system', content: '你只回复两个字：可用' },
      { role: 'user', content: 'ping' },
    ],
    { maxTokens: 8, temperature: 0, timeoutMs: 20000 }
  );
}
