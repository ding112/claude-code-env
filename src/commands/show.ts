import { getProfile } from '../core/profile.js';
import { getProvider } from '../core/provider.js';
import { logger } from '../utils/logger.js';
import chalk from 'chalk';

function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) return '****';
  return `${apiKey.substring(0, 8)}${'*'.repeat(Math.max(4, apiKey.length - 12))}${apiKey.substring(apiKey.length - 4)}`;
}

export async function showCommand(name: string): Promise<void> {
  try {
    const profile = await getProfile(name);

    if (!profile) {
      console.log(`❌ Profile '${name}' 不存在`);
      console.log('使用 `cce list` 查看所有可用的 Profiles');
      process.exit(1);
    }

    const provider = await getProvider(profile.provider);

    if (!provider) {
      console.log(`❌ Profile 引用的 Provider '${profile.provider}' 不存在`);
      process.exit(1);
    }

    const model = profile.model || provider.defaultModel;

    console.log();
    console.log(chalk.bold(`Profile: ${profile.name}`));
    console.log(chalk.dim('─'.repeat(60)));

    if (profile.description) {
      console.log(`描述: ${profile.description}`);
    }

    console.log();
    console.log(`Provider: ${provider.displayName} (${profile.provider})`);
    console.log(`模型: ${model}${profile.model ? ' (覆盖)' : ' (默认)'}`);
    console.log(`Base URL: ${provider.baseURL}`);
    console.log(`API Key: ${maskApiKey(provider.apiKey)}`);

    console.log();
    console.log(`创建时间: ${new Date(profile.createdAt).toLocaleString('zh-CN')}`);
    console.log(`更新时间: ${new Date(profile.updatedAt).toLocaleString('zh-CN')}`);

    // 显示 Provider 的所有可用模型
    if (provider.models.length > 1) {
      console.log();
      console.log(chalk.dim('Provider 可用模型:'));
      for (const m of provider.models) {
        const isDefault = m === provider.defaultModel;
        const isCurrent = m === model;
        let marker = ' ';
        if (isCurrent) marker = chalk.green('*');
        else if (isDefault) marker = chalk.dim('d');
        console.log(`  ${marker} ${m}${isDefault ? chalk.dim(' (默认)') : ''}`);
      }
    }

    console.log(chalk.dim('─'.repeat(60)));
  } catch (err) {
    logger.error('查看 Profile 失败', err);
    process.exit(1);
  }
}
