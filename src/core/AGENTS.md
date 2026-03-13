# core - 核心逻辑

**Parent**: cce/AGENTS.md
**Scope**: cce/src/core/

## 概述

核心业务逻辑：配置路径管理、Provider/Profile CRUD、配置切换与生成。

## 模块

| 文件 | 描述 |
|------|------|
| `config.ts` | 配置路径常量（CONFIG_DIR, PROFILES_DIR, PROVIDERS_DIR 等） |
| `provider.ts` | Provider CRUD、验证、引用检查 |
| `profile.ts` | Profile CRUD、验证、配置解析、激活管理 |
| `switch.ts` | Profile 切换逻辑，调用 configGenerator 生成配置 |
| `configGenerator.ts` | 生成 Claude Code 和 OpenCode 配置文件 |
| `webuiServer.ts` | WebUI Express 服务器 |

## 依赖关系

```
configGenerator.ts
       ↑
switch.ts ← profile.ts ← config.ts
                ↑
           provider.ts ← config.ts
```

## 关键概念

- **Provider**: API 端点配置（baseURL, apiKey, models），存储在 `~/.config/cce/providers/`
- **Profile**: 引用 Provider 并可选覆盖模型，存储在 `~/.config/cce/profiles/`
- **Active Profile**: 当前启用的配置（记录在 `~/.config/cce/active`）
- **EffectiveConfig**: Profile + Provider 合并后的运行时配置

## 安全

- 配置目录: `~/.config/cce/`（目录权限 `700`，文件权限 `600`）
- **不要提交** profile/provider 文件到 Git
