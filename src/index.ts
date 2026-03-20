#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { createCommand } from './commands/create.js';
import { useCommand } from './commands/use.js';
import { listCommand } from './commands/list.js';
import { showCommand } from './commands/show.js';
import { editCommand } from './commands/edit.js';
import { removeCommand } from './commands/remove.js';
import { currentCommand } from './commands/current.js';
import { doctorCommand } from './commands/doctor.js';
import {
  providerAddCommand,
  providerListCommand,
  providerShowCommand,
  providerEditCommand,
  providerRemoveCommand,
} from './commands/provider.js';
import { uiCommand } from './commands/ui.js';
import { logger } from './utils/logger.js';

const program = new Command();

program
  .name('cce')
  .description('Claude Code 配置切换工具 (Provider System)')
  .version('1.0.0');

// init 命令
program
  .command('init')
  .description('初始化配置目录')
  .action(async () => {
    try {
      await initCommand();
    } catch (error) {
      logger.error(`初始化失败: ${error}`);
      process.exit(1);
    }
  });

// create 命令
program
  .command('create <name>')
  .description('创建新 Profile')
  .action(async (name: string) => {
    try {
      await createCommand(name);
    } catch (error) {
      logger.error(`创建失败: ${error}`);
      process.exit(1);
    }
  });

// use 命令
program
  .command('use [name]')
  .description('激活指定 Profile（不指定则交互式选择）')
  .action(async (name?: string) => {
    try {
      await useCommand(name);
    } catch (error) {
      logger.error(`启用失败: ${error}`);
      process.exit(1);
    }
  });

// list 命令
program
  .command('list')
  .alias('ls')
  .description('列出所有 Profiles')
  .action(async () => {
    try {
      await listCommand();
    } catch (error) {
      logger.error(`列出配置失败: ${error}`);
      process.exit(1);
    }
  });

// show 命令
program
  .command('show <name>')
  .description('显示指定 Profile 详情')
  .action(async (name: string) => {
    try {
      await showCommand(name);
    } catch (error) {
      logger.error(`显示详情失败: ${error}`);
      process.exit(1);
    }
  });

// edit 命令
program
  .command('edit <name>')
  .description('编辑 Profile')
  .action(async (name: string) => {
    try {
      await editCommand(name);
    } catch (error) {
      logger.error(`编辑失败: ${error}`);
      process.exit(1);
    }
  });

// remove 命令
program
  .command('remove <name>')
  .alias('rm')
  .description('删除 Profile')
  .action(async (name: string) => {
    try {
      await removeCommand(name);
    } catch (error) {
      logger.error(`删除失败: ${error}`);
      process.exit(1);
    }
  });

// current 命令
program
  .command('current')
  .alias('c')
  .description('显示当前激活的 Profile')
  .action(async () => {
    try {
      await currentCommand();
    } catch (error) {
      logger.error(`获取当前配置失败: ${error}`);
      process.exit(1);
    }
  });

// doctor 命令
program
  .command('doctor')
  .description('检查配置是否正确')
  .action(async () => {
    try {
      await doctorCommand();
    } catch (error) {
      logger.error(`诊断失败: ${error}`);
      process.exit(1);
    }
  });

// Provider 命令集 - 使用子命令模式
const providerCmd = program
  .command('provider')
  .description('Provider 管理')
  .action(() => {
    // 无子命令时显示帮助
    console.log('Provider 管理命令:');
    console.log('  provider add <type>    添加新 Provider');
    console.log('  provider list          列出所有 Providers');
    console.log('  provider show <name>   显示 Provider 详情');
    console.log('  provider edit <name>   编辑 Provider');
    console.log('  provider remove <name> 删除 Provider');
  });

providerCmd
  .command('add')
  .description('添加新的 Provider')
  .action(async () => {
    try {
      await providerAddCommand();
    } catch (error) {
      logger.error(`添加 Provider 失败: ${error}`);
      process.exit(1);
    }
  });

providerCmd
  .command('list')
  .description('列出所有 Providers')
  .action(async () => {
    try {
      await providerListCommand();
    } catch (error) {
      logger.error(`列出 Providers 失败: ${error}`);
      process.exit(1);
    }
  });

providerCmd
  .command('show <name>')
  .description('显示 Provider 详情')
  .action(async (name: string) => {
    try {
      await providerShowCommand(name);
    } catch (error) {
      logger.error(`显示 Provider 失败: ${error}`);
      process.exit(1);
    }
  });

providerCmd
  .command('edit <name>')
  .description('编辑 Provider')
  .action(async (name: string) => {
    try {
      await providerEditCommand(name);
    } catch (error) {
      logger.error(`编辑 Provider 失败: ${error}`);
      process.exit(1);
    }
  });

providerCmd
  .command('remove <name>')
  .description('删除 Provider')
  .action(async (name: string) => {
    try {
      await providerRemoveCommand(name);
    } catch (error) {
      logger.error(`删除 Provider 失败: ${error}`);
      process.exit(1);
    }
  });

// ui 命令
program
  .command('ui')
  .description('启动 WebUI 管理界面')
  .option('-p, --port <port>', '指定端口', parseInt)
  .option('--no-open', '不自动打开浏览器')
  .action(async (options) => {
    try {
      await uiCommand(options);
    } catch (error) {
      logger.error(`启动 WebUI 失败: ${error}`);
      process.exit(1);
    }
  });

// 解析命令行参数
program.parse();

// 如果没有提供命令，显示帮助
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
