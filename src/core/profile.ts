import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger.js';
import { validateName } from '../utils/validation.js';
import type { Profile, Provider, EffectiveConfig, ValidationError } from '../types/index.js';
import { PROFILES_DIR } from './config.js';

// ============================================================================
// Directory Initialization
// ============================================================================

/** 目录安全权限: 0o700 (仅所有者可读写执行) */
const SECURE_DIR_MODE = 0o700;

/** 敏感文件安全权限: 0o600 (仅所有者可读写) */
const SECURE_FILE_MODE = 0o600;

async function ensureProfilesDir(): Promise<void> {
  try {
    await fs.mkdir(PROFILES_DIR, { recursive: true, mode: SECURE_DIR_MODE });
  } catch (err) {
    logger.error('创建 profiles 目录失败', err);
    throw err;
  }
}

// ============================================================================
// Profile Validation
// ============================================================================

export function validateProfile(
  data: Partial<Profile>,
  availableProviders: string[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    errors.push({ field: 'name', message: 'Profile name 不能为空' });
  }

  if (!data.provider || typeof data.provider !== 'string' || data.provider.trim() === '') {
    errors.push({ field: 'provider', message: 'Provider 不能为空' });
  } else if (!availableProviders.includes(data.provider)) {
    errors.push({
      field: 'provider',
      message: `Provider "${data.provider}" 不存在。可用: ${availableProviders.join(', ') || '无'}`,
    });
  }

  if (data.model !== undefined && typeof data.model !== 'string') {
    errors.push({ field: 'model', message: 'Model 必须是字符串' });
  }

  return errors;
}

// ============================================================================
// Profile CRUD Operations
// ============================================================================

export async function listProfiles(): Promise<Profile[]> {
  await ensureProfilesDir();

  const profiles: Profile[] = [];

  try {
    const files = await fs.readdir(PROFILES_DIR);

    // 获取可用的 providers 用于验证（移到循环外避免重复 I/O）
    const { listProviders } = await import("./provider.js");
    const providers = await listProviders();
    const availableProviderNames = providers.map(p => p.name);

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const filePath = path.join(PROFILES_DIR, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const profile = JSON.parse(content) as Profile;

      // 只支持新格式 profile（必须有 provider 字段）
      if (!profile.provider) {
        continue;
      }

      const errors = validateProfile(profile, availableProviderNames);
      if (errors.length > 0) {
        logger.warn(`Profile ${file} 验证失败: ${errors.map(e => e.message).join(", ")}`);
        continue;
      }

      profiles.push(profile);
    }
  } catch (err) {
    logger.error('读取 profiles 失败', err);
    throw err;
  }

  return profiles.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getProfile(name: string): Promise<Profile | null> {
  // 安全验证：防止路径遍历攻击
  const validation = validateName(name, 'Profile');
  if (!validation.valid) {
    logger.warn(validation.error || 'Profile name 无效');
    return null;
  }

  await ensureProfilesDir();

  const filePath = path.join(PROFILES_DIR, `${name}.json`);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const profile = JSON.parse(content) as Profile;

    // 只支持新格式 profile（必须有 provider 字段）
    if (!profile.provider) {
      logger.warn(`Profile ${name} 缺少 provider 字段，不是新格式`);
      return null;
    }

    return profile;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    logger.error(`读取 Profile ${name} 失败`, err);
    throw err;
  }
}

export async function saveProfile(profile: Profile): Promise<void> {
  // 获取所有可用的 providers 来验证
  const { listProviders } = await import('./provider.js');
  const providers = await listProviders();
  const availableProviderNames = providers.map(p => p.name);

  const errors = validateProfile(profile, availableProviderNames);
  if (errors.length > 0) {
    const errorMsg = errors.map(e => `${e.field}: ${e.message}`).join('\n');
    throw new Error(`Profile 验证失败:\n${errorMsg}`);
  }

  await ensureProfilesDir();

  const filePath = path.join(PROFILES_DIR, `${profile.name}.json`);

  // 设置时间戳
  const now = new Date().toISOString();
  const profileToSave = {
    ...profile,
    updatedAt: now,
  };

  try {
    await fs.writeFile(filePath, JSON.stringify(profileToSave, null, 2), {
      encoding: 'utf-8',
      mode: SECURE_FILE_MODE,
    });
    logger.info(`Profile ${profile.name} 已保存`);
  } catch (err) {
    logger.error(`保存 Profile ${profile.name} 失败`, err);
    throw err;
  }
}

export async function deleteProfile(name: string): Promise<void> {
  // 安全验证：防止路径遍历攻击
  const validation = validateName(name, 'Profile');
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const filePath = path.join(PROFILES_DIR, `${name}.json`);

  try {
    await fs.unlink(filePath);
    logger.info(`Profile ${name} 已删除`);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Profile ${name} 不存在`);
    }
    logger.error(`删除 Profile ${name} 失败`, err);
    throw err;
  }
}

export async function profileExists(name: string): Promise<boolean> {
  const profile = await getProfile(name);
  return profile !== null;
}

// ============================================================================
// Configuration Resolution
// ============================================================================

export function resolveConfig(profile: Profile, provider: Provider): EffectiveConfig {
  const model = profile.model || provider.defaultModel;

  return {
    baseURL: provider.baseURL,
    apiKey: provider.apiKey,
    model,
    providerName: provider.name,
    providerDisplayName: provider.displayName,
    isModelOverridden: !!profile.model,
  };
}

// ============================================================================
// Active Profile Management
// ============================================================================

export async function getActiveProfile(): Promise<string | null> {
  const { ACTIVE_FILE } = await import('./config.js');

  try {
    const content = await fs.readFile(ACTIVE_FILE, 'utf-8');
    const activeName = content.trim();
    return activeName || null;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    logger.error('读取 active profile 失败', err);
    throw err;
  }
}

export async function setActiveProfile(name: string): Promise<void> {
  const { ACTIVE_FILE } = await import('./config.js');

  try {
    await fs.writeFile(ACTIVE_FILE, name, {
      encoding: 'utf-8',
      mode: SECURE_FILE_MODE,
    });
    logger.info(`Active profile 设置为: ${name}`);
  } catch (err) {
    logger.error('设置 active profile 失败', err);
    throw err;
  }
}

export async function clearActiveProfile(): Promise<void> {
  const { ACTIVE_FILE } = await import('./config.js');

  try {
    await fs.unlink(ACTIVE_FILE);
    logger.info('Active profile 已清除');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return;
    }
    logger.error('清除 active profile 失败', err);
    throw err;
  }
}
