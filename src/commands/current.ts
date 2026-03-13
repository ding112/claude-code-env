import { getActiveProfile, getProfile } from '../core/profile.js';
import { getProvider } from '../core/provider.js';
import { logger } from '../utils/logger.js';
import chalk from 'chalk';

function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) return '****';
  return `${apiKey.substring(0, 8)}${'*'.repeat(Math.max(4, apiKey.length - 12))}${apiKey.substring(apiKey.length - 4)}`;
}

export async function currentCommand(): Promise<void> {
  try {
    const activeProfile = await getActiveProfile();

    if (!activeProfile) {
      console.log('当前没有激活的 Profile');
      console.log('使用 `cce use <name>` 激活一个 Profile');
      process.exit(0);
    }

    const profile = await getProfile(activeProfile);

    if (!profile) {
      console.log(`⚠ 当前激活的 Profile '${activeProfile}' 不存在`);
      console.log('使用 `cce use <name>` 激活另一个 Profile');
      process.exit(1);
    }

    const provider = await getProvider(profile.provider);

    console.log();
    console.log(chalk.bold(`当前 Profile: ${chalk.green(profile.name)}`));

    if (profile.description) {
      console.log(`描述: ${profile.description}`);
    }

    console.log();

    if (provider) {
      const model = profile.model || provider.defaultModel;

      console.log(`Provider: ${provider.displayName} (${profile.provider})`);
      console.log(`模型: ${model}${profile.model ? ' (覆盖)' : ' (默认)'}`);
      console.log(`Base URL: ${provider.baseURL}`);
      console.log(`API Key: ${maskApiKey(provider.apiKey)}`);

      console.log();
      console.log(chalk.dim('配置已应用到:'));
      console.log(`  • Claude Code (~/.claude/settings.json)`);
      console.log(`  • OpenCode (~/.config/opencode/opencode.json)`);
    } else {
      console.log(`Provider: ${profile.provider} ${chalk.red('(不存在)')}`);
    }

    console.log();
  } catch (err) {
    logger.error('显示当前 Profile 失败', err);
    process.exit(1);
  }
}
