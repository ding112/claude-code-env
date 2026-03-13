// ============================================================================
// Provider System 类型定义
// ============================================================================

// Provider 类型
export type ProviderType = 'openai-compatible' | 'claude-native' | 'custom';

// Provider 配置（全局共享）
export interface Provider {
  name: string;                    // 唯一标识
  displayName: string;            // 显示名称
  type: ProviderType;              // Provider 类型

  // 连接配置
  baseURL: string;
  apiKey: string;

  // 模型配置
  models: string[];                // 可用模型列表
  defaultModel: string;           // 默认模型（从 models 中选择）

  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// Profile 类型定义（新格式）
// ============================================================================

// 新的 Profile 接口（简化版，不区分 type）
export interface Profile {
  name: string;
  description?: string;
  provider: string;                // 引用的 Provider name
  model?: string;                  // 可选：覆盖 Provider 的 defaultModel
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 配置合并结果
// ============================================================================

// Profile + Provider 合并后的有效配置
export interface EffectiveConfig {
  // 连接配置
  baseURL: string;
  apiKey: string;

  // 模型
  model: string;

  // 来源信息
  providerName: string;
  providerDisplayName: string;
  isModelOverridden: boolean;
}

// ============================================================================
// Claude Code 配置（用于生成 ~/.claude/settings.json）
// ============================================================================

export interface ClaudeEnvConfig {
  ANTHROPIC_BASE_URL: string;
  ANTHROPIC_AUTH_TOKEN: string;
  ANTHROPIC_MODEL: string;
}

export interface ClaudeSettings {
  env: ClaudeEnvConfig;
}

// ============================================================================
// OpenCode 配置（用于生成 ~/.config/opencode/opencode.json）
// ============================================================================

export interface OpencodeProvider {
  npm?: string;                    // 默认 "@ai-sdk/openai-compatible"
  name?: string;
  options?: {
    baseURL?: string;
    apiKey?: string;
    [key: string]: unknown;
  };
  models?: Record<string, { enabled: boolean }>;
}

export interface OpencodeJson {
  provider?: Record<string, OpencodeProvider>;
}

// ============================================================================
// 验证错误类型
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
}

// ============================================================================
// CLI 配置
// ============================================================================

export interface CliConfig {
  configDir: string;
  profilesDir: string;
  providersDir: string;
  activeFile: string;
}

// ============================================================================
// 命令选项
// ============================================================================

export interface CreateOptions {
  description?: string;
  fromCurrent?: boolean;
}

export interface SwitchOptions {
  immediate?: boolean;
}
