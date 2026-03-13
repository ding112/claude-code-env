import inquirer from 'inquirer';
import { getProfile, saveProfile } from '../core/profile.js';
import { getProvider } from '../core/provider.js';
import { logger } from '../utils/logger.js';
import type { Profile } from '../types/index.js';

export async function editCommand(name: string): Promise<void> {
  try {
    const profile = await getProfile(name);

    if (!profile) {
      console.log(`❌ Profile '${name}' 不存在`);
      console.log('使用 `cce list` 查看所有可用的 Profiles');
      process.exit(1);
    }

    // 获取 Provider 信息
    const provider = await getProvider(profile.provider);

    if (!provider) {
      console.log(`❌ Profile 引用的 Provider '${profile.provider}' 不存在`);
      console.log('请修复此 Profile 或重新创建');
      process.exit(1);
    }

    console.log();
    console.log(`当前 Profile: ${name}`);
    console.log(`  Provider: ${provider.displayName} (${profile.provider})`);
    console.log(`  描述: ${profile.description || '(无)'}`);
    console.log(`  模型: ${profile.model || provider.defaultModel}${profile.model ? ' (覆盖)' : ' (默认)'}`);
    console.log();

    // 询问要修改什么
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '选择要修改的内容:',
        choices: [
          { name: '修改描述', value: 'description' },
          { name: '修改模型', value: 'model' },
          { name: '删除模型覆盖（使用 Provider 默认模型）', value: 'remove-override' },
        ],
      },
    ]);

    let updatedProfile = { ...profile };

    if (action === 'description') {
      const { description } = await inquirer.prompt([
        {
          type: 'input',
          name: 'description',
          message: '新的描述 (留空表示不修改):',
          default: profile.description || '',
        },
      ]);
      updatedProfile.description = description || undefined;
    } else if (action === 'model') {
      const { selectedModel } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedModel',
          message: '选择新模型:',
          choices: provider.models.map(m => ({
            name: m,
            value: m,
          })),
        },
      ]);
      updatedProfile.model = selectedModel;
    } else if (action === 'remove-override') {
      if (!updatedProfile.model) {
        console.log('当前没有模型覆盖');
        process.exit(0);
      }
      updatedProfile.model = undefined;
    }

    await saveProfile(updatedProfile);

    console.log(`✓ Profile '${name}' 已更新`);
    console.log(`  描述: ${updatedProfile.description || '(无)'}`);
    console.log(`  模型: ${updatedProfile.model || provider.defaultModel}${updatedProfile.model ? ' (覆盖)' : ' (默认)'}`);
  } catch (err) {
    logger.error('编辑 Profile 失败', err);
    process.exit(1);
  }
}
