import { describe, it, expect } from 'vitest';
import { getTemplate } from '../src/core/sourceTemplates.js';

describe('source templates', () => {
  it('exposes optional claudeCodeSettings from sources.json', () => {
    const template = getTemplate('deepseek');

    expect(template).toBeDefined();
    expect(template?.claudeCodeSettings).toEqual({
      effortLevel: 'medium',
    });
  });
});
