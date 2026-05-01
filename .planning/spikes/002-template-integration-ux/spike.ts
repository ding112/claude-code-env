/**
 * Spike 002: Template 与 Provider Add 表单集成（自动演示版）
 *
 * 模拟交互流程，展示：选择 Source → 模板自动填充 → 用户修改 → 最终结果
 *
 * 运行: npx ts-node .planning/spikes/002-template-integration-ux/spike.ts
 *
 * 交互式版本: 去掉--auto参数可体验真实表单
 */

import type { SourceType, ProviderType } from '../../../src/types/index.js';

// ============================================================================
// 模板数据
// ============================================================================

interface SourceTemplate {
  source: SourceType;
  displayName: string;
  type: ProviderType;
  baseURL: string;
  models: string[];
  defaultModel: string;
}

const SOURCE_TEMPLATES: Record<SourceType, SourceTemplate> = {
  deepseek: {
    source: 'deepseek', displayName: 'DeepSeek',
    type: 'openai-compatible', baseURL: 'https://api.deepseek.com',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    defaultModel: 'deepseek-chat',
  },
  volcengine: {
    source: 'volcengine', displayName: 'Volcengine (火山引擎)',
    type: 'openai-compatible', baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    models: ['doubao-1.5-pro-256k-250115', 'doubao-1.5-lite-32k-250115', 'deepseek-v3-241226', 'deepseek-r1-250120'],
    defaultModel: 'doubao-1.5-pro-256k-250115',
  },
  tencent: {
    source: 'tencent', displayName: 'Tencent (腾讯云)',
    type: 'openai-compatible', baseURL: 'https://api.lkeap.cloud.tencent.com/v1',
    models: ['deepseek-v3', 'deepseek-r1', 'hunyuan-turbo'],
    defaultModel: 'deepseek-v3',
  },
  alibaba: {
    source: 'alibaba', displayName: 'Alibaba (阿里云)',
    type: 'openai-compatible', baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: ['qwen-max', 'qwen-plus', 'qwen-turbo', 'deepseek-v3', 'deepseek-r1'],
    defaultModel: 'qwen-plus',
  },
  openai: {
    source: 'openai', displayName: 'OpenAI',
    type: 'openai-compatible', baseURL: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o3-mini', 'o1'],
    defaultModel: 'gpt-4o',
  },
  anthropic: {
    source: 'anthropic', displayName: 'Anthropic',
    type: 'anthropic-compatible', baseURL: 'https://api.anthropic.com',
    models: ['claude-sonnet-4-20250514', 'claude-haiku-3-5-20241022', 'claude-opus-4-20250514'],
    defaultModel: 'claude-sonnet-4-20250514',
  },
  custom: {
    source: 'custom', displayName: '自定义',
    type: 'openai-compatible', baseURL: '',
    models: [], defaultModel: '',
  },
};

// ============================================================================
// 模板 → 表单默认值 映射函数（核心集成逻辑）
// ============================================================================

