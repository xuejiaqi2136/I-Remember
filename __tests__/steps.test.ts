import assert from 'node:assert/strict';
import { parseSimpleSteps } from '../lib/ai/steps';

const steps = parseSimpleSteps(`1. 打开文档
2. 写三段大纲
3. 先写引言两句
别做这些`);
assert.deepEqual(steps, ['打开文档', '写三段大纲', '先写引言两句']);

const bullets = parseSimpleSteps(`- 坐下
• 打开电脑
* 打开草稿`);
assert.equal(bullets.length, 3);

console.log('steps tests passed');
