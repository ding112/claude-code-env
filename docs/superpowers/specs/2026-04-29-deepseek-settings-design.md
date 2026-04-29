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
- **仅 Profile 级别**：`claudeCodeSettings` 只存储在 Profile 中，每个 Profile 独立配置
- **Provider 不存储默认值**：Provider 不新增 `claudeCodeSettings` 字段

### 字段设计
- **独立字段**：使用嵌套对象 `claudeCodeSettings` 包含 5 个独立字段

### 值来源
- **仅来自 Profile**：`claudeCodeSettings` 的生效值完全来自 Profile

### Vendor 字段
- **新增 vendor 字段**：标识供应商（deepseek/volcengine/tencent/alibaba/openai/anthropic/custom）
- **预定义列表选择**：用户从预定义列表中选择，不是自由输入
- **兼容性策略**：历史数据允许缺省；新增 Provider 交互默认要求选择 vendor

## 类型定义

### VendorType

```typescript
export type VendorType = 'deepseek' | 'volcengine' | 'tencent' | 'alibaba' | 'openai' | 'anthropic' | 'custom';
```

### ClaudeCodeEffortLevel

```typescript
export type ClaudeCodeEffortLevel = 'low' | 'medium' | 'high' | 'max';
```

### ProfileClaudeCodeSettings

```typescript
export interface ProfileClaudeCodeSettings {
  defaultOpusModel?: string;
  defaultSonnetModel?: string;
  defaultHaikuModel?: string;
  subagentModel?: string;
  effortLevel?: ClaudeCodeEffortLevel;
}
```

### Provider 扩展

```typescript
export interface Provider {
  name: string;
  displayName: string;
  type: ProviderType;
  vendor?: VendorType;  // 历史数据可缺省；新增交互默认要求选择
  baseURL: string;
  apiKey: string;
  models: string[];
  defaultModel: string;
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
  claudeCodeSettings?: ProfileClaudeCodeSettings;  // Profile 高级配置
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
  vendor?: VendorType;
  claudeCodeSettings?: ProfileClaudeCodeSettings;  // 来自 Profile
}
```

### ClaudeEnvConfig 扩展

```typescript
export interface ClaudeEnvConfig {
  ANTHROPIC_BASE_URL: string;
  ANTHROPIC_AUTH_TOKEN: string;
  ANTHROPIC_MODEL: string;
  ANTHROPIC_DEFAULT_OPUS_MODEL?: string;
  ANTHROPIC_DEFAULT_SONNET_MODEL?: string;
  ANTHROPIC_DEFAULT_HAIKU_MODEL?: string;
  CLAUDE_CODE_SUBAGENT_MODEL?: string;
  CLAUDE_CODE_EFFORT_LEVEL?: ClaudeCodeEffortLevel;
}
```

## 配置合并逻辑

`src/core/switch.ts` 中的 `resolveConfig` 函数：

```typescript
function resolveConfig(profile: Profile, provider: Provider): EffectiveConfig {
  const model = profile.model || provider.defaultModel;

  const claudeCodeSettings = profile.claudeCodeSettings
    && Object.values(profile.claudeCodeSettings).some((v) => v !== undefined)
    ? profile.claudeCodeSettings
    : undefined;

  return {
    baseURL: provider.baseURL,
    apiKey: provider.apiKey,
    model,
    providerName: provider.name,
    providerDisplayName: provider.displayName,
    isModelOverridden: !!profile.model,
    vendor: provider.vendor,
    claudeCodeSettings,
  };
}
```

规则：
1. `claudeCodeSettings` 仅由 Profile 提供
2. 如果 Profile 未配置或全部为 `undefined`，则不设置这些环境变量

## 配置生成逻辑

`src/core/configGenerator.ts` 中的 `generateClaudeConfig` 函数：

```typescript
const CLAUDE_CODE_ENV_KEYS = [
  'ANTHROPIC_DEFAULT_OPUS_MODEL',
  'ANTHROPIC_DEFAULT_SONNET_MODEL',
  'ANTHROPIC_DEFAULT_HAIKU_MODEL',
  'CLAUDE_CODE_SUBAGENT_MODEL',
  'CLAUDE_CODE_EFFORT_LEVEL',
] as const;

const envWithoutClaudeCode = { ...(existingSettings.env || {}) };
for (const key of CLAUDE_CODE_ENV_KEYS) {
  delete envWithoutClaudeCode[key];
}

const newSettings: ClaudeSettings = {
  ...existingSettings,
  env: {
    ...envWithoutClaudeCode,
    ANTHROPIC_BASE_URL: config.baseURL,
    ANTHROPIC_AUTH_TOKEN: config.apiKey,
    ANTHROPIC_MODEL: config.model,

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
- 每次生成前先清理 5 个 Claude Code 扩展 env key，避免历史残留
- 只有 Profile 对应字段有值时才写入环境变量
- 其他非 cce 管理的 env 字段保持不变

## CLI 交互设计

### provider add 命令

新增交互步骤：
1. 选择 vendor（从预定义列表选择，默认必填）
2. 不询问 `claudeCodeSettings`

### provider edit 命令

允许修改 vendor 字段；不支持修改 `claudeCodeSettings`（因为 Provider 不存该字段）。

### create 命令（创建 Profile）

可选询问：
- 是否配置 Claude Code Settings（高级配置）
- 如果选择配置，逐个询问 5 个字段

### edit 命令（编辑 Profile）

允许修改 `claudeCodeSettings` 覆盖值（Profile 级）。

## 文件修改清单

| 文件 | 修改内容 |
|------|----------|
| `src/types/index.ts` | 新增 VendorType、ClaudeCodeEffortLevel、ProfileClaudeCodeSettings，扩展 Provider、Profile、EffectiveConfig、ClaudeEnvConfig |
| `src/core/switch.ts` | resolveConfig 直接读取 Profile 的 claudeCodeSettings |
| `src/core/configGenerator.ts` | generateClaudeConfig 先清理再写入扩展环境变量 |
| `src/core/provider.ts` | 新增 vendor 验证逻辑（新增 Provider 交互默认必填） |
| `src/commands/provider.ts` | provider add/edit 交互仅处理 vendor，不处理 claudeCodeSettings |
| `src/commands/create.ts` | Profile 创建时可选配置 claudeCodeSettings |
| `src/commands/edit.ts` | Profile 编辑时允许修改 claudeCodeSettings |

## 验证方式

实现完成后验证步骤：
1. 创建 DeepSeek Provider，仅设置 vendor='deepseek'
2. 创建 Profile，配置 claudeCodeSettings
3. 执行 `cce use <profile>`
4. 检查 `~/.claude/settings.json` 是否包含预期扩展环境变量
5. 修改 Profile 移除部分字段，再次 `use`，确认对应 key 被清理
6. 验证 OpenCode 配置未受影响

## 风险与限制

- `vendor` 为兼容历史数据保留可选；新增交互默认要求填写
- `claudeCodeSettings` 完全在 Profile 侧管理，可能导致同 Provider 下多个 Profile 重复配置
- OpenCode 配置生成不受影响
