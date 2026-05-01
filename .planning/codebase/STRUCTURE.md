# Codebase Structure

**Analysis Date:** 2026-05-01

## Directory Layout

```
cce/
├── src/                    # TypeScript 源代码
│   ├── index.ts            # CLI 入口点 (Commander 命令注册)
│   ├── commands/           # 命令处理器 (每个命令一个文件)
│   ├── core/               # 核心业务逻辑 (CRUD、配置生成)
│   ├── utils/              # 工具函数 (文件I/O、日志、验证)
│   └── types/              # TypeScript 类型定义
├── webui/                  # WebUI 前端静态文件 (无构建步骤)
├── tests/                  # 测试文件
├── dist/                   # 编译输出 (gitignore, npm publish 包含)
├── docs/                   # 文档 (设计文档、实现计划)
├── openspec/               # OpenSpec 变更管理 (提案、设计、任务)
├── .claude/                # Claude Code 配置 (hooks, skills, agents)
├── .github/workflows/      # CI/CD (ci.yml, publish.yml)
├── .planning/codebase/     # GSD 代码库分析文档
├── package.json            # NPM 包配置
├── tsconfig.json           # TypeScript 编译配置
├── vitest.config.ts        # Vitest 测试配置
├── CLAUDE.md               # Claude Code 项目指引
├── AGENTS.md               # Claude Code 代理配置
└── README.md / README_CN.md # 项目说明
```

## Directory Purposes

**`src/commands/`:**
- Purpose: CLI 命令处理器，每个命令一个文件
- Contains: 导出 `async function <name>Command(...)` 的 TypeScript 模块
- Key files: `init.ts`, `create.ts`, `use.ts`, `provider.ts`, `ui.ts`

**`src/core/`:**
- Purpose: 核心业务逻辑，无 UI 依赖
- Contains: CRUD 操作、验证函数、配置生成器、WebUI 服务器
- Key files: `profile.ts`, `provider.ts`, `switch.ts`, `configGenerator.ts`, `webuiServer.ts`

**`src/utils/`:**
- Purpose: 通用工具函数
- Contains: 文件 I/O 工具、日志、名称验证
- Key files: `file.ts`, `logger.ts`, `validation.ts`

**`src/types/`:**
- Purpose: TypeScript 类型定义
- Contains: 所有接口和类型别名（Provider, Profile, EffectiveConfig 等）
- Key files: `index.ts`

**`webui/`:**
- Purpose: WebUI 前端，纯静态文件无构建步骤
- Contains: HTML、CSS、原生 JavaScript
- Key files: `index.html`, `styles.css`, `app.js`

**`tests/`:**
- Purpose: 测试文件
- Contains: Vitest 测试用例
- Key files: `validation.test.ts`（当前仅此一个）

**`docs/`:**
- Purpose: 项目文档和设计记录
- Contains: 实现计划、设计文档
- Key files: `plans/` 目录下的 Markdown 文件

**`openspec/`:**
- Purpose: OpenSpec 变更管理系统
- Contains: 变更提案（proposal）、设计文档（design）、任务列表（tasks）、规格说明（specs）
- Key files: `changes/provider-system/`, `specs/standard-npm-structure/`

**`.claude/`:**
- Purpose: Claude Code 集成配置
- Contains: hooks（ts-check.sh）、skills（cce-dev）、agents（security-reviewer、test-writer）
- Key files: `hooks/ts-check.sh`, `skills/cce-dev/SKILL.md`

## Key File Locations

**Entry Points:**
- `src/index.ts`: CLI 入口点，注册所有 Commander 命令
- `src/core/webuiServer.ts`: WebUI HTTP 服务器入口

**Configuration:**
- `package.json`: NPM 包配置、依赖、脚本
- `tsconfig.json`: TypeScript 编译配置（target ES2022, commonjs, strict）
- `vitest.config.ts`: Vitest 测试框架配置
- `src/core/config.ts`: 运行时配置路径常量

**Core Logic:**
- `src/core/profile.ts`: Profile CRUD、验证、active 管理
- `src/core/provider.ts`: Provider CRUD、验证、类型迁移、使用追踪
- `src/core/switch.ts`: Profile 切换逻辑（resolveConfig + generateAllConfigs）
- `src/core/configGenerator.ts`: Claude Code 和 OpenCode 配置文件生成

