import type { ChatMessage } from '../ai/client';
import { formatCitation, type SearchHit } from './index';

const SYSTEM = `你是「我记着呢」里的人生决策参谋。你必须严格按《高性价比人生指南》已提供的条目原文回答。

硬性规则：
1. 每个数字、法条、结论都必须能指回下方提供的条目；指不回去就说「书里没写」。
2. 禁止凭记忆补充书中没有的数字、DOI、法条条款号。
3. 寿命、时间与精力、金钱、人身自由四样分开算，不互相折算。
4. 先按性价比档（极高/高/一般），同档再按证据等级 A>B>C。不同口径分开列。
5. 语气克制、口语、简体中文，不说教，不用感叹号。
6. 按这个结构写：
   - 一句话结论
   - 先做这几条（3 到 7 条；动词开头；写清花掉什么、换回什么、证据等级；出处写成「第 X 节第 Y 条（条目标题）」）
   - 别做 / 不用做的
   - 书里没写的
   - 可选：复查点
7. 「一般」不等于不该做。涉及具体病情/案件/税务时，说明不替代医生/律师/会计。
8. 只使用用户消息里给出的条目，不要发明新条目。`;

export function buildDecisionMessages(input: {
  question: string;
  hits: SearchHit[];
  preface?: string | null;
}): ChatMessage[] {
  const catalog = input.hits
    .map((h, i) => {
      return [
        `【条目 ${i + 1}】${formatCitation(h)}`,
        `性价比档：${h.ratioTier}；证据：${h.evidence}；口径：${h.tags.axis}；成本分：${h.costScore}（钱=${h.tags.money} 时间=${h.tags.time} 毅力=${h.tags.will} 收益=${h.tags.benefit}）`,
        `### ${h.entryNo}. ${h.title}\n${h.body}`,
      ].join('\n');
    })
    .join('\n\n----\n\n');

  const user = [
    input.preface ? `安全提示（请放在答复最前）：\n${input.preface}\n` : '',
    `用户问题：\n${input.question.trim()}`,
    '',
    '以下是本地检索到的书本条目原文（唯一允许引用的依据）：',
    catalog,
  ]
    .filter(Boolean)
    .join('\n');

  return [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: user },
  ];
}

/** Best-effort extraction of action lines for converting advice into steps. */
export function extractActionSteps(answer: string, limit = 7): string[] {
  const lines = answer.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const start = lines.findIndex((l) => /先做这几条/.test(l));
  if (start < 0) return [];
  const steps: string[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^(别做|不用做|书里没写|复查)/.test(line)) break;
    const cleaned = line
      .replace(/^[-*•]\s*/, '')
      .replace(/^\d+[\.\)、]\s*/, '')
      .replace(/（第\s*\d+\s*节.*?）/g, '')
      .replace(/出处.*$/, '')
      .trim();
    if (cleaned.length < 2) continue;
    steps.push(cleaned.length > 80 ? `${cleaned.slice(0, 77)}…` : cleaned);
    if (steps.length >= limit) break;
  }
  return steps;
}
