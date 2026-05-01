---
spike: 002
name: template-integration-ux
type: standard
validates: "Given provider add 命令的交互式表单，当用户选择 source 后，表单字段能自动填充模板默认值，且在提交前可编辑"
verdict: VALIDATED
related: [001]
tags: [provider, template, ux, form-integration]
---

# Spike 002: Template 与 Provider Add 表单集成

## What This Validates

验证模板数据能否直接集成到 `provider add` 命令的 inquirer 交互流程中，使表单自动预填来自模板的默认值。

## How to Run

```bash
npx ts-node .planning/spikes/002-template-integration-ux/spike.ts
```

## Investigation Trail

1. 设计 `applyTemplate()` / `createProviderFromTemplate()` API — 模板 + 用户覆盖 → 最终配置
2. 验证 3 个典型场景：直接使用模板、部分覆盖、custom source 全手动填写
3. 分析集成前后代码变更量

## Results

**Verdict: VALIDATED ✓**

| 场景 | 结果 |
|------|------|
| 直接使用模板默认值 | ✓ 全部字段正确预填 |
| 部分覆盖模型 | ✓ 仅覆盖字段受影响 |
| Custom source | ✓ 全手动填写，模板不留值 |

**关键发现:**
- 集成方式：只需在 inquirer prompt 中给 baseURL/models/defaultModel 加 `default` 字段
- 变更量：约 20 行（`src/commands/provider.ts`）
- 无需新依赖、新类型
- 兼容现有 validation 逻辑
