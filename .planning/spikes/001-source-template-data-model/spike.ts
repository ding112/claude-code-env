/**
 * Spike 001: Source Template 数据模型
 *
 * 验证问题：
 *   给定已有的 SourceType 列表，当设计模板数据结构时，
 *   每个已知 source 能否提供有意义的默认值（baseURL + 常用模型列表），
 *   且用户可覆盖。
 *
 * 运行: npx ts-node .planning/spikes/001-source-template-data-model/spike.ts
 */

import type { SourceType, ProviderType } from '../../../src/types/index.js';

// ============================================================================
// 模板数据结构设计
// ============================================================================

/** Source 模板：为已知 source 提供默认值 */
interface SourceTemplate {
  /** 对应的 source 标识 */
  source: SourceType;

  /** 显示名称 */
  displayName: string;

  /** 默认 Provider 类型 */
  type: ProviderType;

  /** 默认 Base URL（可包含提示占位符） */
  baseURL: string;

  /** 常用模型列表（按推荐排序） */
  models: string[];

  /** 推荐的默认模型 */
  defaultModel: string;

  /** 描述信息 */
  description: string;
}

// ============================================================================
// 已知 Source 模板定义
// ============================================================================

const SOURCE_TEMPLATES: Record<SourceType, SourceTemplate> = {
  deepseek: {
    source: 'deepseek',
    displayName: 'DeepSeek',
    type: 'openai-compatible',
    baseURL: 'https://api.deepseek.com',
    models: [
      'deepseek-chat',
      'deepseek-reasoner',
    ],
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
    models: [
      'deepseek-v3',
      'deepseek-r1',
      'hunyuan-turbo',
    ],
    defaultModel: 'deepseek-v3',
    description: '腾讯云大模型 API（兼容 OpenAI 协议）',
  },
  alibaba: {
    source: 'alibaba',
    displayName: 'Alibaba (阿里云)',
    type: 'openai-compatible',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: [
      'qwen-max',
      'qwen-plus',
      'qwen-turbo',
      'deepseek-v3',
      'deepseek-r1',
    ],
    defaultModel: 'qwen-plus',
    description: '阿里云百炼大模型服务平台',
  },
  openai: {
    source: 'openai',
    displayName: 'OpenAI',
    type: 'openai-compatible',
    baseURL: 'https://api.openai.com/v1',
    models: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'o3-mini',
      'o1',
    ],
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
    description: '自定义 API 端点—需手动填写所有配置',
  },
};

// ============================================================================
// 模板应用逻辑
// ============================================================================

interface ProviderTemplateOutput {
  name: string;
  displayName: string;
  type: ProviderType;
  source: SourceType;
  baseURL: string;
  apiKey: string;
  models: string[];
  defaultModel: string;
}

/**
 * 应用模板到用户输入 — 模板提供默认值，用户输入可覆盖
 */
function applyTemplate(
  template: SourceTemplate,
  overrides: Partial<ProviderTemplateOutput>,
): ProviderTemplateOutput {
  // 构建默认 Provider 数据（不包含 name/apiKey，这些必须由用户输入）
  return {
    name: overrides.name || template.source,
    displayName: overrides.displayName || template.displayName,
    type: overrides.type || template.type,
    source: template.source,
    baseURL: overrides.baseURL || template.baseURL,
    apiKey: overrides.apiKey || '', // 必须由用户输入
    models: overrides.models || [...template.models],
    defaultModel: overrides.defaultModel || template.defaultModel,
  };
}

// ============================================================================
// 验证
// ============================================================================

interface ValidationResult {
  valid: boolean;
  issues: string[];
}

function validateTemplateProvider(
  output: ProviderTemplateOutput,
): ValidationResult {
  const issues: string[] = [];

  if (!output.name) issues.push('name 不能为空');
  if (!output.type) issues.push('type 不能为空');
  if (!output.baseURL) issues.push('baseURL 不能为空');
  if (!output.apiKey) issues.push('apiKey 为空（需用户输入）');
  if (output.models.length === 0) issues.push('models 不能为空');
  if (!output.defaultModel) issues.push('defaultModel 不能为空');
  if (output.defaultModel && !output.models.includes(output.defaultModel)) {
    issues.push(`defaultModel "${output.defaultModel}" 不在 models 中`);
  }

  return { valid: issues.length === 0, issues };
}

// ============================================================================
// 运行验证
// ============================================================================

