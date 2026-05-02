import { describe, it, expect } from 'vitest';
import { validateProvider } from '../src/core/provider.js';
import type { Provider } from '../src/types/index.js';

function makeProvider(overrides: Partial<Provider> = {}): Provider {
  return {
    name: 'deepseek-prod',
    displayName: 'DeepSeek Prod',
    type: 'openai-compatible',
    source: 'deepseek',
    baseURL: 'https://api.deepseek.com',
    apiKey: 'sk-deepseek-test',
    models: ['deepseek-chat'],
    defaultModel: 'deepseek-chat',
    ...overrides,
  };
}

describe('validateProvider source', () => {
  it('accepts missing source for backward compatibility', () => {
    const errors = validateProvider(makeProvider({ source: undefined }));
    expect(errors.find((e) => e.field === 'source')).toBeUndefined();
  });

  it('accepts known source values', () => {
    const errors = validateProvider(makeProvider({ source: 'deepseek' }));
    expect(errors.find((e) => e.field === 'source')).toBeUndefined();
  });

  it('rejects unknown source values', () => {
    const errors = validateProvider(makeProvider({ source: 'foo' as never }));
    expect(errors.find((e) => e.field === 'source')?.message).toContain('source');
  });
});
