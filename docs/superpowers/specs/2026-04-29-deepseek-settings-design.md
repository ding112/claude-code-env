# DeepSeek Provider Claude Code Settings 支持

## 背景

Claude Code 支持通过环境变量配置多个模型参数，现有 cce 项目只设置了 3 个基础环境变量：
- `ANTHROPIC_BASE_URL`
- `ANTHROPIC_AUTH_TOKEN`
- `ANTHROPIC_MODEL`

DeepSeek 等供应商需要额外配置 5 个环境变量：
- `ANTHROPIC_DEFAULT_OPUS_MODEL` - 默认 Opus 模型
- `ANTHROPIC_DEFAULT_SONNET_MODEL` - 默认 Sonnet 模型
- `ANTHROPIC_DEFAULT_HAIKU_MODEL` - 默认 Haiku 模型
- `CLAUDE_CODE_SUBAGENT_MODEL` - 子代理模型
- `CLAUDE_CODE_EFFORT_LEVEL` - 努力级别（low/medium/high/max）

## 目标

在现有 Provider-Profile 架构中支持这些额外参数，使 DeepSeek 等供应商能够完整配置 Claude Code。

## 设计决策

### 存储层级
- **Profile 级别**：这些参数存储在 Profile 中，每个 Profile 可以独立配置

### 字段设计
- **独立字段**：使用嵌套对象 `claudeCodeSettings` 包含 5 个独立字段

### 值来源
- **所有 Provider 可选**：任何 Provider 都可以定义这些字段的默认值，Profile 可覆盖

### Vendor 字段
- **新增 vendor 字段**：标识供应商（deepseek/volcengine/tencent/alibaba/openai/anthropic/custom）
- **预定义列表选择**：用户从预定义列表中选择，不是自由输入

## 类型定义

### VendorType

```typescript
export type VendorType = 'deepseek' | 'volcengine' | 'tencent' | 'alibaba' | 'openai' | 'anthropic' | 'custom';
```

### ClaudeCodeSettings

```typescript
export interface ClaudeCodeSettings {
  defaultOpusModel?: string;
  defaultSonnetModel?: string;
  defaultHaikuModel?: string;
  subagentModel?: string;
  effortLevel?: 'low' | 'medium' | 'high' | 'max';
}
```

### Provider 扩展

```typescript
export interface Provider {
  name: string;
  displayName: string;
  type: ProviderType;
  vendor?: VendorType;  // 新增：供应商标识
  baseURL: string;
  apiKey: string;
  models: string[];
  defaultModel: string;
  claudeCodeSettings?: ClaudeCodeSettings;  // 新增：Claude Code 专用配置
  createdAt?: string;
  updatedAt?: string;
}
```

### Profile 扩展

```typescript
export interface Profile {
  name: string;
  description?: string;
  provider: string;
  model?: string;
  claudeCodeSettings?: ClaudeCodeSettings;  // 新增：覆盖 Provider 默认值
  createdAt: string;
  updatedAt: string;
}
```

### EffectiveConfig 扩展

```typescript
export interface EffectiveConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  providerName: string;
  providerDisplayName: string;
  isModelOverridden: boolean;
  vendor?: VendorType;  // 新增
  claudeCodeSettings?: ClaudeCodeSettings;  // 新增：合并后的配置
}
```

### ClaudeEnvConfig 扩展

```typescript
export interface ClaudeEnvConfig {
  ANTHROPIC_BASE_URL: string;
  ANTHROPIC_AUTH_TOKEN: string;
  ANTHROPIC_MODEL: string;
  ANTHROPIC_DEFAULT_OPUS_MODEL?: string;  // 新增
  ANTHROPIC_DEFAULT_SONNET_MODEL?: string;  // 新增
  ANTHROPIC_DEFAULT_HAIKU_MODEL?: string;  // 新增
  CLAUDE_CODE_SUBAGENT_MODEL?: string;  // 新增
  CLAUDE_CODE_EFFORT_LEVEL?: string;  // 新增
}
```

## 配置合并逻辑

`src/core/switch.ts` 中的 `resolveConfig` 函数：

