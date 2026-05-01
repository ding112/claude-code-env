import type { SourceType, ProviderType } from '../types/index.js';

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

const SOURCE_TEMPLATES: Record<SourceType, SourceTemplate> = {
  deepseek: {
    source: 'deepseek',
    displayName: 'DeepSeek',
    type: 'openai-compatible',
    baseURL: 'https://api.deepseek.com',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    defaultModel: 'deepseek-chat',
    description: 'DeepSeek API — 兼容 OpenAI 接口协议',
  },
  volcengine: {
    source: 'volcengine',
    displayName: 'Volcengine (火山引擎)',
    type: 'openai-compatible',
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    models: [
      'doubao-1.5-pro-256k-250115',
      'doubao-1.5-lite-32k-250115',
      'deepseek-v3-241226',
      'deepseek-r1-250120',
    ],
    defaultModel: 'doubao-1.5-pro-256k-250115',
    description: '火山引擎方舟大模型推理 API',
  },
  tencent: {
    source: 'tencent',
    displayName: 'Tencent (腾讯云)',
    type: 'openai-compatible',
    baseURL: 'https://api.lkeap.cloud.tencent.com/v1',
    models: ['deepseek-v3', 'deepseek-r1', 'hunyuan-turbo'],
    defaultModel: 'deepseek-v3',
    description: '腾讯云大模型 API（兼容 OpenAI 协议）',
  },
  alibaba: {
    source: 'alibaba',
    displayName: 'Alibaba (阿里云)',
    type: 'openai-compatible',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: ['qwen-max', 'qwen-plus', 'qwen-turbo', 'deepseek-v3', 'deepseek-r1'],
    defaultModel: 'qwen-plus',
    description: '阿里云百炼大模型服务平台',
  },
  openai: {
    source: 'openai',
    displayName: 'OpenAI',
    type: 'openai-compatible',
    baseURL: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o3-mini', 'o1'],
    defaultModel: 'gpt-4o',
    description: 'OpenAI API',
  },
  anthropic: {
    source: 'anthropic',
    displayName: 'Anthropic',
    type: 'anthropic-compatible',
    baseURL: 'https://api.anthropic.com',
    models: [
      'claude-sonnet-4-20250514',
      'claude-haiku-3-5-20241022',
      'claude-opus-4-20250514',
    ],
    defaultModel: 'claude-sonnet-4-20250514',
    description: 'Anthropic Claude API',
  },
  custom: {
    source: 'custom',
    displayName: '自定义',
    type: 'openai-compatible',
    baseURL: '',
    models: [],
    defaultModel: '',
    description: '自定义 API 端点 — 需手动填写所有配置',
  },
};

// ============================================================================
// Helper 函数
// ============================================================================

export function getTemplate(source: SourceType): SourceTemplate {
  return SOURCE_TEMPLATES[source];
}

export function getAllTemplates(): [SourceType, SourceTemplate][] {
  return Object.entries(SOURCE_TEMPLATES) as [SourceType, SourceTemplate][];
}
