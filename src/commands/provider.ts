import inquirer from 'inquirer';
import open from 'open';
import { logger } from '../utils/logger.js';
import { validateName } from '../utils/validation.js';
import type { Provider } from '../types/index.js';
import {
  listProviders,
  getProvider,
  saveProvider,
  deleteProvider,
  providerExists,
  isProviderInUse,
  getProviderUsage,
} from '../core/provider.js';

// ============================================================================
// 安全权限常量
// ============================================================================

/** 敏感文件安全权限: 0o600 (仅所有者可读写) */
const SECURE_FILE_MODE = 0o600;

// ============================================================================
// Helper Functions
// ============================================================================

function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) return '****';
  return `${apiKey.substring(0, 8)}${'*'.repeat(Math.max(4, apiKey.length - 12))}${apiKey.substring(apiKey.length - 4)}`;
}

// 类型选项映射
const TYPE_OPTIONS = [
  { name: 'OpenAI 接口协议', value: 'openai-compatible' },
  { name: 'Anthropic 接口协议', value: 'anthropic-compatible' },
  { name: '自定义', value: 'custom' },
] as const;

function getProviderTypeFromValue(value: string): 'openai-compatible' | 'anthropic-compatible' | 'custom' {
  const validTypes = ['openai-compatible', 'anthropic-compatible', 'custom'] as const;
  return validTypes.includes(value as typeof validTypes[number])
    ? value as typeof validTypes[number]
    : 'custom';
}

// ============================================================================
// Provider Commands
// ============================================================================

export async function providerAddCommand(): Promise<void> {
  try {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        message: '选择 Provider 类型:',
        choices: TYPE_OPTIONS,
      },
      {
        type: 'input',
        name: 'name',
        message: '配置名称:',
        validate: (input: string) => {
          const trimmed = input.trim();
          if (!trimmed) return '配置名称不能为空';
          // 检查路径遍历字符
          if (trimmed.includes('..') || trimmed.includes('/') || trimmed.includes('\\')) {
            return '配置名称包含非法字符';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'displayName',
        message: '显示名称 (可选，留空则使用配置名称):',
      },
      {
        type: 'input',
        name: 'baseURL',
        message: 'Base URL:',
        validate: (input: string) => {
          if (!input.trim()) return 'Base URL 不能为空';
          try {
            new URL(input);
            return true;
          } catch {
            return 'Base URL 格式不正确';
          }
        },
      },
      {
        type: 'password',
        name: 'apiKey',
        message: 'API Key:',
        mask: '*',
        validate: (input: string) => {
          if (!input.trim()) return 'API Key 不能为空';
          return true;
        },
      },
      {
        type: 'input',
        name: 'models',
        message: '可用模型 (用逗号分隔):',
        validate: (input: string) => {
          const models = input.split(',').map(m => m.trim()).filter(m => m);
          if (models.length === 0) return '至少需要提供一个模型';
          return true;
        },
      },
      {
        type: 'input',
        name: 'defaultModel',
        message: '默认模型:',
        validate: (input: string) => {
          if (!input.trim()) return '默认模型不能为空';
          return true;
        },
      },
    ]);

    const models = answers.models.split(',').map((m: string) => m.trim()).filter((m: string) => m);

    if (!models.includes(answers.defaultModel)) {
      console.log(`⚠ 默认模型 "${answers.defaultModel}" 不在可用模型列表中，已自动添加`);
      models.push(answers.defaultModel);
    }

    const provider: Provider = {
      name: answers.name.trim(),
      displayName: answers.displayName?.trim() || answers.name.trim(),
      type: getProviderTypeFromValue(answers.type),
      baseURL: answers.baseURL,
      apiKey: answers.apiKey,
      models,
      defaultModel: answers.defaultModel,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveProvider(provider);

    console.log(`✓ Provider '${provider.name}' 已创建`);
    console.log(`  显示名称: ${provider.displayName}`);
    console.log(`  类型: ${provider.type}`);
    console.log(`  Base URL: ${provider.baseURL}`);
    console.log(`  模型数: ${provider.models.length}`);
    console.log(`  默认模型: ${provider.defaultModel}`);

    process.exit(0);
  } catch (err) {
    logger.error('创建 Provider 失败', err);
    process.exit(1);
  }
}

export async function providerListCommand(): Promise<void> {
  try {
    const providers = await listProviders();

    if (providers.length === 0) {
      console.log('还没有配置任何 Provider');
      console.log('使用 `cce provider add <type>` 添加一个新的 Provider');
      process.exit(0);
    }

    console.log();
    console.log('Providers:');
    console.log();

    for (const provider of providers) {
      const using = await getProviderUsage(provider.name);
      console.log(`  ${provider.name}`);
      console.log(`    显示名称: ${provider.displayName}`);
      console.log(`    类型: ${provider.type}`);
      console.log(`    Base URL: ${provider.baseURL}`);
      console.log(`    模型 (${provider.models.length}):`);
      for (const model of provider.models) {
        const isDefault = model === provider.defaultModel;
        console.log(`      ${isDefault ? '*' : ' '} ${model}${isDefault ? ' (默认)' : ''}`);
      }
      if (using.length > 0) {
        console.log(`    被 Profile 引用: ${using.join(', ')}`);
      }
      console.log();
    }
  } catch (err) {
    logger.error('列出 Providers 失败', err);
    process.exit(1);
  }
}

