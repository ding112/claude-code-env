---
spike: 001
name: source-template-data-model
type: standard
validates: "Given 已有的 SourceType 列表，当我设计模板数据结构时，则每个已知 source 都能提供有意义的默认值（baseURL + 常用模型列表），且用户可覆盖"
verdict: VALIDATED
related: []
tags: [provider, template, source, data-model]
---

# Spike 001: Source Template 数据模型

## What This Validates

Given 已有的 `SourceType` 列表（deepseek, volcengine, tencent, alibaba, openai, anthropic, custom），当设计模板数据结构时，则每个已知 source 都能提供有意义的默认值（baseURL + 常用模型列表），且用户可覆盖任何字段。

## Research

基于现有代码分析：
- `src/types/index.ts` 已定义 `SourceType`、`ProviderType` 和 `Provider` 接口
- `src/commands/provider.ts` 中使用 `inquirer` 实现交互式表单
- 模板需与现有 `Provider` 接口兼容（模板输出是 `Provider` 的子集）

## How to Run

```bash
npx ts-node .planning/spikes/001-source-template-data-model/spike.ts
```

## Investigation Trail

1. 设计了 `SourceTemplate` 接口：包含 source, displayName, type, baseURL, models, defaultModel, description
2. 实现了 7 个 source 模板（6 个已知 + 1 个 custom）
3. 实现 `applyTemplate()` 函数 — 模板提供默认值，用户覆盖层合并
4. 运行 5 项验证测试（基本验证、custom 空值、覆盖机制、API key 强制、name 处理）

## Results

**Verdict: VALIDATED ✓**

所有 5 项测试通过：

| 测试 | 结果 |
|------|------|
| 6 个已知 source 的基础验证 | ✓ 全部通过 |
| Custom source 空值触发验证失败 | ✓ 符合预期 |
| 用户覆盖机制 | ✓ 任意字段可独立覆盖 |
| API Key 不预设默认值 | ✓ 强制用户输入 |
| Name 不由模板预设 | ✓ 需由用户提供 |

**边界情况发现:**
- Volcengine 和 Tencent 的 baseURL/model 名称含版本号，需要维护
- Anthropic 是唯一 `anthropic-compatible` 类型 source，需特殊处理 type 默认值
- Custom source 的模板故意留空所有字段，让验证器强制用户填写
