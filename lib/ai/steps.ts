import type { ChatMessage } from '@/lib/ai/client';

/** Prompt: break a memo into a short actionable checklist. No HLTB skill. */
export function buildBreakDownMessages(input: {
  title: string;
  note?: string;
}): ChatMessage[] {
  const task = [input.title.trim(), (input.note ?? '').trim()].filter(Boolean).join('\n');
  return [
    {
      role: 'system',
      content: [
        '你是「我记着呢」里的拆任务助手。',
        '把用户的事拆成 3 到 7 个很小、马上能动手的步骤。',
        '规则：',
        '1. 只输出步骤列表，不要前言、不要总结、不要鼓励长文。',
        '2. 每行一步，格式：1. xxx',
        '3. 每一步用动词开头，尽量 15 字以内，最多不超过 30 字。',
        '4. 不要催骂，不要打分，不要提书籍或论文。',
        '5. 如果事情已经很小，也可以只给 2 到 3 步。',
      ].join('\n'),
    },
    {
      role: 'user',
      content: `请把下面这件事拆成小步骤：\n\n${task}`,
    },
  ];
}

/** Parse a plain numbered / bulleted list into step titles. */
export function parseSimpleSteps(text: string, limit = 8): string[] {
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const steps: string[] = [];
  for (const line of lines) {
    const cleaned = line
      .replace(/^[-*•·]\s*/, '')
      .replace(/^\d+[\.\)、:：]\s*/, '')
      .replace(/^第[一二三四五六七八九十\d]+[步点条]\s*[:：]?\s*/, '')
      .trim();
    if (cleaned.length < 2) continue;
    // skip obvious non-step headings
    if (/^(一句话结论|先做这几条|别做|书里没写|复查)/.test(cleaned)) continue;
    steps.push(cleaned.length > 40 ? `${cleaned.slice(0, 37)}…` : cleaned);
    if (steps.length >= limit) break;
  }
  return steps;
}
