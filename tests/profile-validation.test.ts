import { describe, it, expect } from 'vitest';
import { validateProfile } from '../src/core/profile.js';
import type { Profile } from '../src/types/index.js';

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    name: 'ds-dev',
    provider: 'deepseek-prod',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('validateProfile claudeCodeSettings', () => {
  it('accepts valid effortLevel', () => {
    const errors = validateProfile(
      makeProfile({ claudeCodeSettings: { effortLevel: 'high' } }),
      ['deepseek-prod'],
    );
    expect(errors.find((e) => e.field.includes('effortLevel'))).toBeUndefined();
  });

  it('rejects invalid effortLevel', () => {
    const errors = validateProfile(
      makeProfile({ claudeCodeSettings: { effortLevel: 'ultra' as never } }),
      ['deepseek-prod'],
    );
    expect(errors.find((e) => e.field.includes('effortLevel'))?.message).toContain('low');
  });

  it('rejects non-string model fields', () => {
    const errors = validateProfile(
      makeProfile({ claudeCodeSettings: { subagentModel: 123 as never } }),
      ['deepseek-prod'],
    );
    expect(errors.find((e) => e.field.includes('subagentModel'))?.message).toContain('字符串');
  });

  it('rejects null and non-object claudeCodeSettings without throwing', () => {
    const nullErrors = validateProfile(
      makeProfile({ claudeCodeSettings: null as never }),
      ['deepseek-prod'],
    );
    expect(nullErrors.find((e) => e.field === 'claudeCodeSettings')?.message).toContain('必须是对象');

    const arrayErrors = validateProfile(
      makeProfile({ claudeCodeSettings: [] as never }),
      ['deepseek-prod'],
    );
    expect(arrayErrors.find((e) => e.field === 'claudeCodeSettings')?.message).toContain('必须是对象');
  });
});
