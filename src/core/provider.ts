import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger.js';
import { validateName } from '../utils/validation.js';
import type { Provider, ProviderType, ValidationError } from '../types/index.js';
import { PROVIDERS_DIR, PROFILES_DIR } from './config.js';

// ============================================================================
// Directory Initialization
// ============================================================================

/** 目录安全权限: 0o700 (仅所有者可读写执行) */
const SECURE_DIR_MODE = 0o700;

/** 敏感文件安全权限: 0o600 (仅所有者可读写) */
const SECURE_FILE_MODE = 0o600;

async function ensureProvidersDir(): Promise<void> {
  try {
    await fs.mkdir(PROVIDERS_DIR, { recursive: true, mode: SECURE_DIR_MODE });
  } catch (err) {
    logger.error('创建 providers 目录失败', err);
    throw err;
  }
}

// ============================================================================
// Provider Validation
// ============================================================================

export function validateProvider(data: Partial<Provider>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    errors.push({ field: 'name', message: 'Provider name 不能为空' });
  }

  if (!data.displayName || typeof data.displayName !== 'string' || data.displayName.trim() === '') {
    errors.push({ field: 'displayName', message: 'Provider display name 不能为空' });
  }

  const validTypes: ProviderType[] = ['openai-compatible', 'claude-native', 'custom'];
  if (!data.type || !validTypes.includes(data.type as ProviderType)) {
    errors.push({ field: 'type', message: `Provider type 必须是: ${validTypes.join(', ')}` });
  }

  if (!data.baseURL || typeof data.baseURL !== 'string' || data.baseURL.trim() === '') {
    errors.push({ field: 'baseURL', message: 'Base URL 不能为空' });
  }

  if (!data.apiKey || typeof data.apiKey !== 'string' || data.apiKey.trim() === '') {
    errors.push({ field: 'apiKey', message: 'API Key 不能为空' });
  }

  if (!Array.isArray(data.models) || data.models.length === 0) {
    errors.push({ field: 'models', message: 'Models 不能为空数组' });
  } else {
    for (let i = 0; i < data.models.length; i++) {
      if (!data.models[i] || typeof data.models[i] !== 'string' || data.models[i].trim() === '') {
        errors.push({ field: `models[${i}]`, message: `Model ${i} 不能为空` });
      }
    }
  }

  if (!data.defaultModel || typeof data.defaultModel !== 'string' || data.defaultModel.trim() === '') {
    errors.push({ field: 'defaultModel', message: 'Default model 不能为空' });
  } else if (Array.isArray(data.models) && !data.models.includes(data.defaultModel)) {
    errors.push({ field: 'defaultModel', message: 'Default model 必须在 models 列表中' });
  }

  return errors;
}

// ============================================================================
// Provider CRUD Operations
// ============================================================================

export async function listProviders(): Promise<Provider[]> {
  await ensureProvidersDir();

  const providers: Provider[] = [];

  try {
    const files = await fs.readdir(PROVIDERS_DIR);

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const filePath = path.join(PROVIDERS_DIR, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const provider = JSON.parse(content) as Provider;

      const errors = validateProvider(provider);
      if (errors.length > 0) {
        logger.warn(`Provider ${file} 验证失败: ${errors.map(e => e.message).join(', ')}`);
        continue;
      }

      providers.push(provider);
    }
  } catch (err) {
    logger.error('读取 providers 失败', err);
    throw err;
  }

  return providers.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getProvider(name: string): Promise<Provider | null> {
  // 安全验证：防止路径遍历攻击
  const validation = validateName(name, 'Provider');
  if (!validation.valid) {
    logger.warn(validation.error || 'Provider name 无效');
    return null;
  }

  await ensureProvidersDir();

  const filePath = path.join(PROVIDERS_DIR, `${name}.json`);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const provider = JSON.parse(content) as Provider;

    const errors = validateProvider(provider);
    if (errors.length > 0) {
      logger.warn(`Provider ${name} 验证失败: ${errors.map(e => e.message).join(', ')}`);
      return null;
    }

    return provider;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    logger.error(`读取 Provider ${name} 失败`, err);
    throw err;
  }
}

export async function saveProvider(provider: Provider): Promise<void> {
  const errors = validateProvider(provider);
  if (errors.length > 0) {
    const errorMsg = errors.map(e => `${e.field}: ${e.message}`).join('\n');
    throw new Error(`Provider 验证失败:\n${errorMsg}`);
  }

  await ensureProvidersDir();

  const filePath = path.join(PROVIDERS_DIR, `${provider.name}.json`);

  try {
    await fs.writeFile(filePath, JSON.stringify(provider, null, 2), {
      encoding: 'utf-8',
      mode: SECURE_FILE_MODE,
    });
    logger.info(`Provider ${provider.name} 已保存`);
  } catch (err) {
    logger.error(`保存 Provider ${provider.name} 失败`, err);
    throw err;
  }
}

export async function deleteProvider(name: string): Promise<void> {
  // 安全验证：防止路径遍历攻击
  const validation = validateName(name, 'Provider');
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const filePath = path.join(PROVIDERS_DIR, `${name}.json`);

  try {
    await fs.unlink(filePath);
    logger.info(`Provider ${name} 已删除`);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Provider ${name} 不存在`);
    }
    logger.error(`删除 Provider ${name} 失败`, err);
    throw err;
  }
}

export async function providerExists(name: string): Promise<boolean> {
  const provider = await getProvider(name);
  return provider !== null;
}

// ============================================================================
// Provider Usage Tracking
// ============================================================================

export async function isProviderInUse(name: string): Promise<boolean> {
  // 安全验证：防止路径遍历攻击
  const validation = validateName(name, 'Provider');
  if (!validation.valid) {
    return false;
  }

  try {
    const files = await fs.readdir(PROFILES_DIR);

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const filePath = path.join(PROFILES_DIR, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const profile = JSON.parse(content);

      if (profile.provider === name) {
        return true;
      }
    }
  } catch (err) {
    logger.error('检查 Provider 使用情况失败', err);
    throw err;
  }

  return false;
}

export async function getProviderUsage(name: string): Promise<string[]> {
  // 安全验证：防止路径遍历攻击
  const validation = validateName(name, 'Provider');
  if (!validation.valid) {
    return [];
  }

  const usingProfiles: string[] = [];

  try {
    const files = await fs.readdir(PROFILES_DIR);

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const filePath = path.join(PROFILES_DIR, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const profile = JSON.parse(content);

      if (profile.provider === name) {
        usingProfiles.push(profile.name);
      }
    }
  } catch (err) {
    logger.error('获取 Provider 使用情况失败', err);
    throw err;
  }

  return usingProfiles.sort();
}
