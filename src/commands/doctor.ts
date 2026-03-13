import { fileExists } from '../utils/file.js';
import { logger } from '../utils/logger.js';
import { CONFIG_DIR, PROVIDERS_DIR, PROFILES_DIR } from '../core/config.js';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export async function doctorCommand(): Promise<void> {
  console.log(chalk.bold('\ncce 配置诊断\n'));

  let hasIssues = false;

  // 检查配置目录
  const configDirExists = await fileExists(CONFIG_DIR);
  console.log(`${configDirExists ? '✓' : '✗'} 配置目录: ${CONFIG_DIR}`);
  if (!configDirExists) {
    hasIssues = true;
    console.log(chalk.red('  配置目录不存在'));
  }

  // 检查 providers 目录
  const providersDirExists = await fileExists(PROVIDERS_DIR);
  console.log(`${providersDirExists ? '✓' : '✗'} Providers 目录: ${PROVIDERS_DIR}`);
  if (!providersDirExists) {
    hasIssues = true;
    console.log(chalk.yellow('  请先使用 cce provider add <type> 添加一个 Provider'));
  } else {
    try {
      const files = await fs.readdir(PROVIDERS_DIR);
      const providerFiles = files.filter(f => f.endsWith('.json'));
      console.log(`  Providers 数量: ${providerFiles.length}`);
      if (providerFiles.length === 0) {
        console.log(chalk.yellow('  ⚠ 还没有配置任何 Provider'));
        console.log(chalk.dim('    使用 `cce provider add <type>` 添加一个 Provider'));
        hasIssues = true;
      }
    } catch (err) {
      console.log(chalk.red('  读取 Providers 目录失败'));
      hasIssues = true;
    }
  }

  // 检查 profiles 目录
  const profilesDirExists = await fileExists(PROFILES_DIR);
  console.log(`${profilesDirExists ? '✓' : '✗'} Profiles 目录: ${PROFILES_DIR}`);
  if (!profilesDirExists) {
    hasIssues = true;
  } else {
    try {
      const files = await fs.readdir(PROFILES_DIR);
      const profileFiles = files.filter(f => f.endsWith('.json'));
      console.log(`  Profiles 数量: ${profileFiles.length}`);
      if (profileFiles.length === 0) {
        console.log(chalk.yellow('  ⚠ 还没有配置任何 Profile'));
        console.log(chalk.dim('    使用 `cce create <name>` 创建一个 Profile'));
        hasIssues = true;
      }
    } catch (err) {
      console.log(chalk.red('  读取 Profiles 目录失败'));
      hasIssues = true;
    }
  }

  // 检查激活的 profile
  const { getActiveProfile } = await import('../core/profile.js');
  const activeProfile = await getActiveProfile();
  if (activeProfile) {
    console.log(`✓ 当前激活 Profile: ${activeProfile}`);
  } else {
    console.log(`⚠ 当前激活 Profile: (无)`);
    hasIssues = true;
  }

  // 检查 Claude settings.json
  const claudeSettingsPath = path.join(os.homedir(), '.claude', 'settings.json');
  const claudeSettingsExists = await fileExists(claudeSettingsPath);
  console.log(`${claudeSettingsExists ? '✓' : '✗'} Claude Code settings: ${claudeSettingsPath}`);

  // 检查 OpenCode opencode.json
  const opencodeConfigPath = path.join(os.homedir(), '.config', 'opencode', 'opencode.json');
  const opencodeOpenCodeExists = await fileExists(opencodeConfigPath);
  console.log(`${opencodeOpenCodeExists ? '✓' : '✗'} OpenCode 配置: ${opencodeConfigPath}`);

  // 总结
  console.log();
  if (hasIssues) {
    console.log(chalk.red.bold('发现一些问题，请根据上述提示修复'));
  } else {
    console.log(chalk.green.bold('所有检查通过！'));
  }
  console.log();
}
