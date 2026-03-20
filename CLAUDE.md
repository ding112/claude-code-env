# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**claude-code-env (cce)** 是一个 TypeScript CLI 工具，用于管理多个 Claude API 配置文件，并通过 Provider-Profile 架构切换不同的 API 端点，同时配置 Claude Code 和 OpenCode。

## 开发命令

```bash
# 构建
npm run build          # 编译 TypeScript 到 dist/

# 开发
npm run dev            # 使用 ts-node 运行 src/index.ts
npm start              # 运行编译后的 dist/index.js
```

## 项目结构

```
src/
├── index.ts          # CLI 入口点，使用 Commander
├── commands/         # 命令实现
│   ├── init.ts       # 初始化配置目录 (~/.config/cce)
│   ├── create.ts     # 创建新 Profile（交互式选择 Provider）
│   ├── use.ts        # 激活指定 Profile（不指定则交互式选择）
│   ├── list.ts       # 列出所有 Profiles
│   ├── show.ts       # 显示 Profile 详情
│   ├── edit.ts       # 编辑 Profile
│   ├── remove.ts     # 删除 Profile
│   ├── current.ts    # 显示当前激活的 Profile
│   ├── doctor.ts     # 检查配置是否正确
│   ├── provider.ts   # Provider 管理命令（add/list/show/edit/remove）
│   └── ui.ts         # 启动 WebUI 管理界面
├── core/
│   ├── config.ts     # 配置路径常量（CONFIG_DIR, PROFILES_DIR 等）
│   ├── configGenerator.ts  # 生成 Claude Code 和 OpenCode 配置文件
│   ├── profile.ts    # Profile CRUD 操作与配置解析
│   ├── provider.ts   # Provider CRUD 操作与验证
│   ├── switch.ts     # Profile 切换逻辑（调用 configGenerator）
│   └── webuiServer.ts   # WebUI Express 服务器
├── utils/
│   ├── file.ts       # 文件工具（安全读写、目录创建）
│   ├── logger.ts     # 日志工具
│   └── validation.ts # 名称验证（防路径遍历）
└── types/
    └── index.ts      # TypeScript 类型定义
```

## 架构

- **CLI 框架**: 使用 Commander (`commander` 包)
- **入口点**: `src/index.ts` - 定义所有命令并注册到程序
- **配置生成**: `src/core/configGenerator.ts` - 生成 Claude Code (`~/.claude/settings.json`) 和 OpenCode (`~/.config/opencode/opencode.json`) 配置
- **Provider 存储**: `~/.config/cce/providers/*.json` - API 端点定义
- **Profile 存储**: `~/.config/cce/profiles/*.json` - 用户配置，引用 providers
- **当前 Profile**: `~/.config/cce/active` - 包含当前激活的 Profile 名称
## 代码规范

- **语言模块**: TypeScript，输出为 CommonJS（import 使用 `.js` 扩展名）
- **严格模式**: TypeScript strict mode 已启用
- **缩进**: 2 空格
- **错误处理**: 所有命令动作使用 try-catch 包裹，使用 `logger.error()` 和 `process.exit(1)`

## 添加新命令

1. 在 `src/commands/<command>.ts` 创建文件
2. 导出函数: `export async function <command>Command(...)`
3. 在 `src/index.ts` 中导入并注册:
   ```typescript
   import { <command>Command } from './commands/<command>.js';
   program
     .command('<command> [args]')
     .description('...')
     .action(async (...) => { ... })
   ```

## Provider 命令

管理 Provider 定义（API 端点配置）:

```bash
cce provider add             # 添加新 Provider (交互式选择类型)
cce provider list             # 列出所有 Providers
cce provider show <name>       # 显示 Provider 详情
cce provider edit <name>       # 编辑 Provider
cce provider remove <name>      # 删除 Provider
```

## Provider 系统架构

本项目使用 **Provider-Profile** 架构，将 provider 配置（全局共享）与 profiles（用户特定选择）分离。

### 核心概念

- **Provider** (`src/core/provider.ts`): 定义服务的 API 端点、模型和凭据（例如 Volces, OpenAI, DeepSeek）。存储在 `~/.config/cce/providers/*.json`。
- **Profile** (`src/core/profile.ts`): 引用 Provider 并可选择覆盖模型。存储在 `~/.config/cce/profiles/*.json`。
- **EffectiveConfig** (`src/core/switch.ts`): 运行时合并配置（Provider 基础 + Profile 覆盖）。

### 配置流程

```
Profile (引用) → Provider (解析) → EffectiveConfig (生成) → 配置文件
```

当切换 profile 时（`cce use <profile>`）：
1. 加载 profile 并解析引用的 provider
2. 合并为 `EffectiveConfig`（baseURL, apiKey, model）
3. 同时生成 Claude Code 配置（`~/.claude/settings.json`）和 OpenCode 配置（`~/.config/opencode/opencode.json`）

### 文件位置

```
~/.config/cce/
├── providers/           # Provider 定义
│   ├── volcano.json
│   └── openai.json
├── profiles/            # 用户 profiles
│   ├── work.json
│   └── personal.json
└── active               # 当前激活的 profile 名称
```

## 类型系统

主要类型在 `src/types/index.ts` 中：
- `Provider`: API 端点配置，包含 name, displayName, type, baseURL, apiKey, models, defaultModel
- `Profile`: 引用 provider，可选的 model 覆盖
- `EffectiveConfig`: 合并的运行时配置
- `ClaudeSettings` / `ClaudeEnvConfig`: Claude Code settings.json 配置格式
- `OpencodeJson` / `OpencodeProvider`: OpenCode opencode.json 配置格式
- `ValidationError`: 验证错误
- `CliConfig`: CLI 路径配置

## Claude Code 自动化配置

### Hooks（`.claude/settings.json`）
- **PostToolUse**: Edit/Write 后自动运行 `tsc --noEmit` 检查类型错误（`.claude/hooks/ts-check.sh`）

### Skills（`.claude/skills/`）
- **cce-dev** (`/cce-dev`): 添加新命令的开发向导，包含模板和参考文件索引

### Subagents（`.claude/agents/`）
- **security-reviewer**: 安全审查（密钥泄露、路径遍历、输入验证、WebUI 安全）
- **test-writer**: 生成 Vitest 单元测试，按 P0/P1/P2 优先级覆盖核心模块

## 测试

- **当前状态**: 尚未配置测试框架，零测试覆盖
- **计划框架**: Vitest
- **测试目录**: `tests/`（待创建）
- **优先测试模块**: `validation.ts` > `switch.ts` > `profile.ts` > `provider.ts` > `configGenerator.ts`

## 安全说明

- Profiles 和 API 密钥存储在 `~/.config/cce/`
- 该目录不应提交到 git（见 `.gitignore`）
- 推荐权限：`chmod 700 ~/.config/cce`
