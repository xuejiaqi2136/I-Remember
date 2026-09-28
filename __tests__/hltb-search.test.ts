import assert from 'node:assert/strict';
import {
  detectSafety,
  emptyBookAnswer,
  searchEntries,
} from '../lib/hltb/index';
assert.equal(detectSafety('有人倒地没呼吸怎么办'), 'emergency');
assert.equal(detectSafety('我真的不想活了'), 'suicide');
assert.equal(detectSafety('我已经被刑事拘留了'), 'legal');
assert.equal(detectSafety('怎么对付拖延'), null);

const hits = searchEntries('拖延 大任务拆成小步骤', 5);
assert.ok(hits.length > 0, 'expected search hits for procrastination');
assert.ok(
  hits.some((h) => h.title.includes('拆') || h.body.includes('拖延')),
  'expected related entry about splitting tasks or procrastination'
);

const empty = emptyBookAnswer('火星移民要不要现在报名');
assert.match(empty, /书里没写到这件事/);

console.log('hltb-search tests passed');