```typescript
function resolveConfig(profile: Profile, provider: Provider): EffectiveConfig {
  const model = profile.model || provider.defaultModel;

  // 合并 Claude Code Settings（Provider 默认 + Profile 覆盖）
  const claudeCodeSettings = {
    ...provider.claudeCodeSettings,
    ...profile.claudeCodeSettings,
  };

  return {
    baseURL: provider.baseURL,
    apiKey: provider.apiKey,
    model,
    providerName: provider.name,
    providerDisplayName: provider.displayName,
    isModelOverridden: !!profile.model,
    vendor: provider.vendor,
    claudeCodeSettings: Object.keys(claudeCodeSettings).length > 0
      ? claudeCodeSettings
      : undefined,
  };
}
```

合并规则：
1. Provider 定义默认值
2. Profile 可以覆盖 Provider 的值
3. 如果两者都没定义，则不设置这些环境变量

## 配置生成逻辑

`src/core/configGenerator.ts` 中的 `generateClaudeConfig` 函数：

```typescript
const newSettings: ClaudeSettings = {
  ...existingSettings,
  env: {
    ...(existingSettings.env || {}),
    ANTHROPIC_BASE_URL: config.baseURL,
    ANTHROPIC_AUTH_TOKEN: config.apiKey,
    ANTHROPIC_MODEL: config.model,

    // 条件添加额外环境变量
    ...(config.claudeCodeSettings?.defaultOpusModel && {
      ANTHROPIC_DEFAULT_OPUS_MODEL: config.claudeCodeSettings.defaultOpusModel,
    }),
    ...(config.claudeCodeSettings?.defaultSonnetModel && {
      ANTHROPIC_DEFAULT_SONNET_MODEL: config.claudeCodeSettings.defaultSonnetModel,
    }),
    ...(config.claudeCodeSettings?.defaultHaikuModel && {
      ANTHROPIC_DEFAULT_HAIKU_MODEL: config.claudeCodeSettings.defaultHaikuModel,
    }),
    ...(config.claudeCodeSettings?.subagentModel && {
      CLAUDE_CODE_SUBAGENT_MODEL: config.claudeCodeSettings.subagentModel,
    }),
    ...(config.claudeCodeSettings?.effortLevel && {
      CLAUDE_CODE_EFFORT_LEVEL: config.claudeCodeSettings.effortLevel,
    }),
  },
};
```

关键点：
- 只有当字段有值时才设置对应环境变量
- 使用展开运算符动态添加，避免硬编码 undefined 值

## CLI 交互设计

### provider add 命令

新增交互步骤：
1. 选择 vendor（从预定义列表选择）
2. 可选配置 Claude Code Settings（询问是否配置，如果"是"则逐个询问 5 个字段）

### provider edit 命令

允许修改 vendor 和 claudeCodeSettings 字段。

### create 命令（创建 Profile）

可选询问：
- 如果 Provider 定义了 claudeCodeSettings，询问是否覆盖
- 如果选择覆盖，逐个询问要覆盖的字段

### edit 命令（编辑 Profile）

允许修改 claudeCodeSettings 覆盖值。

## 文件修改清单

| 文件 | 修改内容 |
|------|----------|
| `src/types/index.ts` | 新增 VendorType、ClaudeCodeSettings，扩展 Provider、Profile、EffectiveConfig、ClaudeEnvConfig |
| `src/core/switch.ts` | resolveConfig 函数合并 claudeCodeSettings |
| `src/core/configGenerator.ts` | generateClaudeConfig 添加额外环境变量 |
| `src/core/provider.ts` | 新增 vendor 验证逻辑 |
| `src/commands/provider.ts` | provider add/edit 交互增加 vendor 和 claudeCodeSettings 询问 |
| `src/commands/create.ts` | Profile 创建时可选覆盖 claudeCodeSettings |
| `src/commands/edit.ts` | Profile 编辑时允许修改 claudeCodeSettings |

## 验证方式

实现完成后验证步骤：
1. 创建 DeepSeek Provider，设置 vendor='deepseek' 和 claudeCodeSettings
2. 创建 Profile，可选择覆盖 claudeCodeSettings
3. 执行 `cce use <profile>`
4. 检查 `~/.claude/settings.json` 是否包含所有预期的环境变量
5. 验证 OpenCode 配置未受影响

## 风险与限制

- vendor 字段为可选，不影响现有 Provider
- claudeCodeSettings 为可选，不设置时行为与现在一致
- OpenCode 配置生成不受影响