import fs from 'fs/promises';
import path from 'path';

/** 目录安全权限: 0o700 (仅所有者可读写执行) */
const SECURE_DIR_MODE = 0o700;

/** 敏感文件安全权限: 0o600 (仅所有者可读写) */
const SECURE_FILE_MODE = 0o600;

/**
 * 创建安全目录，仅所有者可访问
 * @param dir - 目录路径
 */
export async function ensureSecureDir(dir: string): Promise<void> {
  try {
    await fs.mkdir(dir, { recursive: true, mode: SECURE_DIR_MODE });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw err;
    }
  }
}

/**
 * 写入敏感文件，仅所有者可读写
 * @param filePath - 文件路径
 * @param data - 要写入的数据
 */
export async function writeSecureFile(filePath: string, data: unknown): Promise<void> {
  await ensureSecureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), {
    encoding: 'utf-8',
    mode: SECURE_FILE_MODE,
  });
}

/**
 * 写入敏感文本文件，仅所有者可读写
 * @param filePath - 文件路径
 * @param content - 文件内容
 */
export async function writeSecureTextFile(filePath: string, content: string): Promise<void> {
  await ensureSecureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, {
    encoding: 'utf-8',
    mode: SECURE_FILE_MODE,
  });
}

/**
 * 创建目录（兼容旧接口）
 * @param dir - 目录路径
 */
export async function ensureDir(dir: string): Promise<void> {
  await ensureSecureDir(dir);
}

export async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export async function writeJson(filePath: string, data: unknown): Promise<void> {
  await writeSecureFile(filePath, data);
}

export async function readFile(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  await writeSecureTextFile(filePath, content);
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function removeFile(filePath: string): Promise<void> {
  await fs.unlink(filePath);
}