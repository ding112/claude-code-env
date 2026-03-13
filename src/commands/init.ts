import { getConfig } from '../core/config.js';
import { ensureDir } from '../utils/file.js';
import { logger } from '../utils/logger.js';

export async function initCommand(): Promise<void> {
  const config = getConfig();

  // 创建配置目录
  await ensureDir(config.configDir);
  await ensureDir(config.profilesDir);
  await ensureDir(config.providersDir);

  logger.success(`初始化完成: ${config.configDir}`);
  console.log();
  console.log('目录结构:');
  console.log(`  ${config.configDir}`);
  console.log('  ├── providers/  # Provider 配置文件');
  console.log('  └── profiles/   # Profile 配置文件');
  console.log();
  console.log('使用 `cce provider add <type>` 添加一个 Provider');
  console.log('使用 `cce create <name>` 创建一个 Profile');
}
