# Profile source defaults implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a profile inherit Claude Code advanced settings from its
provider source template, with profile values overriding source defaults
field-by-field, while keeping name validation permissive for `.` and `-`.

**Architecture:** Extend the source template schema to carry optional
`claudeCodeSettings`, then resolve effective settings in `src/core/switch.ts`
by merging profile values over source defaults. Keep validation centralized in
`src/utils/validation.ts` and remove duplicated Web UI name checks by reusing
the same validator.

**Tech Stack:** TypeScript, Vitest, Express, Commander, Inquirer

---

### Task 1: prove source defaults are not merged yet

**Files:**
- Modify: `tests/switch-resolve-config.test.ts`
- Test: `tests/switch-resolve-config.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('falls back to source claudeCodeSettings and lets profile override fields', () => {
  const profile: Profile = {
    name: 'ds-mixed',
    provider: 'deepseek-prod',
    claudeCodeSettings: { effortLevel: 'high' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sourceTemplate = {
    source: 'deepseek',
    displayName: 'DeepSeek',
    type: 'openai-compatible',
    baseURL: 'https://api.deepseek.com',
    models: ['deepseek-chat'],
    defaultModel: 'deepseek-chat',
    description: 'template',
    claudeCodeSettings: {
      subagentModel: 'deepseek-reasoner',
      effortLevel: 'medium',
    },
  };

  const resolved = resolveConfig(profile, provider, sourceTemplate);
  expect(resolved.claudeCodeSettings).toEqual({
    subagentModel: 'deepseek-reasoner',
    effortLevel: 'high',
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/switch-resolve-config.test.ts`
Expected: FAIL because `resolveConfig` does not accept a source template or
merge source defaults.

- [ ] **Step 3: Write minimal implementation**

```ts
const sourceSettings = sourceTemplate?.claudeCodeSettings;
const profileSettings = profile.claudeCodeSettings;

const claudeCodeSettings = compactClaudeCodeSettings({
  defaultOpusModel:
    profileSettings?.defaultOpusModel ?? sourceSettings?.defaultOpusModel,
  defaultSonnetModel:
    profileSettings?.defaultSonnetModel ?? sourceSettings?.defaultSonnetModel,
  defaultHaikuModel:
    profileSettings?.defaultHaikuModel ?? sourceSettings?.defaultHaikuModel,
  subagentModel:
    profileSettings?.subagentModel ?? sourceSettings?.subagentModel,
  effortLevel: profileSettings?.effortLevel ?? sourceSettings?.effortLevel,
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/switch-resolve-config.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/switch-resolve-config.test.ts src/core/switch.ts
git commit -m "test: cover source default claude settings merge"
```

### Task 2: load source template settings through the full switch path

**Files:**
- Modify: `src/core/sourceTemplates.ts`
- Modify: `src/types/index.ts`
- Modify: `src/core/sources.json`
- Modify: `src/core/switch.ts`
- Test: `tests/source-templates.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('accepts optional claudeCodeSettings in a source template', () => {
  expect(
    isValidSourceTemplate({
      source: 'deepseek',
      displayName: 'DeepSeek',
      type: 'anthropic-compatible',
      baseURL: 'https://api.deepseek.com/anthropic',
      models: ['deepseek-v4-flash'],
      defaultModel: 'deepseek-v4-flash',
      description: 'template',
      claudeCodeSettings: { effortLevel: 'medium' },
    }),
  ).toBe(true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/source-templates.test.ts`
Expected: FAIL because the template validator rejects the new field or the
helper is not exported for testing.

- [ ] **Step 3: Write minimal implementation**

```ts
if (t.claudeCodeSettings !== undefined) {
  const errors = validateProfileClaudeCodeSettings(t.claudeCodeSettings);
  if (errors.length > 0) return false;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/source-templates.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/source-templates.test.ts src/core/sourceTemplates.ts \
  src/types/index.ts src/core/sources.json src/core/switch.ts
git commit -m "feat: support source-level claude settings defaults"
```

### Task 3: keep name validation consistent across CLI and Web UI

**Files:**
- Modify: `src/utils/validation.ts`
- Modify: `src/core/webuiServer.ts`
- Test: `tests/validation.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('rejects names longer than 64 characters', () => {
  expect(validateName('a'.repeat(65), 'Profile')).toEqual({
    valid: false,
    error: 'Profile name 长度不能超过 64 个字符',
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/validation.test.ts`
Expected: FAIL because the shared validator does not enforce the length rule.

- [ ] **Step 3: Write minimal implementation**

```ts
if (trimmed.length > 64) {
  return { valid: false, error: `${type} name 长度不能超过 64 个字符` };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/validation.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/validation.test.ts src/utils/validation.ts src/core/webuiServer.ts
git commit -m "refactor: centralize profile name validation"
```

### Task 4: verify the targeted regression suite

**Files:**
- Test: `tests/switch-resolve-config.test.ts`
- Test: `tests/source-templates.test.ts`
- Test: `tests/validation.test.ts`
- Test: `tests/profile-validation.test.ts`

- [ ] **Step 1: Run the focused suite**

Run:
`npm test -- tests/switch-resolve-config.test.ts tests/source-templates.test.ts tests/validation.test.ts tests/profile-validation.test.ts`
Expected: PASS.

- [ ] **Step 2: Run the full suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 3: Review diff for scope control**

Run: `git diff -- src tests docs/superpowers/plans`
Expected: Only source default merge, source template schema, validation, and
tests changed.

- [ ] **Step 4: Commit**

```bash
git add tests src docs/superpowers/plans/2026-05-02-profile-source-defaults-implementation-plan.md
git commit -m "feat: inherit profile claude settings from source templates"
```
