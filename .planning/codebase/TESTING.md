# 测试模式

**分析日期:** 2026-05-01

## 测试框架

**Runner:**
- Vitest 4.1.0
- 配置: `vitest.config.ts`

**Assertion 库:**
- Vitest 内置 `expect`（兼容 Jest API）

**运行命令:**
```bash
npm test              # 运行所有测试 (vitest run)
npm run test:watch    # 监听模式 (vitest)
```

## 测试配置

**`vitest.config.ts`:**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,       // 全局 API: describe/it/expect 无需显式导入
    environment: 'node', // Node.js 环境
  },
});
```

**关键特性:**
- `globals: true`: 允许直接使用 `describe`/`it`/`expect`，无需每个文件导入
- `environment: 'node'`: 测试运行在 Node.js 环境，支持 `fs`、`path` 等内置模块
- 未配置覆盖率目标
- 未配置路径别名

## 测试文件组织

**位置:**
- 独立 `tests/` 目录（与 `src/` 平级）
- 测试文件导入源文件使用相对路径: `../src/utils/validation.js`

**命名:**
- 模式: `<module>.test.ts`
- 示例: `tests/validation.test.ts`

**当前测试文件:**
```
tests/
└── validation.test.ts    # src/utils/validation.ts 的测试
```

## 测试结构

**Suite 组织:**
```typescript
import { describe, it, expect } from 'vitest';
import { validateName, validateNameOrThrow } from '../src/utils/validation.js';

describe('validateName', () => {
  describe('路径遍历防护', () => {
    it('应拒绝包含 .. 的名称', () => {
      expect(validateName('../etc', 'Provider')).toEqual({
        valid: false,
        error: 'Provider name 包含非法字符',
      });
    });
  });

  describe('空值验证', () => {
    it('应拒绝空字符串', () => {
      expect(validateName('', 'Provider')).toEqual({
        valid: false,
        error: 'Provider name 不能为空',
      });
    });
  });
});
```

**模式:**
- 外层 `describe` 以函数名命名
- 内层 `describe` 按功能场景分组
- 测试用例使用中文描述，以 "应" 开头
- 使用 `toEqual` 做深度对象比较
- 使用 `toThrow` / `not.toThrow` 测试异常

**嵌套组织规则:**
- 第一层: 被测函数名
- 第二层: 功能场景（如 "路径遍历防护"、"空值验证"、"放宽的名称格式验证"）
- 测试用例: 描述预期行为

## Mocking

**框架:** Vitest 内置 `vi` 对象

**当前状态:** 未在测试中使用任何 mock

**需要 Mock 的场景（待编写测试时）:**
- `fs` 模块: 核心模块大量使用 `fs/promises`，需要用 `vi.mock('fs/promises')` mock
- `os.homedir()`: 配置路径依赖 home 目录
- `inquirer`: 交互式命令的 prompt 需要 mock
- `process.exit`: 命令函数中调用 `process.exit`，需要 `vi.spyOn(process, 'exit').mockImplementation()`

**推荐的 Mock 模式:**
```typescript
import { vi } from 'vitest';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
    readdir: vi.fn(),
    unlink: vi.fn(),
    access: vi.fn(),
  },
}));

// Mock os.homedir
vi.mock('os', () => ({
  default: {
    homedir: vi.fn(() => '/home/testuser'),
  },
}));
```

**什么需要 Mock:**
- 文件系统操作（`fs/promises`）: 避免测试污染真实文件系统
- 环境相关（`os.homedir()`）: 使测试路径可预测
- 交互式输入（`inquirer`）: 自动化测试无法交互
- 进程退出（`process.exit`）: 防止测试进程退出
- 外部命令（`open`）: 避免打开浏览器

**什么不需要 Mock:**
- 纯逻辑函数: `validateName`、`validateProvider`、`validateProfile`、`resolveConfig`
- 类型定义和常量
- `logger` 工具（可选 mock 以减少噪音）

## Fixtures 和工厂

**测试数据:**
- 当前无 fixtures 目录或工厂函数
- 测试中直接内联构造测试数据

**推荐的工厂模式:**
```typescript
// tests/helpers/factories.ts
import type { Provider, Profile } from '../../src/types/index.js';

