# External Integrations

**Analysis Date:** 2026-05-01

## APIs & External Services

**Claude Code (Anthropic):**
- 用途: cce 的核心目标 —— 管理 Claude Code 的 API 配置
- SDK/Client: 无直接 SDK 调用；通过写入配置文件 `~/.claude/settings.json` 间接集成
- 配置格式: `ClaudeSettings` 类型，包含 `env.ANTHROPIC_BASE_URL`、`env.ANTHROPIC_AUTH_TOKEN`、`env.ANTHROPIC_MODEL`
- 实现文件: `src/core/configGenerator.ts` (`generateClaudeConfig()`)

**OpenCode:**
- 用途: 同时管理 OpenCode 工具的 API 配置
- SDK/Client: 无直接 SDK 调用；通过写入配置文件 `~/.config/opencode/opencode.json` 间接集成
- 配置格式: `OpencodeJson` 类型，provider 使用 `@ai-sdk/openai-compatible` npm 包
- 实现文件: `src/core/configGenerator.ts` (`generateOpencodeConfig()`)

**Provider API 端点 (用户自定义):**
- 用途: 用户配置的第三方 API 端点（OpenAI 兼容、Anthropic 兼容、自定义）
- SDK/Client: cce 不直接调用这些 API，只存储和分发配置
- 认证: API Key 存储在 `~/.config/cce/providers/*.json` 中
- Provider 类型: `openai-compatible` | `anthropic-compatible` | `custom` (定义在 `src/types/index.ts`)
- 实现文件: `src/core/provider.ts`

## Data Storage

**Databases:**
- 无数据库 —— 全部使用 JSON 文件存储

**File Storage:**
- 本地文件系统 (`~/.config/cce/`)
  - `providers/*.json` - Provider 定义 (API 端点、密钥、模型列表)
  - `profiles/*.json` - Profile 配置 (引用 Provider，可选模型覆盖)
  - `active` - 当前激活的 Profile 名称 (纯文本)
- Claude Code 配置: `~/.claude/settings.json`
- OpenCode 配置: `~/.config/opencode/opencode.json`
- 读写工具: `src/utils/file.ts` (安全读写，权限 0o700/0o600)

**Caching:**
- None

## Authentication & Identity

**Auth Provider:**
- 无独立认证系统
- API Key 管理: Provider 中的 `apiKey` 字段，存储在 `~/.config/cce/providers/*.json`
- WebUI 安全: 绑定到 `127.0.0.1`，仅本地访问 (`src/core/webuiServer.ts:545`)
- WebUI 无认证中间件 —— 依赖 localhost 绑定保证安全

## Monitoring & Observability

**Error Tracking:**
- None

**Logs:**
- 控制台输出 via `src/utils/logger.ts` (使用 chalk 着色)
- 日志级别: info, success, error, warn, dim
- 无持久化日志，无日志文件

## CI/CD & Deployment

**Hosting:**
- npm registry (包名: `@mengzai1/cce`)
- 本地 CLI 工具，无需服务器部署

**CI Pipeline:**
- None (项目无 CI 配置文件，无 `.github/workflows/` 等)
- 发布流程: `npm run build` -> `npm publish` (prepublishOnly 脚本自动构建)

## Environment Configuration

**Required env vars:**
- 无环境变量要求
- 所有配置通过 CLI 交互或文件系统管理

**Secrets location:**
- `~/.config/cce/providers/*.json` - 存储 API Key (文件权限 0o600)
- `~/.claude/settings.json` - Claude Code 运行时读取的 API Key (文件权限 0o600)
- `~/.config/opencode/opencode.json` - OpenCode 运行时读取的 API Key (文件权限 0o600)
- 无 .env 文件

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## 配置生成集成详情

cce 的核心集成模式是 **配置文件生成**，而非 API 调用：

1. **Provider-Profile 合并**: `src/core/switch.ts` 的 `resolveConfig()` 将 Profile 的模型覆盖与 Provider 的基础配置合并为 `EffectiveConfig`
2. **Claude Code 写入**: `src/core/configGenerator.ts` 的 `generateClaudeConfig()` 将 EffectiveConfig 写入 `~/.claude/settings.json`，保留用户已有的其他设置字段
3. **OpenCode 写入**: `src/core/configGenerator.ts` 的 `generateOpencodeConfig()` 将 EffectiveConfig 写入 `~/.config/opencode/opencode.json`，按 provider name 添加 provider 配置
4. **WebUI API**: `src/core/webuiServer.ts` 提供 REST API (`/api/profiles/*`, `/api/providers/*`, `/api/current`, `/api/use`)，前端 `webui/app.js` 通过 fetch 调用

---

*Integration audit: 2026-05-01*
