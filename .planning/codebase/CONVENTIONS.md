# 编码规范

**分析日期:** 2026-05-01

## 命名模式

**文件:**
- 命令文件: `camelCase.ts` -- 如 `create.ts`、`provider.ts`、`webuiServer.ts`
- 核心模块: `camelCase.ts` -- 如 `configGenerator.ts`、`profile.ts`
- 工具模块: `camelCase.ts` -- 如 `validation.ts`、`logger.ts`
- 类型文件: `index.ts` 放在 `types/` 目录下

**函数:**
- 命令处理函数: `<command>Command` -- 如 `createCommand`、`initCommand`、`providerAddCommand`
- CRUD 操作: `<verb><Entity>` -- 如 `listProfiles`、`getProvider`、`saveProfile`、`deleteProvider`
- 验证函数: `validate<Thing>` 返回 `{ valid: boolean; error?: string }`，或 `validate<Thing>OrThrow` 抛出异常
- 工具函数: `camelCase` 动词开头 -- 如 `ensureSecureDir`、`writeSecureFile`、`maskApiKey`
- 布尔查询: `<entity>Exists` -- 如 `providerExists`、`profileExists`、`fileExists`

**变量:**
- 常量: `UPPER_SNAKE_CASE` -- 如 `SECURE_DIR_MODE`、`SECURE_FILE_MODE`、`CONFIG_DIR`
- 普通变量: `camelCase` -- 如 `activeProfile`、`providerData`
- 类型别名: `PascalCase` -- 如 `ProviderType`、`EffectiveConfig`

**类型:**
- 接口: `PascalCase` -- 如 `Provider`、`Profile`、`EffectiveConfig`、`ValidationError`
- 类型别名: `PascalCase` -- 如 `ProviderType = 'openai-compatible' | 'anthropic-compatible' | 'custom'`
- 选项接口: `<Feature>Options` -- 如 `SwitchOptions`、`WebUIServerOptions`、`UiCommandOptions`
- 结果接口: `<Action>Result` -- 如 `SwitchResult`

## 代码风格

**格式化:**
- 未配置 Prettier 或其他格式化工具
- 缩进: 2 空格（从源码实际观察）
- 行宽: 无强制限制，但实际代码行通常在 100 字符以内
- 分号: 使用分号结尾
- 引号: 单引号为主（如 `import './commands/init.js'`），JSON 内使用双引号

**Linting:**
- 未配置 ESLint
- 唯一的自动检查: Claude Code hooks 中的 `tsc --noEmit` 类型检查（`.claude/hooks/ts-check.sh`）
- 无 lint 规则强制执行

**TypeScript 严格模式:**
- `tsconfig.json` 启用了 `strict: true`
- `forceConsistentCasingInFileNames: true`
- `skipLibCheck: true`
- 目标: `ES2022`，模块: `CommonJS`

## 导入组织

**顺序:**
1. Node.js 内置模块 -- `fs`、`path`、`os`
2. 第三方包 -- `commander`、`inquirer`、`chalk`、`express`、`open`
3. 项目核心模块 -- `../core/xxx.js`
4. 项目工具模块 -- `../utils/xxx.js`
5. 类型导入 -- `../types/index.js`（使用 `import type`）

**路径别名:**
- 无路径别名配置
- 所有相对导入使用 `.js` 扩展名（TypeScript CommonJS 约定），如 `import { logger } from '../utils/logger.js'`

**动态导入模式:**
- 在 `src/core/profile.ts` 和 `src/core/provider.ts` 中使用动态 `await import()` 避免循环依赖
- 示例: `const { listProviders } = await import('./provider.js');`

**导入风格示例:**
```typescript
import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { logger } from '../utils/logger.js';
import { validateName } from '../utils/validation.js';
import type { Profile, Provider, EffectiveConfig } from '../types/index.js';
import { PROFILES_DIR } from './config.js';
```

## 错误处理

**CLI 命令层（commands/）:**
- 每个命令处理函数体用 `try-catch` 包裹
- catch 块中: `logger.error('操作失败', err)` 然后 `process.exit(1)`
- 不可恢复的错误使用 `process.exit(1)` 退出
- 正常退出使用 `process.exit(0)`

```typescript
export async function someCommand(name: string): Promise<void> {
  try {
    // 命令逻辑
  } catch (err) {
    logger.error('操作失败', err);
    process.exit(1);
  }
}
```

**核心模块层（core/）:**
- 函数内部 `try-catch`，日志记录后重新抛出异常
- 对 `ENOENT` 等已知错误码特殊处理，返回 `null` 而非抛出
- 验证失败返回 `ValidationError[]` 数组（不抛出）
- `saveProfile`/`saveProvider` 中验证失败抛出 `Error`

```typescript
// 文件不存在时返回 null
if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
  return null;
}
```

**WebUI 层（webuiServer.ts）:**
- 每个路由处理器用 `try-catch` 包裹
- 错误转为 HTTP 状态码: 400（验证失败）、404（不存在）、500（内部错误）
- 错误响应格式: `{ error: '错误消息' }`
- API 响应中过滤敏感字段（`sanitizeProvider` 移除 `apiKey`）

**switch.ts 策略:**
- 使用 `SwitchResult` 对象收集所有错误，不提前退出
- `result.errors` 数组累积错误信息
- `result.success` 标记整体成功/失败

