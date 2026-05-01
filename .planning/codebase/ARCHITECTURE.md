<!-- refreshed: 2026-05-01 -->
# Architecture

**Analysis Date:** 2026-05-01

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                    CLI (Commander)                           │
│  `src/index.ts` — 命令注册与路由                              │
├──────────┬──────────┬──────────┬──────────┬─────────────────┤
│  init    │  create  │   use    │  list    │  show / edit /  │
│  doctor  │  remove  │ current  │ provider │  ui             │
│`commands/│`commands/│`commands/│`commands/│ `commands/       │
│ init.ts` │create.ts`│ use.ts`  │list.ts`  │ show.ts` etc.   │
└────┬─────┴────┬─────┴────┬────┴────┬─────┴──────┬──────────┘
     │          │          │         │            │
     ▼          ▼          ▼         ▼            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Core Business Logic                       │
├──────────┬──────────┬──────────┬──────────┬─────────────────┤
│ config   │ profile  │ provider │ switch   │ configGenerator │
│`core/    │`core/    │`core/    │`core/    │ `core/          │
│config.ts`│profile.ts`│provider.ts│switch.ts`│configGenerator  │
│          │          │          │          │ .ts`            │
└────┬─────┴────┬─────┴────┬─────┴──────────┴─────────────────┘
     │          │          │
     ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────┐
│                Utils & Types                                 │
├──────────┬──────────┬──────────┬────────────────────────────┤
│ file     │ logger   │validation│ types/index.ts             │
│`utils/   │`utils/   │`utils/   │                            │
│ file.ts` │logger.ts`│validation│                            │
│          │          │.ts`      │                            │
└────┬─────┴──────────┴──────────┴────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  File System (JSON Storage)                                  │
│  ~/.config/cce/providers/*.json  — Provider 定义             │
│  ~/.config/cce/profiles/*.json   — Profile 定义              │
│  ~/.config/cce/active            — 当前激活的 Profile 名称    │
└─────────────────────────────────────────────────────────────┘
     │
     ▼ (configGenerator 写出)
┌─────────────────────────────────────────────────────────────┐
│  外部工具配置文件                                              │
│  ~/.claude/settings.json         — Claude Code 配置          │
│  ~/.config/opencode/opencode.json — OpenCode 配置            │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| CLI Entry | 注册所有命令，解析命令行参数 | `src/index.ts` |
| init Command | 创建 `~/.config/cce` 目录结构 | `src/commands/init.ts` |
| create Command | 交互式创建 Profile（选择 Provider、模型） | `src/commands/create.ts` |
| use Command | 激活 Profile（直接指定或交互式选择） | `src/commands/use.ts` |
| list Command | 列出所有 Profile 及其状态 | `src/commands/list.ts` |
| show Command | 显示单个 Profile 详情 | `src/commands/show.ts` |
| edit Command | 交互式编辑 Profile（描述、模型） | `src/commands/edit.ts` |
| remove Command | 删除 Profile（确认后执行） | `src/commands/remove.ts` |
| current Command | 显示当前激活的 Profile 及配置 | `src/commands/current.ts` |
| doctor Command | 检查配置完整性和正确性 | `src/commands/doctor.ts` |
| provider Command | Provider CRUD 子命令组（add/list/show/edit/remove） | `src/commands/provider.ts` |
| ui Command | 启动 WebUI Express 服务器 | `src/commands/ui.ts` |
| config | 配置路径常量（CONFIG_DIR 等） | `src/core/config.ts` |
| profile | Profile CRUD、验证、active 管理 | `src/core/profile.ts` |
| provider | Provider CRUD、验证、类型迁移、使用追踪 | `src/core/provider.ts` |
| switch | Profile 切换逻辑（解析→合并→生成配置→激活） | `src/core/switch.ts` |
| configGenerator | 生成 Claude Code 和 OpenCode 配置文件 | `src/core/configGenerator.ts` |
| webuiServer | Express HTTP API，暴露 REST 端点给前端 | `src/core/webuiServer.ts` |
| file | 安全文件读写工具（权限 0o700/0o600） | `src/utils/file.ts` |
| logger | 彩色日志输出（chalk） | `src/utils/logger.ts` |
| validation | 名称验证，防路径遍历 | `src/utils/validation.ts` |
| types | 全部 TypeScript 类型定义 | `src/types/index.ts` |

## Pattern Overview

**Overall:** 分层 CLI 架构 (Command → Core → Storage)

**Key Characteristics:**
- 命令层 (`commands/`) 只做交互编排，不包含业务逻辑
- 核心层 (`core/`) 包含所有 CRUD、验证、配置生成逻辑
- 存储层为纯 JSON 文件系统，无数据库
- 文件权限强制安全模式（目录 0o700，文件 0o600）
- 所有名称输入经过路径遍历验证
- Profile 引用 Provider（弱关联，通过 name 字符串）

## Layers

**Command Layer (命令层):**
- Purpose: 接收用户输入、编排交互流程、格式化输出
- Location: `src/commands/`
- Contains: Commander action handlers、inquirer 交互、console 输出
- Depends on: `core/` 模块
- Used by: `src/index.ts` 注册调用

**Core Layer (核心层):**
- Purpose: 业务逻辑实现 — CRUD、验证、配置合并、配置生成
- Location: `src/core/`
- Contains: 纯逻辑函数（无 UI 依赖）
- Depends on: `utils/`、`types/`、Node.js `fs`
- Used by: `commands/` 层和 `webuiServer`

**Utility Layer (工具层):**
- Purpose: 通用工具函数 — 文件 I/O、日志、验证
- Location: `src/utils/`
- Contains: 无状态工具函数
- Depends on: Node.js `fs`、chalk
- Used by: 所有层

**WebUI Layer (WebUI 层):**
- Purpose: 提供 HTTP API 和静态前端页面
- Location: `src/core/webuiServer.ts`（API）+ `webui/`（前端）
- Contains: Express 路由处理器、REST API 端点
- Depends on: `core/` 模块
- Used by: `commands/ui.ts`

## Data Flow

### Primary Request Path (Profile 切换)

1. 用户执行 `cce use <name>` (`src/commands/use.ts:5`)
2. 命令调用 `switchProfile(name)` (`src/core/switch.ts:22`)
3. `switchProfile` 加载 Profile (`src/core/profile.ts:102` `getProfile`)
4. `switchProfile` 加载引用的 Provider (`src/core/provider.ts:136` `getProvider`)
5. `resolveConfig` 合并 Profile + Provider 为 EffectiveConfig (`src/core/switch.ts:94`)
6. `generateAllConfigs` 同时写入两个目标配置 (`src/core/configGenerator.ts:137`)
   - `generateClaudeConfig` → `~/.claude/settings.json` (`src/core/configGenerator.ts:33`)
   - `generateOpencodeConfig` → `~/.config/opencode/opencode.json` (`src/core/configGenerator.ts:87`)
7. `setActiveProfile` 写入 `~/.config/cce/active` (`src/core/profile.ts:232`)

### Provider 类型自动迁移

1. `listProviders()` 或 `getProvider()` 读取 Provider JSON (`src/core/provider.ts:102/136`)
2. `migrateProviderType()` 检查旧类型别名 (`src/core/provider.ts:40`)
3. 如果匹配旧别名（如 `claude-native` → `anthropic-compatible`），自动保存更新 (`src/core/provider.ts:46`)

### WebUI 数据流

1. 浏览器请求 `/api/profiles` 或 `/api/providers` (`src/core/webuiServer.ts:46/318`)
2. Express handler 调用 `core/` 层函数获取数据
3. Provider 数据经 `sanitizeProvider()` 过滤 apiKey 后返回 (`src/core/webuiServer.ts:15`)
4. 前端 `webui/app.js` 渲染表格，通过 `apiRequest()` 封装 fetch (`webui/app.js:81`)

**State Management:**
- 所有状态存储在文件系统（JSON 文件）
- 无内存缓存，每次操作直接读写文件
- 当前激活 Profile 存储在 `~/.config/cce/active` 纯文本文件
- 无锁机制，依赖文件系统原子写入

## Key Abstractions

**Provider:**
- Purpose: 定义 API 端点配置（baseURL、apiKey、模型列表）
- Examples: `src/core/provider.ts`, `src/types/index.ts` (`Provider` interface)
- Pattern: 文件系统 CRUD，每条记录一个 JSON 文件（`~/.config/cce/providers/<name>.json`）

**Profile:**
- Purpose: 用户配置，引用 Provider 并可选覆盖模型
- Examples: `src/core/profile.ts`, `src/types/index.ts` (`Profile` interface)
- Pattern: 文件系统 CRUD，弱引用 Provider（通过 `provider` 字符串字段）

**EffectiveConfig:**
- Purpose: Profile + Provider 合并后的运行时配置
- Examples: `src/types/index.ts` (`EffectiveConfig` interface), `src/core/switch.ts:94`
- Pattern: 纯数据对象，由 `resolveConfig()` 生成，不持久化

**CliConfig:**
- Purpose: 路径常量集合（configDir、profilesDir、providersDir、activeFile）
- Examples: `src/core/config.ts`, `src/types/index.ts` (`CliConfig` interface)
- Pattern: 单例 `getConfig()` 返回硬编码路径

## Entry Points

**CLI Entry:**
- Location: `src/index.ts`
- Triggers: `cce` 命令行调用（`package.json` bin: `"cce": "dist/index.js"`）
- Responsibilities: 注册所有 Commander 命令、解析参数、路由到对应 command handler

**WebUI Entry:**
- Location: `src/core/webuiServer.ts`
- Triggers: `cce ui` 命令（`src/commands/ui.ts`）
- Responsibilities: 启动 Express 服务器、注册 REST API 路由、提供静态前端文件

## Architectural Constraints

- **Threading:** 单线程 Node.js 事件循环。WebUI 服务器使用 Promise 保持 pending 防止进程退出（`src/core/webuiServer.ts:543`）
- **Global state:** `src/core/config.ts` 导出模块级常量 `CONFIG_DIR`、`PROFILES_DIR`、`PROVIDERS_DIR`、`ACTIVE_FILE`
- **Circular imports:** `profile.ts` 使用动态 `await import('./provider.js')` 避免与 `provider.ts` 的循环依赖（`src/core/profile.ts:70/136`）；`switch.ts` 静态导入 `profile.ts` 和 `provider.ts`，无循环
- **File-based storage:** 无数据库，所有数据为 JSON 文件。无事务或锁机制
- **Security model:** 所有配置文件权限 0o600，目录权限 0o700。WebUI 仅绑定 127.0.0.1。Provider API 在 WebUI 响应中过滤 apiKey（`sanitizeProvider()`）
- **No caching:** 每次操作直接读写文件系统，无内存缓存层

## Anti-Patterns

### 重复的 resolveConfig 函数

**What happens:** `resolveConfig()` 在 `src/core/switch.ts:94` 和 `src/core/profile.ts:199` 中各有一份完全相同的实现
**Why it's wrong:** 修改一处时可能忘记另一处，导致合并逻辑不一致
**Do this instead:** 只保留 `profile.ts` 中的实现，`switch.ts` 中改为 `import { resolveConfig } from './profile.js'`

### 重复的 maskApiKey 函数

**What happens:** `maskApiKey()` 在 `src/commands/show.ts:6` 和 `src/commands/provider.ts:27` 中各有一份完全相同的实现
**Why it's wrong:** 同上，修改时可能遗漏
**Do this instead:** 抽取到 `src/utils/` 下统一导出，两处改为导入

### 重复的安全权限常量

**What happens:** `SECURE_DIR_MODE` (0o700) 和 `SECURE_FILE_MODE` (0o600) 在 `src/utils/file.ts:4-7`、`src/core/profile.ts:12-15`、`src/core/provider.ts:12-15`、`src/core/configGenerator.ts:10-13`、`src/commands/provider.ts:20` 中重复定义
**Why it's wrong:** 如果需要调整权限，需要修改 5 个文件
**Do this instead:** 只在 `src/utils/file.ts` 中定义并导出，其他模块统一导入

### 动态导入规避循环依赖

**What happens:** `profile.ts` 中使用 `await import('./provider.js')` 动态导入来避免循环依赖（`src/core/profile.ts:70/136`）
**Why it's wrong:** 每次调用 `listProfiles()` 和 `saveProfile()` 都触发动态导入，增加运行时开销；且表明模块间职责划分不够清晰
**Do this instead:** 将 Provider 名称列表的验证逻辑解耦为独立函数或参数传入，避免 `profile.ts` 直接依赖 `provider.ts`

## Error Handling

**Strategy:** try-catch + logger + process.exit(1)

**Patterns:**
- 命令层：每个 action handler 用 try-catch 包裹，catch 中调用 `logger.error()` + `process.exit(1)`（见 `src/index.ts` 各 action）
- 核心层：CRUD 函数在异常时 `logger.error()` 后 throw（见 `src/core/profile.ts:163/185`）
- 文件不存在（ENOENT）在核心层优雅处理为返回 `null` 而非抛异常（见 `src/core/profile.ts:126/129`）
- WebUI API 层：catch 中返回 HTTP 错误响应（见 `src/core/webuiServer.ts` 各路由）
- configGenerator：`generateAllConfigs()` 对两个目标分别 try-catch，部分失败不阻断（`src/core/configGenerator.ts:146-158`）

## Cross-Cutting Concerns

**Logging:** 使用 `src/utils/logger.ts` 导出的 `logger` 对象，提供 info/success/error/warn/dim 五级日志，基于 chalk 彩色输出

**Validation:** 名称验证统一使用 `src/utils/validation.ts` 的 `validateName()`，防止路径遍历（`..`、`/`、`\`）。Provider/Profile 结构验证在各自核心模块中实现（`validateProvider()`、`validateProfile()`）

**Authentication:** 无用户认证系统。CLI 工具基于本地文件系统权限。WebUI 绑定 127.0.0.1 限制局域网访问，无 API 认证

**File Permissions:** 敏感文件统一 0o600，配置目录统一 0o700。由 `ensureSecureDir()` 和 `writeSecureFile()` 在 `src/utils/file.ts` 中实现

---

*Architecture analysis: 2026-05-01*