export function createProvider(overrides: Partial<Provider> = {}): Provider {
  return {
    name: 'test-provider',
    displayName: 'Test Provider',
    type: 'openai-compatible',
    baseURL: 'https://api.example.com/v1',
    apiKey: 'sk-test-key-12345678',
    models: ['model-a', 'model-b'],
    defaultModel: 'model-a',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function createProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    name: 'test-profile',
    provider: 'test-provider',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}
```

**Fixtures 位置（建议）:**
- `tests/helpers/` -- 工厂函数和共享工具
- `tests/fixtures/` -- 静态测试数据文件（如 JSON 配置文件）

## 覆盖率

**要求:** 无强制覆盖率目标

**查看覆盖率:**
```bash
npx vitest run --coverage
```

**当前状态:** 仅有 1 个测试文件 (`validation.test.ts`)，覆盖率极低

**优先测试模块（按 CLAUDE.md 规划）:**
1. `src/utils/validation.ts` -- 已有测试
2. `src/core/switch.ts` -- 未测试
3. `src/core/profile.ts` -- 未测试
4. `src/core/provider.ts` -- 未测试
5. `src/core/configGenerator.ts` -- 未测试

## 测试类型

**单元测试:**
- 范围: 纯函数逻辑、验证函数、配置解析
- 当前: 仅 `validation.test.ts`
- 待补充: `validateProvider`、`validateProfile`、`resolveConfig`、`maskApiKey`

**集成测试:**
- 范围: 涉及文件系统 CRUD 的操作
- 当前: 无
- 需要: mock `fs/promises` 和 `os.homedir()` 后测试 `profile.ts`、`provider.ts`

**E2E 测试:**
- 当前: 未使用
- 可选方向: 使用 `child_process.exec` 测试 CLI 命令的完整执行流程

## 常见模式

**验证函数测试:**
```typescript
describe('validateName', () => {
  describe('路径遍历防护', () => {
    it('应拒绝包含 .. 的名称', () => {
      expect(validateName('../etc', 'Provider')).toEqual({
        valid: false,
        error: 'Provider name 包含非法字符',
      });
    });
  });

  describe('有效输入', () => {
    it('应接受简单的英文名称', () => {
      expect(validateName('my-provider', 'Provider')).toEqual({ valid: true });
    });
  });
});
```

**异常测试:**
```typescript
describe('validateNameOrThrow', () => {
  it('有效名称不应抛出异常', () => {
    expect(() => validateNameOrThrow('valid-name', 'Provider')).not.toThrow();
  });

  it('无效名称应抛出异常', () => {
    expect(() => validateNameOrThrow('../etc', 'Provider')).toThrow('Provider name 包含非法字符');
  });
});
```

**类型边界测试:**
```typescript
it('应拒绝 null/undefined', () => {
  expect(validateName(null as unknown as string, 'Provider')).toEqual({
    valid: false,
    error: 'Provider name 不能为空',
  });
});
```

## 测试编写优先级

**P0 -- 纯函数（无依赖，最高投入产出比）:**
- `src/utils/validation.ts`: `validateName` -- 已覆盖
- `src/core/profile.ts`: `validateProfile`
- `src/core/provider.ts`: `validateProvider`
- `src/core/switch.ts`: `resolveConfig`
- `src/commands/show.ts`: `maskApiKey`、`src/commands/current.ts`: `maskApiKey`、`src/commands/provider.ts`: `maskApiKey`

**P1 -- 核心逻辑（需要 mock fs）:**
- `src/core/profile.ts`: CRUD 操作
- `src/core/provider.ts`: CRUD 操作 + `isProviderInUse` + `getProviderUsage`
- `src/core/switch.ts`: `switchProfile`
- `src/core/configGenerator.ts`: `generateClaudeConfig` + `generateOpencodeConfig`

**P2 -- 命令和 WebUI:**
- `src/commands/*.ts`: 命令处理函数（需要 mock inquirer + process.exit）
- `src/core/webuiServer.ts`: API 路由（需要 mock express 或使用 supertest）

## Vitest 配置注意事项

**导入路径:**
- 测试文件中导入源文件使用 `.js` 扩展名: `../src/utils/validation.js`
- Vitest 在 Node 环境下正确解析 TypeScript 路径

**globals: true 的影响:**
- `describe`、`it`、`expect`、`vi` 全局可用
- 现有测试文件仍显式导入: `import { describe, it, expect } from 'vitest'`
- 两种风格均可，推荐保持显式导入以明确依赖

---

*测试分析: 2026-05-01*
