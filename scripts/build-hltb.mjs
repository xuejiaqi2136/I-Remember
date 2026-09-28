#!/usr/bin/env node
/**
 * Build a searchable JSON index from HowToLiveBetter book/.
 * Source: https://github.com/eternity4719/HowToLiveBetter (Unlicense)
 */
import fs from 'node:fs';
import path from 'node:path';

const SOURCE = process.env.HLTB_PATH || '/tmp/hltb';
const OUT_DIR = path.resolve('assets/hltb');

const COST_W = {
  money: { '0': 0, 少: 1, 多: 2 },
  time: { 少: 0, 中: 1, 多: 2 },
  will: { 否: 0, 些: 1, 是: 2 },
};

function costScore(tags) {
  const m = COST_W.money[tags.money] ?? 1;
  const t = COST_W.time[tags.time] ?? 1;
  const w = COST_W.will[tags.will] ?? 1;
  return m + t + w;
}

function ratioTier(level, cs) {
  if (level === '大') return cs === 0 ? '极高' : cs <= 2 ? '高' : '一般';
  if (level === '中') return cs === 0 ? '高' : '一般';
  return '一般';
}

function ratioRank(tier) {
  return { 极高: 0, 高: 1, 一般: 2 }[tier] ?? 3;
}

function evidenceRank(e) {
  return { A: 0, B: 1, C: 2 }[e] ?? 3;
}

function parseTags(comment) {
  // <!-- 成本标签: 钱=少 时间=少 毅力=否 收益=中 口径=死亡率 -->
  const money = comment.match(/钱=([^\s]+)/)?.[1] ?? '少';
  const time = comment.match(/时间=([^\s]+)/)?.[1] ?? '中';
  const will = comment.match(/毅力=([^\s]+)/)?.[1] ?? '些';
  const benefit = comment.match(/收益=([^\s]+)/)?.[1] ?? '中';
  const axis = comment.match(/口径=([^\s\-]+)/)?.[1] ?? '其他';
  return { money, time, will, benefit, axis };
}

function parseSectionsTable(readme) {
  const sections = [];
  const tableMatch = readme.match(/## 这本书想回答的问题([\s\S]*?)(\n## |\n---)/);
  if (!tableMatch) return sections;
  const rows = tableMatch[1].match(/\|[^|\n]+\|[^|\n]+\|/g) || [];
  for (const row of rows) {
    if (row.includes('---') || row.includes('问题')) continue;
    const cells = row.split('|').map((c) => c.trim()).filter(Boolean);
    if (cells.length < 2) continue;
    const question = cells[0];
    const link = cells[1];
    const fileMatch = link.match(/book\/([^)\]]+\.md)/);
    const titleMatch = link.match(/\[([^\]]+)\]/);
    if (!fileMatch) continue;
    const file = fileMatch[1];
    const sectionNo = parseInt(file, 10);
    sections.push({
      sectionNo,
      file,
      title: titleMatch?.[1] ?? file,
      question,
    });
  }
  return sections;
}

function parseBookFile(filePath, sectionMeta) {
  const text = fs.readFileSync(filePath, 'utf8');
  const sectionNo = sectionMeta?.sectionNo ?? parseInt(path.basename(filePath), 10);
  const sectionTitle =
    sectionMeta?.title ??
    text.match(/^#\s+(.+)$/m)?.[1]?.replace(/^\d+\.\s*/, '') ??
    path.basename(filePath, '.md');

  const parts = text.split(/^### (?=\d+\. )/m).slice(1);
  const entries = [];
  for (const part of parts) {
    const titleLine = part.split('\n')[0] || '';
    const numMatch = titleLine.match(/^(\d+)\.\s*(.+)$/);
    if (!numMatch) continue;
    const entryNo = parseInt(numMatch[1], 10);
    const title = numMatch[2].trim();
    const body = part.slice(titleLine.length).trim();
    const tagComment = body.match(/<!--\s*成本标签:([^>]+)-->/)?.[0] ?? '';
    const tags = parseTags(tagComment);
    const evidence = body.match(/- 证据等级：\s*([ABC])/)?.[1] ?? 'C';
    const cs = costScore(tags);
    const tier = ratioTier(tags.benefit, cs);
    entries.push({
      id: `${sectionNo}-${entryNo}`,
      sectionNo,
      sectionTitle,
      entryNo,
      title,
      tags,
      evidence,
      costScore: cs,
      ratioTier: tier,
      body,
    });
  }
  return { sectionNo, sectionTitle, question: sectionMeta?.question ?? '', entries };
}

function main() {
  if (!fs.existsSync(path.join(SOURCE, 'book'))) {
    console.error(`HLTB source not found at ${SOURCE}. Clone HowToLiveBetter first.`);
    process.exit(1);
  }

  const readme = fs.readFileSync(path.join(SOURCE, 'README.md'), 'utf8');
  const sectionMetas = parseSectionsTable(readme);
  const byFile = Object.fromEntries(sectionMetas.map((s) => [s.file, s]));

  const bookDir = path.join(SOURCE, 'book');
  const files = fs.readdirSync(bookDir).filter((f) => f.endsWith('.md')).sort();
  const sections = [];
  const entries = [];

  for (const file of files) {
    const meta = byFile[file] || {
      sectionNo: parseInt(file, 10),
      file,
      title: file,
      question: '',
    };
    const parsed = parseBookFile(path.join(bookDir, file), meta);
    sections.push({
      sectionNo: parsed.sectionNo,
      title: parsed.sectionTitle,
      file,
      question: parsed.question,
      entryCount: parsed.entries.length,
    });
    entries.push(...parsed.entries);
  }

  entries.sort((a, b) => {
    if (a.tags.axis !== b.tags.axis) return a.tags.axis.localeCompare(b.tags.axis);
    const r = ratioRank(a.ratioTier) - ratioRank(b.ratioTier);
    if (r !== 0) return r;
    return evidenceRank(a.evidence) - evidenceRank(b.evidence);
  });

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const index = {
    source: 'https://github.com/eternity4719/HowToLiveBetter',
    license: 'Unlicense',
    builtAt: new Date().toISOString(),
    costWeights: COST_W,
    sections,
    entries,
  };

  const outPath = path.join(OUT_DIR, 'index.json');
  fs.writeFileSync(outPath, JSON.stringify(index));
  const kb = Math.round(fs.statSync(outPath).size / 1024);
  console.log(`Wrote ${entries.length} entries / ${sections.length} sections → ${outPath} (${kb} KB)`);
}

main();
