# Profile 从 Source 读取高级配置 & 名称验证宽松模式

## 概述

本设计实现两个功能：
1. Profile 支持从 source 配置文件中读取 Claude Code 高级设置作为默认值
2. 名称验证采用宽松模式，允许更多字符

## 功能 1：Profile 从 Source 读取高级配置

### 目标

当 Profile 未设置 Claude Code 高级配置时，自动从其引用的 Provider 的 source 模板中读取默认值。

### 设计

#### 1.1 SourceTemplate 扩展

**文件**: `src/types/index.ts`

在 `SourceTemplate` 接口中添加 `claudeCodeSettings` 字段：

```typescript
export interface SourceTemplate {
  source: SourceType;
  displayName: string;
  type: ProviderType;
  baseURL: string;
  models: string[];
  defaultModel: string;
  description: string;
  // 新增：Claude Code 高级配置默认值
  claudeCodeSettings?: ProfileClaudeCodeSettings;
}
```

#### 1.2 sources.json 更新

**文件**: `src/core/sources.json`

为每个 source 添加可选的 `claudeCodeSettings` 字段：

```json
{
  "deepseek": {
    "source": "deepseek",
    "displayName": "DeepSeek",
    "type": "openai-compatible",
    "baseURL": "https://api.deepseek.com",
    "models": ["deepseek-chat", "deepseek-coder"],
    "defaultModel": "deepseek-chat",
    "description": "DeepSeek API",
    "claudeCodeSettings": {
      "effortLevel": "medium"
    }
  }
}
```

#### 1.3 配置合并逻辑

**文件**: `src/core/switch.ts`

新增 `mergeClaudeCodeSettings` 函数：

```typescript
function mergeClaudeCodeSettings(
  profileSettings?: ProfileClaudeCodeSettings,
  sourceSettings?: ProfileClaudeCodeSettings
): ProfileClaudeCodeSettings | undefined {
  if (!profileSettings && !sourceSettings) return undefined;
  if (!sourceSettings) return profileSettings;
  if (!profileSettings) return sourceSettings;

  return {
    defaultOpusModel: profileSettings.defaultOpusModel ?? sourceSettings.defaultOpusModel,
    defaultSonnetModel: profileSettings.defaultSonnetModel ?? sourceSettings.defaultSonnetModel,
    defaultHaikuModel: profileSettings.defaultHaikuModel ?? sourceSettings.defaultHaikuModel,
    subagentModel: profileSettings.subagentModel ?? sourceSettings.subagentModel,
    effortLevel: profileSettings.effortLevel ?? sourceSettings.effortLevel,
  };
}
```

修改 `resolveConfig` 函数签名：

```typescript
export function resolveConfig(
  profile: Profile,
  provider: Provider,
  sourceTemplate?: SourceTemplate
): EffectiveConfig {
  const claudeCodeSettings = mergeClaudeCodeSettings(
    profile.claudeCodeSettings,
    sourceTemplate?.claudeCodeSettings
  );

  return {
    baseURL: provider.baseURL,
    apiKey: provider.apiKey,
    model: profile.model || provider.defaultModel,
    providerName: provider.name,
    providerDisplayName: provider.displayName,
    isModelOverridden: !!profile.model,
    source: provider.source,
    claudeCodeSettings,
  };
}
```

#### 1.4 调用链更新

**文件**: `src/core/switch.ts`

在 `switchProfile` 中获取 sourceTemplate 并传递：

```typescript
export async function switchProfile(
  profileName: string,
  opts: SwitchOptions = {}
): Promise<SwitchResult> {
  // ... 现有逻辑 ...
  
  const provider = await getProvider(profile.provider);
  if (!provider) {
    result.errors.push(`Profile 引用的 Provider '${profile.provider}' 不存在`);
    return result;
  }

  // 获取 source 模板
  const { getTemplate } = await import('./sourceTemplates.js');
  const sourceTemplate = provider.source ? getTemplate(provider.source) : undefined;

  const config = resolveConfig(profile, provider, sourceTemplate);
  // ... 后续逻辑 ...
}
```

## 功能 2：名称验证宽松模式

### 目标

允许名称包含更多字符（点、中划线等），仅禁止路径遍历字符。

### 设计

#### 2.1 修改 validateName

**文件**: `src/utils/validation.ts`

```typescript
export function validateName(name: string, type: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: `${type} name 不能为空` };
  }

  const trimmed = name.trim();
  if (trimmed === '') {
    return { valid: false, error: `${type} name 不能为空` };
  }

  // 长度限制
  if (trimmed.length > 64) {
    return { valid: false, error: `${type} name 长度不能超过 64 个字符` };
  }

  // 仅禁止路径遍历字符（宽松模式）
  if (trimmed.includes('..') || trimmed.includes('/') || trimmed.includes('\\')) {
    return { valid: false, error: `${type} name 包含非法字符 (不允许 .. / \\)` };
  }

  return { valid: true };
}
```

#### 2.2 允许的字符

- 字母（a-z, A-Z）
- 数字（0-9）
- 下划线（_）
- 点（.）
- 中划线（-）
- 空格
- 其他可打印字符

#### 2.3 禁止的字符

- `..`（路径遍历）
- `/`（路径分隔符）
- `\`（Windows 路径分隔符）

## WebUI 和 CLI 一致性

### CLI 修改

**文件**: `src/commands/create.ts`

- 创建 Profile 时，如果 source 有默认的 Claude Code 设置，显示提示
- 用户可以选择使用 source 默认值或自定义

### WebUI 修改

**文件**: `src/core/webuiServer.ts`

- 创建/编辑 Profile 时，从 provider 的 source 获取默认值
- 表单预填充 source 默认值
- 用户可以覆盖或保留默认值

### 一致性规则

- CLI 和 WebUI 共享相同的 `mergeClaudeCodeSettings` 函数
- 默认值逻辑完全一致
- 表单字段和验证规则保持同步

## 向后兼容性

- 现有 Profile 无需修改，仍可正常工作
- 现有 sources.json 无需修改，`claudeCodeSettings` 是可选字段
- 名称验证变宽松，不会破坏现有名称

## 测试策略

1. 单元测试 `mergeClaudeCodeSettings` 函数
2. 单元测试 `validateName` 函数
3. 集成测试 Profile 切换时的配置合并
4. 手动测试 CLI 和 WebUI 的一致性
