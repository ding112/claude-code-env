# Technology Stack

**Analysis Date:** 2026-05-01

## Languages

**Primary:**
- TypeScript 5.3+ - 全部业务逻辑，CLI 命令，核心模块，WebUI 后端 API

**Secondary:**
- JavaScript (ES2022) - WebUI 前端 (`webui/app.js`)，纯 vanilla JS 无框架
- Shell - Claude Code hooks (`.claude/hooks/ts-check.sh`)
- YAML - OpenSpec 配置 (`openspec/config.yaml`)

## Runtime

**Environment:**
- Node.js >=16.0.0 (当前开发环境: v24.14.0)
- 编译目标: ES2022 (`tsconfig.json` target)

**Package Manager:**
- npm 11.9.0
- Lockfile: `package-lock.json` (存在)

## Frameworks

**Core:**
- Commander 11.1.0 - CLI 命令框架，所有命令注册与参数解析 (`src/index.ts`)
- Express 5.2.1 - WebUI HTTP 服务器，提供 REST API 和静态文件服务 (`src/core/webuiServer.ts`)
- Inquirer 8.2.6 - 交互式 CLI 提示（选择 Provider、编辑 Profile 等）

**Testing:**
- Vitest 4.1.0 - 单元测试框架，配置 globals 模式 + node 环境 (`vitest.config.ts`)

**Build/Dev:**
- TypeScript 5.3+ - 编译器，输出 CommonJS 模块 (`tsconfig.json` module: commonjs)
- ts-node 10.9.2 - 开发模式直接运行 TypeScript (`npm run dev`)

## Key Dependencies

**Critical:**
- `commander` ^11.1.0 - CLI 框架，定义在 `src/index.ts` 中作为程序入口
- `express` ^5.2.1 - WebUI 服务器，所有 `/api/*` 路由在 `src/core/webuiServer.ts`
- `inquirer` ^8.2.6 - 交互式输入，用于 `src/commands/create.ts`、`src/commands/edit.ts`、`src/commands/provider.ts`
- `chalk` ^4.1.2 - 终端着色输出，通过 `src/utils/logger.ts` 统一使用
- `open` ^11.0.0 - 自动打开浏览器，WebUI 启动时调用 (`src/core/webuiServer.ts:549`)

**Infrastructure:**
- `@types/express` ^5.0.6 - Express 类型定义
- `@types/inquirer` ^8.2.10 - Inquirer 类型定义
- `@types/node` ^20.19.37 - Node.js 类型定义

**注意:** `@mengzai1/cce` ^1.0.1 出现在 dependencies 中，这是本包自身的 npm 名称，属于循环自引用，不应作为外部依赖使用。

## Configuration

**Environment:**
- 无环境变量配置机制 (无 .env 文件)
- 配置通过文件系统存储: `~/.config/cce/`
- 安全权限: 目录 0o700，文件 0o600

**Build:**
- `tsconfig.json` - TypeScript 编译配置 (strict mode, CommonJS, ES2022)
- `vitest.config.ts` - 测试配置 (globals: true, environment: node)
- `package.json` - 包元数据、脚本、依赖声明

**TypeScript 编译选项 (tsconfig.json):**
- `target`: ES2022
- `module`: commonjs
- `moduleResolution`: node
- `strict`: true
- `esModuleInterop`: true
- `resolveJsonModule`: true
- `declaration`: true (+ declarationMap, sourceMap)
- `outDir`: ./dist
- `rootDir`: ./src

## Platform Requirements

**Development:**
- Node.js >=16.0.0
- npm (随 Node.js 安装)
- 全局无额外工具要求

**Production:**
- 部署目标: npm registry (包名 `@mengzai1/cce`)
- 安装后通过 `npx cce` 或全局安装 `npm i -g @mengzai1/cce` 使用
- 跨平台支持: macOS, Linux (使用 `os.homedir()` 解析路径)
- 运行时配置目录: `~/.config/cce/`
- Claude Code 配置写入: `~/.claude/settings.json`
- OpenCode 配置写入: `~/.config/opencode/opencode.json`

---

*Stack analysis: 2026-05-01*
