import assert from 'node:assert/strict';
import { chatCompletionsUrl, normalizeBaseUrl } from '../lib/ai/url';

assert.equal(normalizeBaseUrl('https://api.example.com'), 'https://api.example.com/v1');
assert.equal(normalizeBaseUrl('https://api.example.com/'), 'https://api.example.com/v1');
assert.equal(normalizeBaseUrl('https://api.example.com/v1'), 'https://api.example.com/v1');
assert.equal(normalizeBaseUrl('https://api.example.com/v1/'), 'https://api.example.com/v1');
assert.equal(normalizeBaseUrl('api.example.com/v1'), 'https://api.example.com/v1');

assert.equal(
  chatCompletionsUrl('https://relay.example.com'),
  'https://relay.example.com/v1/chat/completions'
);
assert.equal(
  chatCompletionsUrl('https://relay.example.com/v1'),
  'https://relay.example.com/v1/chat/completions'
);

console.log('ai-client tests passed');
