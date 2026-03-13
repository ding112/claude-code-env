import { listProfiles, getActiveProfile } from '../core/profile.js';
import { getProvider } from '../core/provider.js';
import { logger } from '../utils/logger.js';
import chalk from 'chalk';

export async function listCommand(): Promise<void> {
  try {
    const profiles = await listProfiles();
    const activeProfile = await getActiveProfile();

    if (profiles.length === 0) {
      console.log('还没有配置任何 Profile');
      console.log('使用 `cce create <name>` 创建一个新的 Profile');
      process.exit(0);
    }

    console.log();
    console.log('Profiles:');
    console.log();

    for (const profile of profiles) {
      const isActive = profile.name === activeProfile;
      const marker = isActive ? chalk.green('*') : ' ';
      const name = isActive ? chalk.bold(profile.name) : profile.name;
      const desc = profile.description ? chalk.dim(` - ${profile.description}`) : '';

      console.log(`  ${marker} ${name}${desc}`);

      // 获取 Provider 信息
      const provider = await getProvider(profile.provider);
      if (provider) {
        const model = profile.model || provider.defaultModel;
        const modelLabel = profile.model ? chalk.yellow(`(覆盖)`) : chalk.dim(`(默认)`);
        console.log(`      Provider: ${provider.displayName} (${profile.provider})`);
        console.log(`      模型: ${model} ${modelLabel}`);
      } else {
        console.log(`      Provider: ${profile.provider} ${chalk.red('(不存在)')}`);
      }
      console.log();
    }

    console.log(`使用 'cce use <name>' 激活 Profile`);
  } catch (err) {
    logger.error('列出 Profiles 失败', err);
    process.exit(1);
  }
}
