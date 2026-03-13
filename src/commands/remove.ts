import { deleteProfile, getProfile, getActiveProfile, clearActiveProfile } from '../core/profile.js';
import { logger } from '../utils/logger.js';
import inquirer from 'inquirer';

export async function removeCommand(name: string): Promise<void> {
  try {
    const profile = await getProfile(name);

    if (!profile) {
      console.log(`❌ Profile '${name}' 不存在`);
      console.log('使用 `cce list` 查看所有可用的 Profiles');
      process.exit(1);
    }

    // 确认删除
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `确认删除 Profile '${name}'?`,
        default: false,
      },
    ]);

    if (!confirm) {
      console.log('已取消');
      process.exit(0);
    }

    // 检查是否是当前激活的 profile
    const activeProfile = await getActiveProfile();
    if (activeProfile === name) {
      await clearActiveProfile();
    }

    await deleteProfile(name);

    console.log(`✓ Profile '${name}' 已删除`);
  } catch (err) {
    logger.error('删除 Profile 失败', err);
    process.exit(1);
  }
}
