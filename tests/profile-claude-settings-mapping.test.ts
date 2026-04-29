import { describe, it, expect } from 'vitest';
import { sanitizeVendorInput } from '../src/commands/provider.js';
import { sanitizeClaudeCodeSettingsInput } from '../src/commands/create.js';

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

  it('normalizes vendor from prompt value', () => {
    expect(sanitizeVendorInput('deepseek')).toBe('deepseek');
  });
});