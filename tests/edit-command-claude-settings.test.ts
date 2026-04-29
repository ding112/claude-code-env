import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Profile, Provider } from '../src/types/index.js';

const {
  promptMock,
  getProfileMock,
  saveProfileMock,
  getProviderMock,
} = vi.hoisted(() => ({
  promptMock: vi.fn(),
  getProfileMock: vi.fn(),
  saveProfileMock: vi.fn(),
  getProviderMock: vi.fn(),
}));

vi.mock('inquirer', () => ({
  default: {
    prompt: promptMock,
  },
}));

vi.mock('../src/core/profile.js', () => ({
  getProfile: getProfileMock,
  saveProfile: saveProfileMock,
}));

vi.mock('../src/core/provider.js', () => ({
  getProvider: getProviderMock,
}));

vi.mock('../src/utils/logger.js', () => ({
  logger: {
    error: vi.fn(),
  },
}));

import { editCommand } from '../src/commands/edit.js';

describe('editCommand claude settings defaults', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('preserves existing effortLevel when user keeps defaults', async () => {
    const profile: Profile = {
      name: 'dev',
      provider: 'deepseek-prod',
      claudeCodeSettings: {
        effortLevel: 'high',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const provider: Provider = {
      name: 'deepseek-prod',
      displayName: 'DeepSeek Prod',
      type: 'openai-compatible',
      vendor: 'deepseek',
      baseURL: 'https://api.deepseek.com',
      apiKey: 'sk-test',
      models: ['deepseek-chat'],
      defaultModel: 'deepseek-chat',
    };

    getProfileMock.mockResolvedValue(profile);
    getProviderMock.mockResolvedValue(provider);
    saveProfileMock.mockResolvedValue(undefined);

    promptMock
      .mockResolvedValueOnce({ action: 'claude-settings' })
      .mockImplementationOnce(async (questions: Array<{ name: string; default?: unknown }>) => {
        const answers: Record<string, unknown> = {};
        for (const q of questions) {
          answers[q.name] = q.default ?? '';
        }
        return answers;
      });

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await editCommand('dev');

    expect(saveProfileMock).toHaveBeenCalledTimes(1);
    const saved = saveProfileMock.mock.calls[0][0] as Profile;
    expect(saved.claudeCodeSettings?.effortLevel).toBe('high');

    logSpy.mockRestore();
  });
});
