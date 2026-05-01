import fs from 'fs';
import type { SourceType, ProviderType } from '../types/index.js';
import { validSources } from '../types/index.js';
import { SOURCES_USER_FILE } from './config.js';
import { logger } from '../utils/logger.js';
import builtinSources from './sources.json';

// ============================================================================
// Source Template 定义
// ============================================================================

export interface SourceTemplate {
  source: SourceType;
  displayName: string;
  type: ProviderType;
  baseURL: string;
  models: string[];
  defaultModel: string;
  description: string;
}

// ============================================================================
// 内置模板（编译期加载）
// ============================================================================

const BUILTIN_SOURCES = builtinSources as unknown as Record<string, SourceTemplate>;

// ============================================================================
// 用户配置加载
// ============================================================================

function isValidSourceTemplate(obj: unknown): obj is SourceTemplate {
  if (!obj || typeof obj !== 'object') return false;
  const t = obj as Record<string, unknown>;
  return (
    typeof t.source === 'string' &&
    typeof t.displayName === 'string' &&
    typeof t.type === 'string' &&
    typeof t.baseURL === 'string' &&
    Array.isArray(t.models) &&
    t.models.every((m: unknown) => typeof m === 'string') &&
    typeof t.defaultModel === 'string' &&
    typeof t.description === 'string'
  );
}

function loadSources(): Record<string, SourceTemplate> {
  try {
    const raw = fs.readFileSync(SOURCES_USER_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    if (
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      Object.entries(parsed).every(
        ([key, val]) =>
          validSources.includes(key as SourceType) &&
          isValidSourceTemplate(val)
      )
    ) {
      return parsed as Record<string, SourceTemplate>;
    }

    logger.warn(
      `用户 sources.json 格式无效，将使用内置模板。路径: ${SOURCES_USER_FILE}`
    );
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      logger.warn(
        `加载用户 sources.json 失败: ${(err as Error).message}，将使用内置模板`
      );
    }
  }

  return { ...BUILTIN_SOURCES };
}

// 模块级缓存（模块加载时执行一次）
const SOURCE_TEMPLATES = loadSources();

// ============================================================================
// Helper 函数
// ============================================================================

export function getTemplate(source: SourceType): SourceTemplate | undefined {
  return SOURCE_TEMPLATES[source];
}

export function getAllTemplates(): [SourceType, SourceTemplate][] {
  return Object.entries(SOURCE_TEMPLATES) as [SourceType, SourceTemplate][];
}
