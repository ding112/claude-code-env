import inquirer from 'inquirer';
import { logger } from '../utils/logger.js';
import type { Profile, ProfileClaudeCodeSettings, ClaudeCodeEffortLevel } from '../types/index.js';
import { saveProfile, getProfile } from '../core/profile.js';
import { listProviders } from '../core/provider.js';

// ============================================================================
// Helper Functions
// ============================================================================

const EFFORT_LEVEL_OPTIONS = [
  { name: 'Low', value: 'low' },
  { name: 'Medium', value: 'medium' },
  { name: 'High', value: 'high' },
  { name: 'Max', value: 'max' },
] as const;

export function sanitizeClaudeCodeSettingsInput(input: {
  defaultOpusModel?: string;
  defaultSonnetModel?: string;
  defaultHaikuModel?: string;
  subagentModel?: string;
  effortLevel?: ClaudeCodeEffortLevel | '';
}): ProfileClaudeCodeSettings | undefined {
  const settings: ProfileClaudeCodeSettings = {
    defaultOpusModel: input.defaultOpusModel?.trim() || undefined,
    defaultSonnetModel: input.defaultSonnetModel?.trim() || undefined,
    defaultHaikuModel: input.defaultHaikuModel?.trim() || undefined,
    subagentModel: input.subagentModel?.trim() || undefined,
    effortLevel: (input.effortLevel || undefined) as ClaudeCodeEffortLevel | undefined,
  };

  return Object.values(settings).some((v) => v !== undefined) ? settings : undefined;
}

// ============================================================================
// Create Command
// ============================================================================

export async function createCommand(name: string): Promise<void> {
  try {
    // 检查是否已存在
    const existing = await getProfile(name);
    if (existing) {
      console.log(`❌ Profile '${name}' 已存在`);
      console.log('使用 `cce edit ${name}` 编辑现有 Profile');
      process.exit(1);
    }

    // 获取可用的 providers
    const providers = await listProviders();

    if (providers.length === 0) {
      console.log('❌ 还没有配置任何 Provider');
      console.log('使用 `cce provider add` 先添加一个 Provider');
      process.exit(1);
    }

    // 询问基本信息
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'provider',
        message: '选择 Provider:',
        choices: providers.map(p => ({
          name: `${p.displayName} (${p.name}) - ${p.defaultModel}`,
          value: p.name,
        })),
      },
      {
        type: 'input',
        name: 'description',
        message: 'Profile 描述 (可选):',
      },
      {
        type: 'confirm',
        name: 'overrideModel',
        message: '是否覆盖默认模型?',
        default: false,
      },
    ]);

    let model: string | undefined;
    if (answers.overrideModel) {
      const selectedProvider = providers.find(p => p.name === answers.provider);
      if (!selectedProvider) {
        console.log('❌ Provider 未找到');
        process.exit(1);
      }

      const { selectedModel } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedModel',
          message: '选择模型:',
          choices: selectedProvider.models.map(m => ({
            name: m,
            value: m,
          })),
        },
      ]);
      model = selectedModel;
    }

    // 询问 Claude Code 高级配置
    const { configureAdvanced } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'configureAdvanced',
        message: '是否配置 Claude Code 高级设置?',
        default: false,
      },
    ]);

    let claudeCodeSettings: ProfileClaudeCodeSettings | undefined;
    if (configureAdvanced) {
      const advancedAnswers = await inquirer.prompt([
        {
          type: 'input',
          name: 'defaultOpusModel',
          message: '默认 Opus 模型 (可选):',
        },
        {
          type: 'input',
          name: 'defaultSonnetModel',
          message: '默认 Sonnet 模型 (可选):',
        },
        {
          type: 'input',
          name: 'defaultHaikuModel',
          message: '默认 Haiku 模型 (可选):',
        },
        {
          type: 'input',
          name: 'subagentModel',
          message: 'Subagent 模型 (可选):',
        },
        {
          type: 'list',
          name: 'effortLevel',
          message: 'Effort Level (可选):',
          choices: [{ name: '不设置', value: '' }, ...EFFORT_LEVEL_OPTIONS],
        },
      ]);

      claudeCodeSettings = sanitizeClaudeCodeSettingsInput(advancedAnswers);
    }

    const now = new Date().toISOString();
    const profile: Profile = {
      name,
      description: answers.description || undefined,
      provider: answers.provider,
      model,
      claudeCodeSettings,
      createdAt: now,
      updatedAt: now,
    };

    await saveProfile(profile);

    console.log(`✓ Profile '${name}' 已创建`);
    console.log(`  Provider: ${answers.provider}`);
    if (model) {
      console.log(`  模型: ${model} (覆盖)`);
    }
    if (claudeCodeSettings) {
      console.log(`  Claude Code 高级设置已配置`);
    }

    // 询问是否立即使用
    const { useNow } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'useNow',
        message: '是否立即激活该 Profile?',
        default: true,
      },
    ]);

    if (useNow) {
      const { useCommand } = await import('./use.js');
      await useCommand(name);
    }

    process.exit(0);
  } catch (err) {
    logger.error('创建 Profile 失败', err);
    process.exit(1);
  }
}
