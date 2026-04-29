import { describe, it, expect } from 'vitest';
import { mergeClaudeEnv } from '../src/core/configGenerator.js';
import type { EffectiveConfig } from '../src/types/index.js';

describe('mergeClaudeEnv', () => {
  const baseConfig: EffectiveConfig = {
    baseURL: 'https://api.deepseek.com',
    apiKey: 'sk-test',
    model: 'deepseek-chat',
    providerName: 'deepseek-prod',
    providerDisplayName: 'DeepSeek Prod',
    isModelOverridden: false,
    vendor: 'deepseek',
  };

  it('cleans stale advanced keys before writing', () => {
    const env = mergeClaudeEnv(
      {
        KEEP_ME: '1',
        ANTHROPIC_DEFAULT_OPUS_MODEL: 'stale-opus',
        CLAUDE_CODE_EFFORT_LEVEL: 'stale',
      },
      {
        ...baseConfig,
        claudeCodeSettings: { effortLevel: 'high' },
      },
    );

    expect(env.KEEP_ME).toBe('1');
    expect(env.ANTHROPIC_DEFAULT_OPUS_MODEL).toBeUndefined();
    expect(env.CLAUDE_CODE_EFFORT_LEVEL).toBe('high');
  });

  it('does not write advanced keys when profile has no settings', () => {
    const env = mergeClaudeEnv(
      { ANTHROPIC_DEFAULT_HAIKU_MODEL: 'stale-haiku' },
      baseConfig,
    );

    expect(env.ANTHROPIC_DEFAULT_HAIKU_MODEL).toBeUndefined();
    expect(env.ANTHROPIC_MODEL).toBe('deepseek-chat');
  });
});