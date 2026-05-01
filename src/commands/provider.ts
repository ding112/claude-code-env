import inquirer from 'inquirer';
import { logger } from '../utils/logger.js';
import { validateName } from '../utils/validation.js';
import type { Provider, SourceType } from '../types/index.js';
import { validSources } from '../types/index.js';
import { getTemplate } from '../core/sourceTemplates.js';
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

// Source 选项映射
const SOURCE_OPTIONS = [
  { name: 'DeepSeek', value: 'deepseek' },
  { name: 'Volcengine', value: 'volcengine' },
  { name: 'Tencent', value: 'tencent' },
  { name: 'Alibaba', value: 'alibaba' },
  { name: 'OpenAI', value: 'openai' },
  { name: 'Anthropic', value: 'anthropic' },
  { name: 'Custom', value: 'custom' },
] as const;

export function sanitizeSourceInput(input: string): SourceType {
  return validSources.includes(input as SourceType) ? (input as SourceType) : 'custom';
}

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
    // ========================================================================
    // Phase 1: 选择 Source，加载模板
    // ========================================================================

    const { source } = await inquirer.prompt([
      {
        type: 'list',
        name: 'source',
        message: '选择来源 (Source) — 模板将自动填充默认值:',
        choices: SOURCE_OPTIONS,
      },
    ]);

    const template = getTemplate(source as SourceType);

    if (template?.description) {
      console.log(`  ${template.description}`);
    }

    // ========================================================================
    // Phase 2: 填写 Provider 配置（模板值作为默认值）
    // ========================================================================

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        message: '选择 Provider 类型:',
        default: template?.type,
        choices: TYPE_OPTIONS,
      },
      {
        type: 'input',
        name: 'name',
        message: '配置名称:',
        validate: (input: string) => {
          const trimmed = input.trim();
          if (!trimmed) return '配置名称不能为空';
          if (trimmed.includes('..') || trimmed.includes('/') || trimmed.includes('\\')) {
            return '配置名称包含非法字符';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'displayName',
        message: '显示名称 (可选):',
        default: template?.displayName,
      },
      {
        type: 'input',
        name: 'baseURL',
        message: 'Base URL:',
        default: template?.baseURL || undefined,
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
        default: (template?.models ?? []).join(', ') || undefined,
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
        default: template?.defaultModel || undefined,
        validate: (input: string) => {
          if (!input.trim()) return '默认模型不能为空';
          return true;
        },
      },
    ]);

    const models = answers.models.split(',').map((m: string) => m.trim()).filter((m: string) => m);

    if (!models.includes(answers.defaultModel)) {
      console.log(`  ⚠ 默认模型 "${answers.defaultModel}" 不在可用模型列表中，已自动添加`);
      models.push(answers.defaultModel);
    }

    const provider: Provider = {
      name: answers.name.trim(),
      displayName: answers.displayName?.trim() || answers.name.trim(),
      type: getProviderTypeFromValue(answers.type),
      source: sanitizeSourceInput(source),
      baseURL: answers.baseURL,
      apiKey: answers.apiKey,
      models,
      defaultModel: answers.defaultModel,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveProvider(provider);

    console.log(`✔ Provider '${provider.name}' 已创建`);
    console.log(`  显示名称: ${provider.displayName}`);
    console.log(`  类型: ${provider.type}`);
    console.log(`  Source: ${provider.source}`);
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
      console.log('使用 `cce provider add` 添加一个新的 Provider');
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
      if (provider.source) {
        console.log(`    Source: ${provider.source}`);
      }
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
    if (provider.source) {
      console.log(`  Source: ${provider.source}`);
    }
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

    // 显示当前 Provider 摘要
    console.log();
    console.log(`┌─ 当前 Provider ─────────────────────────────┐`);
    console.log(`  Name:        ${provider.name}`);
    console.log(`  Source:      ${provider.source}`);
    console.log(`  Type:        ${provider.type}`);
    console.log(`  Base URL:    ${provider.baseURL}`);
    console.log(`  API Key:     ${maskApiKey(provider.apiKey)}`);
    console.log(`  Models (${provider.models.length}):  ${provider.models.join(', ')}`);
    console.log(`  Default:     ${provider.defaultModel}`);
    console.log(`└─────────────────────────────────────────────┘`);
    console.log();

    // 交互式表单编辑（所有字段预填当前值作为默认值）
    interface EditAnswers {
      type: string;
      displayName: string;
      baseURL: string;
      modifyApiKey: boolean;
      apiKey: string;
      models: string;
      defaultModel: string;
    }

    const answers = await inquirer.prompt<EditAnswers>([
      {
        type: 'list',
        name: 'type',
        message: '选择 Provider 类型:',
        default: provider.type,
        choices: TYPE_OPTIONS,
      },
      {
        type: 'input',
        name: 'displayName',
        message: '显示名称 (可选):',
        default: provider.displayName,
      },
      {
        type: 'input',
        name: 'baseURL',
        message: 'Base URL:',
        default: provider.baseURL,
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
        type: 'confirm',
        name: 'modifyApiKey',
        message: '是否修改 API Key?',
        default: false,
      },
      {
        type: 'password',
        name: 'apiKey',
        message: 'API Key:',
        mask: '*',
        when: (answers: EditAnswers) => answers.modifyApiKey,
        validate: (input: string) => {
          if (!input.trim()) return 'API Key 不能为空';
          return true;
        },
      },
      {
        type: 'input',
        name: 'models',
        message: '可用模型 (用逗号分隔):',
        default: provider.models.join(', '),
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
        default: provider.defaultModel,
        validate: (input: string) => {
          if (!input.trim()) return '默认模型不能为空';
          return true;
        },
      },
    ]);

    // 处理 API Key：用户未修改时保留旧值
    const apiKey = answers.modifyApiKey ? answers.apiKey : provider.apiKey;

    // 解析 models
    const models = answers.models.split(',').map((m: string) => m.trim()).filter((m: string) => m);

    if (!models.includes(answers.defaultModel)) {
      console.log(`  ⚠ 默认模型 "${answers.defaultModel}" 不在可用模型列表中，已自动添加`);
      models.push(answers.defaultModel);
    }

    // 构建更新的 Provider 对象
    const updatedProvider: Provider = {
      ...provider,
      type: getProviderTypeFromValue(answers.type),
      displayName: answers.displayName?.trim() || provider.name,
      baseURL: answers.baseURL,
      apiKey,
      models,
      defaultModel: answers.defaultModel,
      updatedAt: new Date().toISOString(),
    };

    await saveProvider(updatedProvider);

    // 显示更新摘要
    console.log();
    console.log(`✓ Provider '${name}' 已更新`);

    // 仅显示有变化的字段
    if (updatedProvider.type !== provider.type) {
      console.log(`  类型: ${provider.type} → ${updatedProvider.type}`);
    }
    if (updatedProvider.displayName !== provider.displayName) {
      console.log(`  显示名称: ${provider.displayName} → ${updatedProvider.displayName}`);
    }
    if (updatedProvider.baseURL !== provider.baseURL) {
      console.log(`  Base URL: ${provider.baseURL} → ${updatedProvider.baseURL}`);
    }
    if (updatedProvider.defaultModel !== provider.defaultModel) {
      console.log(`  默认模型: ${provider.defaultModel} → ${updatedProvider.defaultModel}`);
    }
    if (apiKey !== provider.apiKey) {
      console.log(`  API Key: 已更新`);
    }

    process.exit(0);
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