**Testing:**
- `tests/validation.test.ts`: 名称验证单元测试
- `vitest.config.ts`: 测试框架配置

**WebUI:**
- `webui/index.html`: 前端页面
- `webui/styles.css`: 样式表
- `webui/app.js`: 前端 JavaScript（API 调用、DOM 操作）

## Naming Conventions

**Files:**
- 命令文件: 小写单词或 camelCase，如 `init.ts`, `create.ts`, `provider.ts`
- 核心模块: 小写单词，如 `profile.ts`, `provider.ts`, `switch.ts`
- 工具模块: 小写单词，如 `file.ts`, `logger.ts`, `validation.ts`
- 类型定义: `index.ts`（barrel file）
- 测试文件: `<module>.test.ts`，如 `validation.test.ts`
- AGENTS.md: `src/commands/AGENTS.md`, `src/core/AGENTS.md`, `src/utils/AGENTS.md`, `src/types/AGENTS.md`

**Directories:**
- `src/commands/`: 命令处理器
- `src/core/`: 核心逻辑
- `src/utils/`: 工具函数
- `src/types/`: 类型定义
- `webui/`: 前端静态文件
- `tests/`: 测试文件
- `docs/plans/`: 设计文档
- `openspec/changes/`: 变更管理

**Exported Functions:**
- 命令处理器: `<name>Command`，如 `createCommand`, `useCommand`, `providerAddCommand`
- CRUD 操作: `list<Name>s`, `get<Name>`, `save<Name>`, `delete<Name>`, `<name>Exists`
- 验证函数: `validate<Name>`, `validateName`, `validateNameOrThrow`
- 工具函数: `ensureSecureDir`, `writeSecureFile`, `readJson`, `writeJson`

## Where to Add New Code

**New CLI Command:**
1. 创建 `src/commands/<command>.ts`，导出 `async function <command>Command(...): Promise<void>`
2. 在 `src/index.ts` 中 import 并注册到 `program`
3. 模板参考 `.claude/skills/cce-dev/SKILL.md`

**New Core Module:**
- 实现文件: `src/core/<module>.ts`
- 遵循现有模式：目录初始化 → 验证函数 → CRUD 操作
- 如需新路径常量，在 `src/core/config.ts` 中添加

**New Type:**
- 在 `src/types/index.ts` 中添加 interface 或 type

**New Utility:**
- 在 `src/utils/<util>.ts` 中创建
- 如涉及文件 I/O，使用 `src/utils/file.ts` 中的安全函数

**New WebUI API Endpoint:**
- 在 `src/core/webuiServer.ts` 的 `startWebUI()` 函数中添加路由
- 遵循现有模式：try-catch → 调用 core 函数 → res.json() 返回

**New WebUI Frontend Feature:**
- 在 `webui/app.js` 中添加 API 调用和 DOM 操作
- 在 `webui/index.html` 中添加 HTML 结构
- 在 `webui/styles.css` 中添加样式

**New Test:**
- 在 `tests/` 目录下创建 `<module>.test.ts`
- 使用 Vitest 的 `describe/it/expect` 模式
- 参考 `tests/validation.test.ts`

## Special Directories

**`dist/`:**
- Purpose: TypeScript 编译输出
- Generated: Yes (`npm run build` / `tsc`)
- Committed: No (在 `.gitignore` 中)
- Published: Yes (`package.json` files 数组包含 `"dist"`)

**`webui/`:**
- Purpose: WebUI 前端静态文件
- Generated: No
- Committed: Yes
- Published: Yes (`package.json` files 数组包含 `"webui"`)
- Note: 无构建步骤，Express 直接 serve 静态文件

**`openspec/`:**
- Purpose: OpenSpec 变更管理系统
- Generated: No
- Committed: Yes
- Published: No (仅开发使用)

**`.claude/`:**
- Purpose: Claude Code 集成（hooks, skills, agents）
- Generated: No
- Committed: Yes
- Published: No

---

*Structure analysis: 2026-05-01*