**用户输入验证:**
- 路径遍历防护: 所有名称参数都通过 `validateName()` 验证
- 验证返回 `{ valid: boolean; error?: string }` 模式
- `validateNameOrThrow` 便捷版本，无效时抛出 Error
- WebUI 路由中额外验证: 名称长度限制（64字符）、描述长度限制（256字符）、模型名称长度限制（128字符）

## 日志

**框架:** 自定义 `logger` 对象（`src/utils/logger.ts`）

**日志级别:**
- `logger.info(msg)` -- 蓝色 `ℹ` 前缀，信息性消息
- `logger.success(msg)` -- 绿色 `✔` 前缀，操作成功
- `logger.error(msg)` -- 红色 `✖` 前缀，错误消息
- `logger.warn(msg)` -- 黄色 `⚠` 前缀，警告消息
- `logger.dim(msg)` -- 灰色文本，次要信息

**使用模式:**
- 核心模块使用 `logger.info()` 记录操作状态（如 "Provider xxx 已保存"）
- 核心模块使用 `logger.error()` 记录异常后重新抛出
- 命令层使用 `console.log()` + `chalk` 进行用户界面输出
- 命令层使用 `logger.error()` 处理 catch 块错误
- 用户可见的 emoji 标记: `❌` 错误、`✓` 成功、`⚠` 警告

**何时使用 logger vs console.log:**
- `logger.*`: 核心模块内部状态记录、错误日志
- `console.log()` + `chalk`: 命令层面向用户的输出、格式化展示
- 不使用 `console.error()`

## 注释

**何时注释:**
- 文件顶部: 模块用途说明（使用 `// ===` 分隔线标注区域）
- 函数: JSDoc 注释说明用途和参数
- 关键业务逻辑: 行内注释解释意图
- 安全相关代码: 注释说明安全措施

**JSDoc/TSDoc:**
- 核心工具函数使用 JSDoc 注释: `@param`、`@returns`、`@throws`
- 命令处理函数通常不加 JSDoc

```typescript
/**
 * 验证名称格式，防止路径遍历攻击
 * @param name - 要验证的名称
 * @param type - 名称类型（用于错误消息）
 * @returns 验证结果
 */
export function validateName(name: string, type: string): { valid: boolean; error?: string } {
```

**区域分隔:**
- 使用 `// ============...` 分隔线标注代码区域
- 格式: `// ===<Function Name>===` 或 `// ===<Section Name>===`
- 见 `src/core/profile.ts`、`src/core/provider.ts`、`src/core/configGenerator.ts`

## 函数设计

**大小:**
- 命令函数: 通常 30-100 行
- 核心函数: 通常 10-30 行
- WebUI 路由处理器: 20-50 行

**参数:**
- 单参数: 直接传递
- 多参数: 使用选项对象（`SwitchOptions`、`WebUIServerOptions`）
- 命令处理函数: 接收 Commander 解析的参数

**返回值:**
- 异步操作: `Promise<void>` 或 `Promise<T | null>`
- 查询操作: `Promise<T | null>`（未找到返回 null）
- 列表操作: `Promise<T[]>`（空列表返回 `[]`）
- 复合操作: `Promise<ResultObject>`（如 `SwitchResult`）
- 验证操作: `{ valid: boolean; error?: string }` 或 `ValidationError[]`
- 布尔查询: `Promise<boolean>`

## 模块设计

**导出:**
- 命名导出为主，无默认导出
- 命令文件导出: `export async function <command>Command()`
- 核心文件导出: 多个公共函数 + 可能的内部函数（不导出）
- 类型文件: `export interface` 和 `export type`

**Barrel 文件:**
- 仅 `src/types/index.ts` 作为类型 barrel 文件
- 其他模块直接从源文件导入，无 barrel 聚合

**文件权限常量:**
- `SECURE_DIR_MODE = 0o700` 和 `SECURE_FILE_MODE = 0o600` 在多个文件中重复定义
- 位置: `src/utils/file.ts`、`src/core/profile.ts`、`src/core/provider.ts`、`src/core/configGenerator.ts`、`src/commands/provider.ts`
- 新代码应使用 `src/utils/file.ts` 中的 `ensureSecureDir`/`writeSecureFile`，避免重复定义

## 安全编码模式

**路径遍历防护:**
- 所有接受用户输入名称的函数必须调用 `validateName()`
- 检查 `..`、`/`、`\` 字符
- 在 core 层和 command 层双重验证

**API Key 脱敏:**
- CLI 输出中使用 `maskApiKey()` 函数
- WebUI API 响应中使用 `sanitizeProvider()` 移除 `apiKey` 字段
- `maskApiKey` 在 `show.ts`、`current.ts`、`provider.ts` 中重复定义（应提取到 utils）

**文件权限:**
- 配置目录: `0o700`（仅所有者可读写执行）
- 配置文件: `0o600`（仅所有者可读写）
- WebUI 绑定 `127.0.0.1`，禁止局域网访问

## 添加新命令规范

1. 在 `src/commands/<command>.ts` 创建文件
2. 导出 `async function <command>Command(...): Promise<void>`
3. 函数体用 `try-catch` 包裹
4. 在 `src/index.ts` 中: 添加 import + 注册 `.command().description().action()`
5. action 回调中用 `try-catch` 包裹，错误时 `logger.error()` + `process.exit(1)`
6. 如需新类型，在 `src/types/index.ts` 中添加
7. 运行 `npm run build` 验证编译通过

---

*规范分析: 2026-05-01*