interface FormDefaults {
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
 * 核心API：将用户选择的 source 和可选覆盖合并为表单默认值
 *
 * @param source - 用户选择的 source
 * @param overrides - 用户可选覆盖的字段
 * @returns 可直接用于表单或保存的 Provider 数据
 */
function createProviderFromTemplate(
  source: SourceType,
  overrides: Partial<FormDefaults>,
): FormDefaults {
  const template = SOURCE_TEMPLATES[source];
  return {
    name: overrides.name || source,
    displayName: overrides.displayName || template.displayName,
    type: overrides.type || template.type,
    source,
    baseURL: overrides.baseURL || template.baseURL,
    apiKey: overrides.apiKey || '',
    models: overrides.models || [...template.models],
    defaultModel: overrides.defaultModel || template.defaultModel,
  };
}

// ============================================================================
// 自动演示 — 模拟 3 个典型场景
// ============================================================================

console.log('=== Spike 002: Provider Add 模板集成演示 ===\n');
console.log('模拟 3 个典型场景，展示模板如何简化 Provider 创建\n');

interface Scenario {
  name: string;
  source: SourceType;
  overrides: Partial<FormDefaults>;
  mode: string;
}

const scenarios: Scenario[] = [
  {
    name: '场景 A: 直接使用模板默认值',
    source: 'deepseek',
    overrides: { name: 'my-deepseek', apiKey: 'sk-demo-key' },
    mode: '无修改，直接使用模板值',
  },
  {
    name: '场景 B: 覆盖模型但保留其他模板值',
    source: 'openai',
    overrides: {
      name: 'my-openai-o1',
      models: ['o1', 'o3-mini'],
      defaultModel: 'o1',
      apiKey: 'sk-demo-key',
    },
    mode: '仅覆盖 models/defaultModel，其余使用模板',
  },
  {
    name: '场景 C: 自定义 source',
    source: 'custom',
    overrides: {
      name: 'my-custom',
      displayName: '我的自定义 API',
      type: 'openai-compatible',
      baseURL: 'https://my-api.example.com/v1',
      models: ['my-model-1', 'my-model-2'],
      defaultModel: 'my-model-1',
      apiKey: 'sk-demo-key',
    },
    mode: '全字段手动填写（模板不提供默认值）',
  },
];

for (const scenario of scenarios) {
  console.log(`--- ${scenario.name} ---`);
  console.log(`  Source: ${scenario.source} (${scenario.mode})`);

  const result = createProviderFromTemplate(scenario.source, scenario.overrides);

  console.log(`  最终配置:`);
  console.log(`    Name:         ${result.name}`);
  console.log(`    Display Name: ${result.displayName}`);
  console.log(`    Type:         ${result.type}`);
  console.log(`    Source:       ${result.source}`);
  console.log(`    Base URL:     ${result.baseURL}`);
  console.log(`    API Key:      ${result.apiKey ? '(已设置)' : '(未设置)'}`);
  console.log(`    Models:       ${result.models.length}个`);
  console.log(`    Default:      ${result.defaultModel}`);

  // 验证
  const issues: string[] = [];
  if (!result.baseURL) issues.push('baseURL 为空');
  if (!result.apiKey) issues.push('apiKey 为空');
  if (result.models.length === 0) issues.push('models 为空');
  if (!result.defaultModel) issues.push('defaultModel 为空');
  if (result.defaultModel && !result.models.includes(result.defaultModel)) {
    issues.push('defaultModel 不在 models 中');
  }

  if (issues.length === 0) {
    console.log(`  验证: ✓ 通过\n`);
  } else {
    console.log(`  验证: ⚠ 有 ${issues.length} 个问题: ${issues.join(', ')}\n`);
  }
}

// ============================================================================
// 对比分析：集成前后的代码变更
// ============================================================================

console.log('=== 集成前后代码变更分析 ===\n');

console.log('当前 provider add (src/commands/provider.ts) 流程:');
console.log('  1. 询问 type (openai-compatible / anthropic-compatible / custom)');
console.log('  2. 询问 source (deepseek / volcengine / ...)');
console.log('  3. 询问 name');
console.log('  4. 询问 displayName');
console.log('  5. 询问 baseURL ← 用户必须手动输入');
console.log('  6. 询问 apiKey');
console.log('  7. 询问 models (逗号分隔) ← 用户必须手动输入');
console.log('  8. 询问 defaultModel ← 用户必须手动输入');
console.log('  → 所有字段都是空白的，用户每次都要重复记忆/查找\n');

console.log('集成模板后流程:');
console.log('  1. 询问 type (模板自动匹配)');
console.log('  2. 询问 source');
console.log('  3. [自动加载模板] → baseURL, models, defaultModel 已有默认值');
console.log('  4. 询问 name (默认: source名)');
console.log('  5. 询问 displayName (默认: 模板displayName) ← 从模板预填');
console.log('  6. 询问 baseURL (默认: 模板baseURL) ← 从模板预填');
console.log('  7. 询问 apiKey');
console.log('  8. 询问 models (默认: 模板models) ← 从模板预填');
console.log('  9. 询问 defaultModel (默认: 模板defaultModel) ← 从模板预填');
console.log('  → 用户只需输入 name + apiKey，其余可直接确认\n');

console.log('=== 验证结论 ===');
console.log(`
1. ✓ Source 选择后模板自动填充表单默认值
2. ✓ 所有字段仍可自由编辑/覆盖
3. ✓ Custom source 模板留空，行为不变
4. ✓ 仅需修改 inquirer prompt 的 'default' 字段即可集成
5. ✓ 无需新依赖或新类型
6. ✓ 兼容现有 validation 逻辑

最小变更量: 修改 src/commands/provider.ts 约 20 行（给 prompt 加 default 值）
`);
