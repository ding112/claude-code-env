# types - 类型定义

**Parent**: cce/AGENTS.md
**Scope**: cce/src/types/

## 概述

项目类型定义，使用 Provider System 架构。

## 类型

| 类型 | 描述 |
|------|------|
| `ProviderType` | Provider 类型枚举：openai-compatible, claude-native, custom |
| `Provider` | Provider 配置：name, displayName, type, baseURL, apiKey, models, defaultModel |
| `Profile` | Profile 配置：name, provider (引用), model (可选覆盖) |
| `EffectiveConfig` | Profile + Provider 合并后的运行时配置 |
| `ClaudeEnvConfig` | Claude Code 环境变量配置 |
| `ClaudeSettings` | Claude Code settings.json 格式 |
| `OpencodeProvider` | OpenCode provider 配置 |
| `OpencodeJson` | OpenCode opencode.json 格式 |
| `ValidationError` | 验证错误 |
| `CliConfig` | CLI 路径配置 |
| `CreateOptions` | create 命令选项 |
| `SwitchOptions` | switch 命令选项 |

## 使用

```typescript
import type { Profile, Provider, EffectiveConfig } from './types/index.js';
```
