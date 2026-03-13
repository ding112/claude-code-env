---
name: cce-dev
description: 为 cce 添加新命令的开发向导
disable-model-invocation: true
---

# cce 新命令开发向导

为 claude-code-env (cce) CLI 工具添加新命令，遵循项目既有模式。

## 开发流程

### 第一步：创建命令文件

在 `src/commands/<command>.ts` 创建文件，遵循以下模板：

```typescript
import { logger } from '../utils/logger.js';
import chalk from 'chalk';

export async function <command>Command(/* 参数 */): Promise<void> {
  try {
    // 命令逻辑
  } catch (error) {
    logger.error(`<command> 失败: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}
```

**约定**：
- 函数名格式：`<command>Command`，如 `statusCommand`
- 所有命令逻辑用 try-catch 包裹
- 错误使用 `logger.error()` 输出，然后 `process.exit(1)`
- 用户交互使用 `inquirer`，输出美化使用 `chalk`

### 第二步：注册到 CLI 入口

在 `src/index.ts` 中：

1. 顶部添加 import：
```typescript
import { <command>Command } from './commands/<command>.js';
```

2. 注册命令（参考已有命令的模式）：
```typescript
program
  .command('<command> [args]')
  .description('命令描述')
  .action(async (args) => {
    await <command>Command(args);
  });
```

### 第三步：更新类型（如需要）

如果命令涉及新的数据结构，在 `src/types/index.ts` 中添加类型定义。

### 第四步：构建验证

```bash
npm run build
```

确保编译通过、无类型错误。

### 第五步：手动测试

```bash
npm run dev -- <command>
```

## 参考文件

开发新命令时，优先参考以下现有实现：

| 场景 | 参考文件 |
|------|---------|
| 简单命令（无参数） | `src/commands/current.ts`, `src/commands/list.ts` |
| 带参数命令 | `src/commands/show.ts`, `src/commands/use.ts` |
| 交互式命令 | `src/commands/create.ts`, `src/commands/edit.ts` |
| 子命令组 | `src/commands/provider.ts` |
| CRUD 操作 | `src/core/profile.ts`, `src/core/provider.ts` |

## 可用的核心模块

| 模块 | 用途 |
|------|------|
| `src/core/config.ts` | 配置路径常量 (CONFIG_DIR, PROFILES_DIR 等) |
| `src/core/profile.ts` | Profile 的 CRUD 操作 |
| `src/core/provider.ts` | Provider 的 CRUD 操作 |
| `src/core/switch.ts` | Profile 切换与配置生成 |
| `src/utils/file.ts` | 安全文件读写 |
| `src/utils/logger.ts` | 日志输出 |
| `src/utils/validation.ts` | 名称验证 |
