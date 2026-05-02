import { describe, it, expect } from 'vitest';
import { resolveConfig } from '../src/core/switch.js';
import type { Profile, Provider } from '../src/types/index.js';
import type { SourceTemplate } from '../src/core/sourceTemplates.js';

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

const sourceTemplate: SourceTemplate = {
  source: 'deepseek',
  displayName: 'DeepSeek',
  type: 'anthropic-compatible',
  baseURL: 'https://api.deepseek.com/anthropic',
  models: ['deepseek-v4-flash'],
  defaultModel: 'deepseek-v4-flash',
  description: 'DeepSeek template',
  claudeCodeSettings: {
    subagentModel: 'deepseek-reasoner',
    effortLevel: 'medium',
  },
};

describe('resolveConfig', () => {
  it('copies source and profile claudeCodeSettings', () => {
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

  it('falls back to source claudeCodeSettings and lets profile override fields', () => {
    const profile: Profile = {
      name: 'ds-mixed',
      provider: 'deepseek-prod',
      claudeCodeSettings: { effortLevel: 'high' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const resolved = resolveConfig(profile, provider, sourceTemplate);
    expect(resolved.source).toBe('deepseek');
    expect(resolved.claudeCodeSettings).toEqual({
      subagentModel: 'deepseek-reasoner',
      effortLevel: 'high',
    });
  });

  it('uses source claudeCodeSettings when profile has none', () => {
    const profile: Profile = {
      name: 'ds-defaults',
      provider: 'deepseek-prod',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const resolved = resolveConfig(profile, provider, sourceTemplate);
    expect(resolved.claudeCodeSettings).toEqual({
      subagentModel: 'deepseek-reasoner',
      effortLevel: 'medium',
    });
  });
});
