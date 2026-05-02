import { describe, it, expect } from 'vitest';
import { resolveConfig } from '../src/core/switch.js';
import type { Profile, Provider } from '../src/types/index.js';

const provider: Provider = {
  name: 'deepseek-prod',
  displayName: 'DeepSeek Prod',
  type: 'anthropic-compatible',
  source: 'deepseek',
  baseURL: 'https://api.deepseek.com',
  apiKey: 'sk-test',
  models: ['deepseek-chat'],
  defaultModel: 'deepseek-chat',
};

describe('resolveConfig', () => {
  it('copies profile claudeCodeSettings to resolved config', () => {
    const profile: Profile = {
      name: 'ds-high',
      provider: 'deepseek-prod',
      model: 'deepseek-chat',
      claudeCodeSettings: { subagentModel: 'deepseek-reasoner', effortLevel: 'high' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const resolved = resolveConfig(profile, provider);
    expect(resolved.source).toBe('deepseek');
    expect(resolved.claudeCodeSettings).toEqual({
      subagentModel: 'deepseek-reasoner',
      effortLevel: 'high',
    });
  });

  it('drops empty claudeCodeSettings object', () => {
    const profile: Profile = {
      name: 'ds-empty',
      provider: 'deepseek-prod',
      claudeCodeSettings: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const resolved = resolveConfig(profile, provider);
    expect(resolved.claudeCodeSettings).toBeUndefined();
  });

  it('does not inherit source-level claudeCodeSettings defaults', () => {
    const profile: Profile = {
      name: 'ds-defaults',
      provider: 'deepseek-prod',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const resolved = resolveConfig(profile, provider);
    expect(resolved.source).toBe('deepseek');
    expect(resolved.claudeCodeSettings).toBeUndefined();
  });
});
