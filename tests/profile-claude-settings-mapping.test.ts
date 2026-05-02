import { describe, it, expect } from 'vitest';
import { sanitizeSourceInput } from '../src/commands/provider.js';
import {
  sanitizeClaudeCodeSettingsInput,
  getSourceTemplateClaudeCodeSettings,
} from '../src/commands/create.js';

describe('command input mappers', () => {
  it('maps empty strings to undefined for claude settings', () => {
    expect(
      sanitizeClaudeCodeSettingsInput({
        defaultOpusModel: ' ',
        defaultSonnetModel: 'sonnet-x',
        defaultHaikuModel: '',
        subagentModel: '  ',
        effortLevel: 'high',
      }),
    ).toEqual({
      defaultSonnetModel: 'sonnet-x',
      effortLevel: 'high',
    });
  });

  it('keeps supported source value', () => {
    expect(sanitizeSourceInput('deepseek')).toBe('deepseek');
  });

  it('falls back to custom for unsupported source value', () => {
    expect(sanitizeSourceInput('not-a-source')).toBe('custom');
  });

  it('loads source template claude settings defaults', () => {
    expect(getSourceTemplateClaudeCodeSettings('deepseek')?.effortLevel).toBe('max');
  });
});
