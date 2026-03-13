# Opencode 模型切换功能设计文档

## 1. 概述

本文档设计一套与 `cce`（Claude Code 配置切换工具）架构保持一致的 opencode 模型切换方案，实现以下目标：

1. **统一配置管理**：复用 cce 的 profile 管理模式
2. **同时维护 Claude Code 和 Opencode 配置**：支持双工具配置切换
3. **环境变量与文件配置桥接**：将 opencode.json 配置纳入 profile 管理体系
4. **向后兼容**：不影响现有 cce 功能

## 2. 当前架构分析

### 2.1 cce 架构

```
~/.config/cce/
├── profiles/              # Profile 配置目录
│   ├── volces.json       # 火山引擎配置
│   └── default.json      # 默认配置
├── active                # 当前激活的 profile 名称
└── env.sh                # 生成的环境变量脚本
```

**核心流程：**
1. `cce create <name>` → 创建 profile JSON
2. `cce use <name>` → 生成 `env.sh`，写入 `active` 文件
3. Shell 集成 → `source ~/.config/cce/env.sh`

**Profile 结构：**
```json
{
  "name": "volces",
  "description": "火山引擎 ARK",
  "env": {
    "ANTHROPIC_BASE_URL": "https://ark.cn-beijing.volces.com/api/coding",
    "ANTHROPIC_AUTH_TOKEN": "xxx",
    "ANTHROPIC_MODEL": "ep-xxx"
  }
}
```

### 2.2 Opencode 当前配置

```json
// ~/.config/opencode/opencode.json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "myprovider": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "volcengine",
      "options": {
        "baseURL": "https://ark.cn-beijing.volces.com/api/coding/v3",
        "apiKey": "xxx"
      },
      "models": {
        "ark-code-latest": {
          "name": "ark-code-latest",
          "options": { "thinking": { "type": "enabled" } }
        }
      }
    }
  },
  "defaultModel": "myprovider/ark-code-latest"
}
```

## 3. 设计方案

### 3.1 方案选型：扩展 cce 支持 Opencode

**推荐方案**：在 cce 基础上扩展，使其同时支持 Claude Code 和 Opencode 配置管理。

**原因：**
1. 复用成熟架构，降低开发成本
2. 用户学习成本低（相同命令范式）
3. 统一管理双工具配置，避免分散
4. 向后兼容，不影响现有 cce 用户

### 3.2 扩展后的 Profile 结构

```typescript
interface Profile {
  // Profile 版本号，用于迭代区分和版本管理
  // 当前版本: "1"
  version: string;
  
  name: string;
  description?: string;
  
  // 配置类型：claude | opencode | both
  type: 'claude' | 'opencode' | 'both';
  
  // Claude Code 配置（type !== 'opencode' 时必填）
  claudeConfig?: {
    model: string;
    baseURL?: string;
    apiKey?: string;
  };
  
  // Opencode 配置（type !== 'claude' 时必填）
  opencodeConfig?: {
    provider: string;
    model: string;
    baseURL?: string;
    apiKey?: string;
    options?: object;  // 模型特定选项（如 thinking）
  };
  
  // 向后兼容：环境变量（claude 传统配置方式）
  env?: Record<string, string>;
  
  createdAt: string;
  updatedAt: string;
}
```

**版本管理说明：**

| 版本 | 说明 | 变更内容 |
|------|------|----------|
| "1" | 初始版本 | 支持 claude / opencode / both 三种类型，支持双工具配置 |

**版本升级策略：**
1. **向后兼容**：新版本代码必须能读取旧版本 profile（无 version 字段时默认为 "1"）
2. **自动迁移**：读取旧版本时自动添加 version 字段并保存
3. **版本检查**：操作 profile 时检查 version，如不兼容则提示升级

**代码示例：**
```typescript
// 读取 profile 时自动处理版本
export async function getProfile(name: string): Promise<Profile | null> {
  const profilePath = await getProfilePath(name);
  const data = await readJson<Profile>(profilePath);
  
  if (!data) return null;
  
  // 版本迁移：无 version 字段时默认为 "1"
  if (!data.version) {
    data.version = "1";
    // 可选：自动保存更新后的版本
    await saveProfile(data);
  }
  
  return data;
}
```

### 3.3 Profile 示例

