[English](README_EN.md)

# claude-code-env (cce)

一个 CLI 工具，通过 Provider-Profile 架构管理多个 Claude API 配置，配置 [Claude Code](https://docs.anthropic.com/en/docs/claude-code)。

## 功能特性

- Provider-Profile 架构：将 API 端点定义与用户配置分离
- **Source 模板系统**：内置 DeepSeek、Volcengine、Tencent、Alibaba、OpenAI、Anthropic 模板，自动填充默认值
- 切换 Profile 时更新 Claude Code 配置
- 安全的 API Key 管理，严格的文件权限 (0o600/0o700)
- 基于 [Inquirer.js](https://github.com/SBoudrias/Inquirer.js) 的交互式命令行
- WebUI 管理界面，支持动态 Source 模板选择
- 内置配置诊断工具 (`cce doctor`)
- Profile 级 Claude Code 高级设置（模型覆盖、effort level）

## 安装

```bash
npm install -g @mengzai1/cce
```

需要 Node.js >= 16.0.0。

## 快速开始

```bash
# 1. 初始化配置目录 (~/.config/cce)
cce init

# 2. 添加 Provider（选择 Source 后将自动填充默认值）
cce provider add

# 3. 创建 Profile，引用 Provider
cce create work

# 4. 激活 Profile
cce use work
```

## 命令参考

### Profile 管理

| 命令 | 别名 | 说明 |
|------|------|------|
| `cce init` | | 初始化配置目录 |
| `cce create <name>` | | 创建新 Profile（交互式选择 Provider） |
| `cce use [name]` | | 激活 Profile（不指定则交互式选择） |
| `cce list` | `ls` | 列出所有 Profile |
| `cce current` | `c` | 显示当前激活的 Profile |
| `cce show <name>` | | 显示 Profile 详情 |
| `cce edit <name>` | | 编辑 Profile |
| `cce remove <name>` | `rm` | 删除 Profile |

### Provider 管理

| 命令 | 说明 |
|------|------|
| `cce provider add` | 添加新 Provider（先选择 Source 模板，自动填充默认值） |
| `cce provider list` | 列出所有 Provider |
| `cce provider show <name>` | 显示 Provider 详情 |
| `cce provider edit <name>` | 编辑 Provider |
| `cce provider remove <name>` | 删除 Provider |

支持的 Provider 类型：`openai-compatible`、`anthropic-compatible`、`custom`

支持的 Source（模板）：`deepseek`、`volcengine`、`tencent`、`alibaba`、`openai`、`anthropic`、`custom`

### 其他命令

| 命令 | 说明 |
|------|------|
| `cce doctor` | 检查配置是否正确 |
| `cce ui` | 启动 WebUI 管理界面 |

`cce ui` 选项：
- `-p, --port <port>` — 指定端口
- `--no-open` — 不自动打开浏览器

## 工作原理

```
Source 模板 (内置 JSON) -> Provider (解析) -> Profile (引用) -> EffectiveConfig (生成) -> 配置文件
```

执行 `cce provider add` 时，首先选择一个 **Source**——内置模板会自动填充 baseURL、可用模型和默认模型，然后可根据需要自定义。

执行 `cce use <profile>` 时：

1. 加载 Profile 并解析引用的 Provider
2. 合并为 `EffectiveConfig`（baseURL、apiKey、model）
3. 写入 Claude Code 配置 (`~/.claude/settings.json`)

## 配置说明

### 目录结构

```
~/.config/cce/
├── providers/          # Provider 定义
│   └── volcano-prod.json
├── profiles/           # 用户 Profile
│   └── work.json
├── sources.json        # （可选）用户 Source 模板覆盖
└── active              # 当前激活的 Profile 名称
```

### Provider 示例

```json
{
  "name": "volcano-prod",
  "displayName": "火山引擎生产环境",
  "type": "openai-compatible",
  "source": "volcengine",
  "baseURL": "https://ark.cn-beijing.volces.com/api/v3",
  "apiKey": "your-api-key",
  "models": ["ep-20250101-xxxx", "ep-20250201-yyyy"],
  "defaultModel": "ep-20250201-yyyy"
}
```

### Source 模板示例

内置 Source 模板定义在 `src/core/sources.json`。可通过创建 `~/.config/cce/sources.json` 覆盖：

```json
{
  "deepseek": {
    "source": "deepseek",
    "displayName": "DeepSeek",
    "type": "anthropic-compatible",
    "baseURL": "https://api.deepseek.com/anthropic",
    "models": ["deepseek-v4-flash", "deepseek-v4-pro"],
    "defaultModel": "deepseek-v4-flash",
    "description": "DeepSeek API — 兼容 anthropic 接口协议"
  }
}
```

### Profile 示例

```json
{
  "name": "work",
  "description": "工作环境",
  "provider": "volcano-prod",
  "model": "ep-20250101-xxxx",
  "claudeCodeSettings": {
    "defaultSonnetModel": "claude-sonnet-4-20250514",
    "defaultHaikuModel": "claude-haiku-4-20250514",
    "effortLevel": "high"
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

Profile 级的 `claudeCodeSettings`（可选）允许按 Profile 覆盖 Claude Code 模型设置：
- `defaultOpusModel`、`defaultSonnetModel`、`defaultHaikuModel` — 按层覆盖默认模型
- `subagentModel` — 子代理模型覆盖
- `effortLevel` — `low`、`medium`、`high` 或 `max`

## 常见问题

**Q: `cce use` 具体修改了什么？**
A: 写入 `~/.claude/settings.json`（Claude Code）。

**Q: API Key 如何保护？**
A: `~/.config/cce` 目录权限为 `700`，配置文件权限为 `600`（仅所有者可读写）。

**Q: Profile 可以覆盖 Provider 的模型吗？**
A: 可以。Profile 中指定 `model` 字段即可覆盖 Provider 的 `defaultModel`。

**Q: 什么是 Source 模板？**
A: 添加 Provider 时，Source 模板提供预填充的默认值（baseURL、模型列表、默认模型）。内置 Source 包括 DeepSeek、Volcengine、Tencent、Alibaba、OpenAI 和 Anthropic。

**Q: 可以自定义内置 Source 模板吗？**
A: 可以。创建 `~/.config/cce/sources.json` 写入覆盖内容即可生效，格式与 `src/core/sources.json` 相同，优先级高于内置模板。

**Q: Provider 上的 `source` 字段有什么用？**
A: 记录创建此 Provider 时使用的模板标识，作为配置来源标记，不影响运行时行为。

## License

MIT
