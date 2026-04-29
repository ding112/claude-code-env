import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { logger } from '../utils/logger.js';
import type { Profile, Provider, EffectiveConfig, ClaudeSettings, OpencodeJson, ClaudeEnvConfig } from '../types/index.js';

// ============================================================================
// 安全权限常量
// ============================================================================

/** 目录安全权限: 0o700 (仅所有者可读写执行) */
const SECURE_DIR_MODE = 0o700;

/** 敏感文件安全权限: 0o600 (仅所有者可读写) */
const SECURE_FILE_MODE = 0o600;

// ============================================================================
// Claude Code 扩展环境变量键
// ============================================================================

const CLAUDE_CODE_ENV_KEYS = [
  'ANTHROPIC_DEFAULT_OPUS_MODEL',
  'ANTHROPIC_DEFAULT_SONNET_MODEL',
  'ANTHROPIC_DEFAULT_HAIKU_MODEL',
  'CLAUDE_CODE_SUBAGENT_MODEL',
  'CLAUDE_CODE_EFFORT_LEVEL',
] as const;

/**
 * 合并 Claude 环境变量配置
 * - 清理旧的扩展键
 * - 按需写入新的扩展键
 */
export function mergeClaudeEnv(
  existingEnv: Record<string, unknown>,
  config: EffectiveConfig
): Record<string, unknown> {
  // 先清理所有扩展键
  const envWithoutClaudeCode = { ...existingEnv };
  for (const key of CLAUDE_CODE_ENV_KEYS) {
    delete envWithoutClaudeCode[key];
  }

  // 构建新的 env 对象
  return {
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
  };
}

// ============================================================================
// Claude Code 配置生成
// ============================================================================

const CLAUDE_SETTINGS_PATH = path.join(os.homedir(), '.claude', 'settings.json');

async function ensureClaudeSettingsDir(): Promise<void> {
  const dir = path.dirname(CLAUDE_SETTINGS_PATH);
  try {
    await fs.mkdir(dir, { recursive: true, mode: SECURE_DIR_MODE });
  } catch (err) {
    logger.error('创建 Claude settings 目录失败', err);
    throw err;
  }
}

export async function generateClaudeConfig(config: EffectiveConfig): Promise<void> {
  await ensureClaudeSettingsDir();

  try {
    // 读取现有的 settings.json
    let existingSettings: Record<string, unknown> = {};
    try {
      const content = await fs.readFile(CLAUDE_SETTINGS_PATH, 'utf-8');
      existingSettings = JSON.parse(content);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err;
      }
      // 文件不存在，使用空对象
    }

    // 使用 mergeClaudeEnv 合并环境变量
    const mergedEnv = mergeClaudeEnv(
      (existingSettings.env as Record<string, unknown>) || {},
      config
    );

    // 更新 env 部分
    const newSettings: ClaudeSettings = {
      ...existingSettings,
      env: mergedEnv as unknown as ClaudeEnvConfig,
    };

    await fs.writeFile(CLAUDE_SETTINGS_PATH, JSON.stringify(newSettings, null, 2), {
      encoding: 'utf-8',
      mode: SECURE_FILE_MODE,
    });
    logger.info(`Claude Code 配置已更新: ${config.model}`);
  } catch (err) {
    logger.error('更新 Claude Code 配置失败', err);
    throw err;
  }
}

// ============================================================================
// OpenCode 配置生成
// ============================================================================

const OPENCODE_CONFIG_PATH = path.join(os.homedir(), '.config', 'opencode', 'opencode.json');

async function ensureOpencodeConfigDir(): Promise<void> {
  const dir = path.dirname(OPENCODE_CONFIG_PATH);
  try {
    await fs.mkdir(dir, { recursive: true, mode: SECURE_DIR_MODE });
  } catch (err) {
    logger.error('创建 OpenCode 配置目录失败', err);
    throw err;
  }
}

export async function generateOpencodeConfig(config: EffectiveConfig): Promise<void> {
  await ensureOpencodeConfigDir();

  try {
    // 读取现有的 opencode.json
    let existingSettings: OpencodeJson = {};
    try {
      const content = await fs.readFile(OPENCODE_CONFIG_PATH, 'utf-8');
      existingSettings = JSON.parse(content);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err;
      }
      // 文件不存在，使用空对象
    }

    // 更新 provider 部分
    const newSettings: OpencodeJson = {
      ...existingSettings,
      provider: {
        ...(existingSettings.provider || {}),
        [config.providerName]: {
          npm: '@ai-sdk/openai-compatible',
          name: config.providerDisplayName,
          options: {
            baseURL: config.baseURL,
            apiKey: config.apiKey,
          },
          models: {
            [config.model]: { enabled: true },
          },
        },
      },
    };

    await fs.writeFile(OPENCODE_CONFIG_PATH, JSON.stringify(newSettings, null, 2), {
      encoding: 'utf-8',
      mode: SECURE_FILE_MODE,
    });
    logger.info(`OpenCode 配置已更新: ${config.model}`);
  } catch (err) {
    logger.error('更新 OpenCode 配置失败', err);
    throw err;
  }
}

// ============================================================================
// 同时生成两个工具的配置
// ============================================================================

export async function generateAllConfigs(config: EffectiveConfig): Promise<{
  claude: boolean;
  opencode: boolean;
}> {
  const results = {
    claude: false,
    opencode: false,
  };

  try {
    await generateClaudeConfig(config);
    results.claude = true;
  } catch (err) {
    logger.error('生成 Claude Code 配置失败', err);
  }

  try {
    await generateOpencodeConfig(config);
    results.opencode = true;
  } catch (err) {
    logger.error('生成 OpenCode 配置失败', err);
  }

  return results;
}
