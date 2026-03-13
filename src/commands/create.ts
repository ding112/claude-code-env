import inquirer from 'inquirer';
import { logger } from '../utils/logger.js';
import type { Profile } from '../types/index.js';
import { saveProfile, getProfile } from '../core/profile.js';
import { listProviders } from '../core/provider.js';

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
      console.log('使用 `cce provider add <type>` 先添加一个 Provider');
      process.exit(1);
    }

    // 询问
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

    const now = new Date().toISOString();
    const profile: Profile = {
      name,
      description: answers.description || undefined,
      provider: answers.provider,
      model,
      createdAt: now,
      updatedAt: now,
    };

    await saveProfile(profile);

    console.log(`✓ Profile '${name}' 已创建`);
    console.log(`  Provider: ${answers.provider}`);
    if (model) {
      console.log(`  模型: ${model} (覆盖)`);
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
