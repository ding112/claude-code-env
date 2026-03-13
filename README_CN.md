[English](README.md)

# claude-code-env (cce) - Claude 配置切换工具

一个 CLI 工具，用于通过 Provider-Profile 架构管理多个 Claude API 配置，同时配置 Claude Code 和 OpenCode。

## 功能特性

- 🚀 快速切换不同的 API 配置（同时配置 Claude Code 和 OpenCode）
- 🔒 安全地管理 API Key（文件权限 0o600/0o700）
- 🎯 交互式命令行界面
- 🌐 WebUI 管理界面
- 🧪 内置配置诊断工具

## 安装

```bash
npm install -g claude-code-env
```

## 快速开始

### 1. 初始化

```bash
cce init
```

### 2. 添加 Provider

```bash
# 添加火山引擎 Provider
cce provider add volcano
```

### 3. 创建 Profile

```bash
# 创建 Profile（交互式选择 Provider）
cce create work
```

### 4. 启用配置

```bash
cce use work
```

## 命令参考

### 核心命令

| 命令 | 说明 |
|------|------|
| `cce init` | 初始化配置目录 |
| `cce create <name>` | 创建新 profile（交互式选择 Provider） |
| `cce use [name]` | 启用指定 profile（不指定则交互式选择） |
| `cce list` | 列出所有 profile |
| `cce current` | 显示当前激活的 profile |
| `cce ui` | 启动 WebUI 管理界面 |

### Provider 命令

| 命令 | 说明 |
|------|------|
| `cce provider add <type>` | 添加新 Provider (volcano, bailian, deepseek, openai-compatible, claude-native, custom) |
| `cce provider list` | 列出所有 Providers |
| `cce provider show <name>` | 显示 Provider 详情 |
| `cce provider edit <name>` | 编辑 Provider |
| `cce provider remove <name>` | 删除 Provider |

### 管理命令

| 命令 | 说明 |
|------|------|
| `cce show <name>` | 显示指定 profile 详情 |
| `cce edit <name>` | 编辑 profile |
| `cce remove <name>` | 删除 profile |
| `cce doctor` | 检查配置是否正确 |

## 配置文件格式

### Provider 配置（`~/.config/cce/providers/`）

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

### Profile 配置（`~/.config/cce/profiles/`）

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

## 目录结构

```
~/.config/cce/
├── providers/          # Provider 配置
│   └── volcano-prod.json
├── profiles/           # Profile 配置
│   └── work.json
└── active              # 当前激活的 profile 名称
```

## 常见问题

### Q: `cce use` 会做什么？

A: 同时更新 Claude Code 配置 (`~/.claude/settings.json`) 和 OpenCode 配置 (`~/.config/opencode/opencode.json`)。

### Q: 如何查看当前激活的配置？

A: 运行 `cce current` 查看当前激活的配置。

### Q: 配置文件的权限是什么？

A: 配置目录权限为 `700`，配置文件权限为 `600`（仅所有者可读写）。

## License

MIT
