# CCC Opencode 模型切换功能实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在 cce 现有架构基础上扩展，支持 opencode 模型切换，实现与 claude code 配置的统一管理

**Architecture:** 复用 cce 的 profile 管理模式，通过扩展 Profile 类型支持 opencode 配置；新增版本字段管理迭代；向后兼容现有 claude-only profile

**Tech Stack:** TypeScript, Node.js, Commander.js, Inquirer.js

---

## 前置准备

**确保已完成：**
- [ ] 已阅读设计文档 `docs/plans/2025-02-09-opencode-model-switching-design.md`
- [ ] 理解现有 cce 架构（config.ts, profile.ts, use.ts 等）
- [ ] 理解 opencode.json 配置结构

---

## Task 1: 更新 Profile 类型定义

**Files:**
- Modify: `cce/src/types/index.ts`

**Step 1: 添加新类型定义（在现有 Profile 类型旁）**

添加以下内容到 `types/index.ts`：

```typescript
// Profile 版本号，用于迭代区分
export type ProfileVersion = '1';

// Profile 类型：claude（仅 Claude Code）、opencode（仅 Opencode）、both（双工具）
export type ProfileType = 'claude' | 'opencode' | 'both';

// Claude Code 配置
export interface ClaudeConfig {
  model: string;
  baseURL?: string;
  apiKey?: string;
}

// Opencode 配置
export interface OpencodeConfig {
  provider: string;
  model: string;
  baseURL?: string;
  apiKey?: string;
  options?: object;  // 模型特定选项，如 thinking
}

// 扩展的 Profile 接口（向后兼容）
export interface Profile {
  // 版本号，用于迭代管理（默认 "1"）
  version?: ProfileVersion;
  
  name: string;
  description?: string;
  
  // Profile 类型
  type: ProfileType;
  
  // Claude Code 配置（type !== 'opencode' 时使用）
  claudeConfig?: ClaudeConfig;
  
  // Opencode 配置（type !== 'claude' 时使用）
  opencodeConfig?: OpencodeConfig;
  
  // 向后兼容：传统环境变量方式（仅 claude 类型）
  env?: Record<string, string>;
  
  createdAt: string;
  updatedAt: string;
}

// 用于检测 profile 是否需要升级
export function isLegacyProfile(profile: any): boolean {
  return !profile.version || profile.version === undefined;
}

// 迁移旧版 profile 到新版
export function migrateProfile(profile: any): Profile {
  if (isLegacyProfile(profile)) {
    return {
      ...profile,
      version: '1',
      type: 'claude',  // 旧版默认为 claude 类型
    };
  }
  return profile as Profile;
}
```

**Step 2: 确保向后兼容**

验证现有 Profile 类型不会被破坏。如果原 Profile 类型存在，保留它并标记为 deprecated：

```typescript
// 旧版 Profile（已弃用，保留向后兼容）
/** @deprecated 使用新版 Profile 接口 */
export interface LegacyProfile {
  name: string;
  description?: string;
  env: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}
```

**Step 3: 验证类型定义**

运行 TypeScript 检查：

```bash
cd cce
npm run build
```

Expected: 编译成功，无类型错误

**Step 4: 提交**

```bash
cd cce
git add src/types/index.ts
git commit -m "feat(types): add extended Profile types with version support

- Add ProfileVersion, ProfileType type definitions
- Add ClaudeConfig and OpencodeConfig interfaces
- Add version field to Profile for iteration management
- Add migration helpers for legacy profiles
- Maintain backward compatibility with existing types"
```

---

## Task 2: 更新 Profile 核心操作

**Files:**
- Modify: `cce/src/core/profile.ts`
- Test: `cce/src/core/__tests__/profile.test.ts`（如果不存在则创建）

**Step 1: 更新 profile.ts 添加版本迁移逻辑**

在 `profile.ts` 中：

1. 导入新类型和迁移函数：

```typescript
import { 
  Profile, 
  isLegacyProfile, 
  migrateProfile 
} from '../types/index.js';
```

2. 修改 `getProfile` 函数，添加自动迁移：

```typescript
export async function getProfile(name: string): Promise<Profile | null> {
  const profilePath = await getProfilePath(name);
  const data = await readJson<any>(profilePath);
  
  if (!data) return null;
  
  // 自动迁移旧版 profile
  if (isLegacyProfile(data)) {
    console.log(`Migrating legacy profile '${name}' to version 1`);
    const migrated = migrateProfile(data);
    // 可选：自动保存迁移后的版本
    await saveProfile(migrated);
    return migrated;
  }
  
  return data as Profile;
}
```

3. 确保 `saveProfile` 正确处理新版本：

```typescript
export async function saveProfile(profile: Profile): Promise<void> {
  const profilePath = await getProfilePath(profile.name);
  await ensureDir(PROFILES_DIR);
  
  // 确保 version 字段存在
  const profileToSave: Profile = {
    ...profile,
    version: profile.version || '1',
    updatedAt: new Date().toISOString(),
  };
  
  await writeJson(profilePath, profileToSave);
}
```

**Step 2: 编写测试**

创建 `cce/src/core/__tests__/profile.test.ts`：

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getProfile, saveProfile, getProfilePath } from '../profile.js';
import { Profile } from '../../types/index.js';
import { fileExists, removeFile } from '../../utils/file.js';

describe('Profile version management', () => {
  const testProfileName = 'test-profile-version';
  
  beforeEach(async () => {
    // 清理测试环境
    const path = await getProfilePath(testProfileName);
    if (await fileExists(path)) {
      await removeFile(path);
    }
  });
  
  afterEach(async () => {
    // 清理测试环境
    const path = await getProfilePath(testProfileName);
    if (await fileExists(path)) {
      await removeFile(path);
    }
  });
  
  it('should add version "1" when saving new profile', async () => {
    const profile: Profile = {
      name: testProfileName,
      type: 'claude',
      claudeConfig: {
        model: 'test-model',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await saveProfile(profile);
    const saved = await getProfile(testProfileName);
    
    expect(saved).not.toBeNull();
    expect(saved?.version).toBe('1');
  });
  
  it('should migrate legacy profile without version field', async () => {
    // 直接写入一个旧版格式的 profile（无 version 字段）
    const legacyProfile = {
      name: testProfileName,
      description: 'Legacy profile',
      env: {
        ANTHROPIC_MODEL: 'test-model',
      },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };
    
    const profilePath = await getProfilePath(testProfileName);
    await writeJson(profilePath, legacyProfile);
    
    // 读取时应自动迁移
    const migrated = await getProfile(testProfileName);
    
    expect(migrated).not.toBeNull();
    expect(migrated?.version).toBe('1');
    expect(migrated?.type).toBe('claude');  // 旧版默认迁移为 claude 类型
  });
});
```

**Step 3: 运行测试**

```bash
cd cce
npm test -- src/core/__tests__/profile.test.ts
```

Expected: 所有测试通过

**Step 4: 提交**

```bash
cd cce
git add src/core/profile.ts src/core/__tests__/profile.test.ts
git commit -m "feat(profile): add automatic version migration

- Update getProfile to auto-migrate legacy profiles
- Add version field to all saved profiles
- Add comprehensive tests for version management
- Maintain backward compatibility with existing profiles"
```

---

**后续任务待续...**

下一步任务预告：
- Task 3: 更新 CLI 命令（create/use 支持 type 选择）
- Task 4: 添加 opencode 配置操作模块
- Task 5: 集成测试和文档更新

是否需要继续制定后续任务的详细计划？