[English](README.md)

# claude-code-env (cce)

一个 CLI 工具，通过 Provider-Profile 架构管理多个 Claude API 配置，同时配置 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 和 [OpenCode](https://github.com/opencode-ai/opencode)。

## 功能特性

- Provider-Profile 架构：将 API 端点定义与用户配置分离
- 切换 Profile 时同时更新 Claude Code 和 OpenCode 配置
- 安全的 API Key 管理，严格的文件权限 (0o600/0o700)
- 基于 [Inquirer.js](https://github.com/SBoudrias/Inquirer.js) 的交互式命令行
- WebUI 管理界面
- 内置配置诊断工具 (`cce doctor`)

## 安装

```bash
npm install -g @mengzai1/cce
```

需要 Node.js >= 16.0.0。

## 快速开始

```bash
# 1. 初始化配置目录 (~/.config/cce)
cce init

# 2. 添加 Provider（如火山引擎）
cce provider add volcano

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
| `cce provider add <type>` | 添加新 Provider |
| `cce provider list` | 列出所有 Provider |
| `cce provider show <name>` | 显示 Provider 详情 |
| `cce provider edit <name>` | 编辑 Provider |
| `cce provider remove <name>` | 删除 Provider |

支持的 Provider 类型：`openai-compatible`、`anthropic-compatible`、`custom`

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
Profile (引用) -> Provider (解析) -> EffectiveConfig (生成) -> 配置文件
```

执行 `cce use <profile>` 时：

1. 加载 Profile 并解析引用的 Provider
2. 合并为 `EffectiveConfig`（baseURL、apiKey、model）
3. 写入 Claude Code 配置 (`~/.claude/settings.json`) 和 OpenCode 配置 (`~/.config/opencode/opencode.json`)

## 配置说明

### 目录结构

```
~/.config/cce/
├── providers/          # Provider 定义
│   └── volcano-prod.json
├── profiles/           # 用户 Profile
│   └── work.json
└── active              # 当前激活的 Profile 名称
```

### Provider 示例

```json
{
  "name": "volcano-prod",
  "displayName": "火山引擎生产环境",
  "type": "openai-compatible",
  "baseURL": "https://ark.cn-beijing.volces.com/api/v3",
  "apiKey": "your-api-key",
  "models": ["ep-20250101-xxxx", "ep-20250201-yyyy"],
  "defaultModel": "ep-20250201-yyyy"
}
```

### Profile 示例

```json
{
  "name": "work",
  "description": "工作环境",
  "provider": "volcano-prod",
  "model": "ep-20250101-xxxx",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## 常见问题

**Q: `cce use` 具体修改了什么？**
A: 写入 `~/.claude/settings.json`（Claude Code）和 `~/.config/opencode/opencode.json`（OpenCode）。

**Q: API Key 如何保护？**
A: `~/.config/cce` 目录权限为 `700`，配置文件权限为 `600`（仅所有者可读写）。

**Q: Profile 可以覆盖 Provider 的模型吗？**
A: 可以。Profile 中指定 `model` 字段即可覆盖 Provider 的 `defaultModel`。

## License

MIT
