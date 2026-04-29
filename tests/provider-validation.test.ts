import { describe, it, expect } from 'vitest';
import { validateProvider } from '../src/core/provider.js';
import type { Provider } from '../src/types/index.js';

function makeProvider(overrides: Partial<Provider> = {}): Provider {
  return {
    name: 'deepseek-prod',
    displayName: 'DeepSeek Prod',
    type: 'openai-compatible',
    baseURL: 'https://api.deepseek.com',
    apiKey: 'sk-deepseek-test',
    models: ['deepseek-chat'],
    defaultModel: 'deepseek-chat',
    ...overrides,
  };
}

describe('validateProvider vendor', () => {
  it('accepts missing vendor for backward compatibility', () => {
    const errors = validateProvider(makeProvider({ vendor: undefined }));
    expect(errors.find((e) => e.field === 'vendor')).toBeUndefined();
  });

  it('accepts known vendor values', () => {
    const errors = validateProvider(makeProvider({ vendor: 'deepseek' }));
    expect(errors.find((e) => e.field === 'vendor')).toBeUndefined();
  });

  it('rejects unknown vendor values', () => {
    const errors = validateProvider(makeProvider({ vendor: 'foo' as never }));
    expect(errors.find((e) => e.field === 'vendor')?.message).toContain('vendor');
  });
});