**纯 Claude Code 配置：**
```json
{
  "name": "claude-volces",
  "description": "Claude via 火山引擎",
  "type": "claude",
  "claudeConfig": {
    "model": "ep-xxx",
    "baseURL": "https://ark.cn-beijing.volces.com/api/coding",
    "apiKey": "xxx"
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**纯 Opencode 配置：**
```json
{
  "name": "opencode-ark",
  "description": "Opencode with Ark Code Latest",
  "type": "opencode",
  "opencodeConfig": {
    "provider": "myprovider",
    "model": "ark-code-latest",
    "baseURL": "https://ark.cn-beijing.volces.com/api/coding/v3",
    "apiKey": "xxx",
    "options": {
      "thinking": { "type": "enabled" }
    }
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**双工具配置（Claude + Opencode）：**
```json
{
  "name": "volces-dual",
  "description": "火山引擎 - Claude Code + Opencode 双配置",
  "type": "both",
  "claudeConfig": {
    "model": "ep-claude-xxx",
    "baseURL": "https://ark.cn-beijing.volces.com/api/coding",
    "apiKey": "claude-api-key"
  },
  "opencodeConfig": {
    "provider": "volces",
    "model": "ark-code-latest",
    "baseURL": "https://ark.cn-beijing.volces.com/api/coding/v3",
    "apiKey": "opencode-api-key",
    "options": { "thinking": { "type": "enabled" } }
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 3.4 配置存储位置

扩展 cce 的目录结构：

```
~/.config/cce/                          # 保持原有结构
├── profiles/                          # Profile 配置
│   ├── claude-volces.json            # 纯 Claude 配置
│   ├── opencode-ark.json             # 纯 Opencode 配置
│   ├── volces-dual.json              # 双工具配置
│   └── default.json
├── active                              # 当前激活的 profile 名
├── env.sh                              # Claude Code 环境变量
└── opencode-fragments/                 # 【新增】opencode 配置片段
    ├── myprovider.json                 # provider 配置片段
    └── active-model                    # 当前激活的模型标识
```

### 3.5 `cce use` 命令扩展

当 `cce use <profile>` 时，根据 profile 类型执行不同操作：

**type === 'claude' 或 'both'：**
1. 生成 `env.sh`（保持原有逻辑）
2. 设置 `ANTHROPIC_MODEL` 等环境变量

**type === 'opencode' 或 'both'：**
1. 更新 `~/.config/opencode/opencode.json`
2. 更新 provider 配置
3. 设置 `defaultModel`

**type === 'both'：**
- 同时执行以上两种操作

### 3.6 命令行界面

```bash
# 创建 profile（交互式）
cce create myprofile
# 提示选择类型：claude / opencode / both

# 使用 profile
cce use myprofile

# 列出所有 profiles（显示类型）
cce list
# 输出：
# NAME           TYPE      DESCRIPTION
# claude-volces  claude    Claude via 火山引擎
# opencode-ark   opencode  Opencode with Ark
# volces-dual    both      双工具配置

# 显示当前激活的 profile
cce current

# 其他命令保持不变
cce show <name>
cce edit <name>
cce remove <name>
cce export/import <name>
cce doctor
```

## 4. 实现建议

### 4.1 文件结构建议

```
cce/src/
├── commands/
│   ├── use.ts              # 扩展：支持 opencode 类型
│   ├── create.ts           # 扩展：选择 profile 类型
│   └── ...
├── core/
│   ├── profile.ts          # 扩展：新 Profile 接口
│   ├── config.ts           # 已有
│   └── opencode.ts         # 【新增】opencode 配置操作
├── types/
│   └── index.ts            # 扩展：新增类型定义
└── utils/
    └── file.ts             # 已有
```

### 4.2 向后兼容性

- 现有纯 claude 配置的 profile 无需修改，自动识别为 `type: 'claude'`
- 现有命令行为保持不变
- 新增功能通过新命令参数或交互式提示提供

### 4.3 与 oh-my-opencode 的关系

当前的 `oh-my-opencode.json` 配置了 agent 和 category 的模型映射。这个设计与本方案是**互补关系**：

- `oh-my-opencode.json`：定义 **agent/category 级别的模型映射**（如 sisyphus 用什么模型）
- cce profile：定义 **全局默认模型配置**（如当前默认使用哪个 provider 和模型）

两者可以共存：cce 设置默认模型，oh-my-opencode 在此基础上为特定 agent 指定不同模型。

## 5. 总结

本设计方案通过与 cce 架构对齐，实现以下目标：

1. ✅ **统一配置管理**：复用 cce 的成熟架构
2. ✅ **同时维护双工具**：一个 profile 可以同时配置 Claude Code 和 Opencode
3. ✅ **向后兼容**：不影响现有 cce 用户
4. ✅ **渐进式迁移**：可以逐步将 opencode 配置纳入管理

下一步建议：
1. 评审本设计方案
2. 确定实现优先级（MVP 功能）
3. 开始实施具体功能