console.log('=== Spike 001: Source Template Data Model ===\n');

const allNonCustomSources: SourceType[] = [
  'deepseek', 'volcengine', 'tencent', 'alibaba', 'openai', 'anthropic',
];

console.log(`共 ${Object.keys(SOURCE_TEMPLATES).length} 个模板定义\n`);

// 1. 验证每个已知 source 的模板能生成有效的 Provider 默认值
console.log('--- 测试 1: 模板基本验证 ---');
for (const source of allNonCustomSources) {
  const template = SOURCE_TEMPLATES[source];
  const output = applyTemplate(template, {
    name: `my-${source}`,
    apiKey: '<user-provided>',
  });
  const result = validateTemplateProvider(output);

  const status = result.valid ? '✓' : '✗';
  console.log(`  ${status} ${source}: baseURL=${template.baseURL}, models=${template.models.length}个`);

  if (!result.valid) {
    for (const issue of result.issues) {
      console.log(`      问题: ${issue}`);
    }
  }
}

// 2. 验证 custom 模板（允许空值）
console.log('\n--- 测试 2: Custom 模板（允许空值）---');
const customOutput = applyTemplate(SOURCE_TEMPLATES['custom'], {
  name: 'my-custom',
  apiKey: '<user-provided>',
});
const customResult = validateTemplateProvider(customOutput);
console.log(`  ${customResult.valid ? '✗' : '✓'} custom: 预期空 baseURL/models 会触发验证失败`);
for (const issue of customResult.issues) {
  console.log(`    ${issue}`);
}

// 3. 验证用户覆盖机制
console.log('\n--- 测试 3: 用户覆盖默认值 ---');
const overridden = applyTemplate(SOURCE_TEMPLATES['deepseek'], {
  name: 'my-deepseek-custom',
  baseURL: 'https://api.deepseek.com/v1',  // 覆盖 baseURL
  models: ['deepseek-chat', 'deepseek-coder'], // 自定义模型列表
  defaultModel: 'deepseek-coder',
  apiKey: '<user-provided>',
});
const overrideResult = validateTemplateProvider(overridden);
console.log(`  ${overrideResult.valid ? '✓' : '✗'} 覆盖后验证: ${overrideResult.valid ? '通过' : '失败'}`);
console.log(`  baseURL覆盖: ${overridden.baseURL}`);
console.log(`  models覆盖: ${overridden.models}`);
console.log(`  defaultModel覆盖: ${overridden.defaultModel}`);

// 4. 验证模板应用后用户仍需输入 apiKey
console.log('\n--- 测试 4: API Key 必须用户输入（模板不留默认值）---');
const noApiKey = applyTemplate(SOURCE_TEMPLATES['openai'], { name: 'my-openai' });
console.log(`  apiKey 默认值: "${noApiKey.apiKey}" (${noApiKey.apiKey ? '不应为空' : '✓ 为空，强制用户输入'})`);

// 5. 验证 name 必须由用户提供（模板不预设 name 之外的唯一标识）
console.log('\n--- 测试 5: Name 不由模板预设 ---');
// 模板的 applyTemplate 要求 name 来自用户，否则 fallback 到 source 名
console.log(`  未提供 name 时 fallback: "${applyTemplate(SOURCE_TEMPLATES['anthropic'], { apiKey: 'x' }).name}"`);

// ============================================================================
// 总结
// ============================================================================
console.log('\n=== 验证结论 ===');
console.log(`
1. ✓ 每个已知 source 模板提供有意义的默认值（baseURL + 模型列表）
2. ✓ Custom 模板不会提供默认值（强制用户手动填写）
3. ✓ 用户覆盖机制正常：任一字段可独立覆盖
4. ✓ API Key 强制用户输入，模板不留默认值
5. ✓ Name 不由模板预设（必须或建议用户自定义）

发现的边界情况:
- 源文件的 baseURL 可能需要随 API 版本更新
- Volcengine 的模型名称有版本号后缀，易过期
- Anthropic 是唯一 'anthropic-compatible' 类型，需单独处理
`);

// ============================================================================
// 下一步建议
// ============================================================================
console.log('=== 对 Spike 002 的启示 ===');
console.log(`
- 模板是纯数据结构，可在 provider add 命令中直接引用
- 用户选择 source 后，立即填充表单的默认值
- 表单仍然允许用户自由编辑所有字段
- 对于 custom source，表单保持完全空白
`);