export async function providerShowCommand(name: string): Promise<void> {
  try {
    // 安全验证：防止路径遍历攻击
    const validation = validateName(name, 'Provider');
    if (!validation.valid) {
      console.log(`❌ ${validation.error}`);
      process.exit(1);
    }

    const provider = await getProvider(name);

    if (!provider) {
      console.log(`❌ Provider '${name}' 不存在`);
      console.log('使用 `cce provider list` 查看所有可用的 Providers');
      process.exit(1);
    }

    const using = await getProviderUsage(name);

    console.log();
    console.log(`Provider: ${provider.name}`);
    console.log(`  显示名称: ${provider.displayName}`);
    console.log(`  类型: ${provider.type}`);
    console.log(`  Base URL: ${provider.baseURL}`);
    console.log(`  API Key: ${maskApiKey(provider.apiKey)}`);
    console.log();
    console.log(`可用模型 (${provider.models.length}):`);
    for (const model of provider.models) {
      const isDefault = model === provider.defaultModel;
      console.log(`  ${isDefault ? '*' : ' '} ${model}${isDefault ? ' (默认)' : ''}`);
    }
    console.log();
    if (using.length > 0) {
      console.log(`被以下 Profile 引用: ${using.join(', ')}`);
    } else {
      console.log('未被任何 Profile 引用');
    }
  } catch (err) {
    logger.error('查看 Provider 失败', err);
    process.exit(1);
  }
}

export async function providerEditCommand(name: string): Promise<void> {
  try {
    // 安全验证：防止路径遍历攻击
    const validation = validateName(name, 'Provider');
    if (!validation.valid) {
      console.log(`❌ ${validation.error}`);
      process.exit(1);
    }

    const provider = await getProvider(name);

    if (!provider) {
      console.log(`❌ Provider '${name}' 不存在`);
      process.exit(1);
    }

    const { PROVIDERS_DIR } = await import('../core/config.js');
    const path = await import('path');
    const fs = await import('fs/promises');

    const filePath = path.join(PROVIDERS_DIR, `${name}.json`);

    // 写入临时文件供编辑
    const tempContent = JSON.stringify(provider, null, 2);
    const tempPath = `${filePath}.tmp`;

    await fs.writeFile(tempPath, tempContent, {
      encoding: 'utf-8',
      mode: SECURE_FILE_MODE,
    });

    // 打开编辑器
    const editor = process.env.EDITOR || process.env.VISUAL || 'code';
    console.log(`使用编辑器: ${editor}`);
    console.log(`文件: ${tempPath}`);

    try {
      await open(tempPath, { app: { name: editor } });
    } catch (err) {
      console.log('无法打开编辑器，请手动编辑以下内容:');
      console.log(tempContent);
      throw err;
    }

    // 等待用户完成编辑
    console.log('编辑完成后按回车继续...');
    await inquirer.prompt([{ type: 'input', name: 'continue', message: '按回车继续' }]);

    // 读取编辑后的内容
    const editedContent = await fs.readFile(tempPath, 'utf-8');
    const editedProvider = JSON.parse(editedContent);

    // 验证
    const { validateProvider } = await import('../core/provider.js');
    const errors = validateProvider(editedProvider);

    if (errors.length > 0) {
      console.log('❌ 验证失败:');
      for (const error of errors) {
        console.log(`  ${error.field}: ${error.message}`);
      }
      process.exit(1);
    }

    // 保存
    await saveProvider(editedProvider);

    // 清理临时文件
    try {
      await fs.unlink(tempPath);
    } catch {
      // 忽略
    }

    console.log(`✓ Provider '${name}' 已更新`);
  } catch (err) {
    logger.error('编辑 Provider 失败', err);
    process.exit(1);
  }
}

export async function providerRemoveCommand(name: string): Promise<void> {
  try {
    // 安全验证：防止路径遍历攻击
    const validation = validateName(name, 'Provider');
    if (!validation.valid) {
      console.log(`❌ ${validation.error}`);
      process.exit(1);
    }

    const provider = await getProvider(name);

    if (!provider) {
      console.log(`❌ Provider '${name}' 不存在`);
      process.exit(1);
    }

    // 检查是否被使用
    const isUsed = await isProviderInUse(name);

    if (isUsed) {
      const using = await getProviderUsage(name);
      console.log(`❌ Provider '${name}' 正被以下 Profile 使用:`);
      for (const profileName of using) {
        console.log(`  - ${profileName}`);
      }
      console.log('请先删除或修改这些 Profile，然后再删除 Provider');
      process.exit(1);
    }

    // 确认删除
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `确认删除 Provider '${name}' (${provider.displayName})?`,
        default: false,
      },
    ]);

    if (!confirm) {
      console.log('已取消');
      process.exit(0);
    }

    await deleteProvider(name);

    console.log(`✓ Provider '${name}' 已删除`);
  } catch (err) {
    logger.error('删除 Provider 失败', err);
    process.exit(1);
  }
}
