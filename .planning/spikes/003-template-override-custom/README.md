---
spike: 003
name: template-override-custom
type: standard
validates: "Given 用户选择 'custom' source 或修改模板值，当提交时，模板不影响最终保存的 provider 数据"
verdict: VALIDATED
related: [001, 002]
tags: [provider, template, isolation, override]
---

# Spike 003: 模板仅用于预填 — 数据隔离验证

## What This Validates

模板作用域仅限于表单初始预填。用户修改/确认后的最终数据不包含任何模板痕迹。

## How to Run

```bash
npx ts-node .planning/spikes/003-template-override-custom/spike.ts
```

## Results

**Verdict: VALIDATED ✓**

所有 4 项验证通过：

| 测试 | 结果 |
|------|------|
| 全字段覆盖 | ✓ 模板值不渗入最终结果 |
| 部分覆盖字段独立性 | ✓ 仅覆盖字段受影响 |
| Custom source 空值 | ✓ 不留默认值 |
| 函数纯正性 | ✓ 多次调用独立 |

**核心结论:** `createProviderFromTemplate()` 是纯函数，模板仅在表单预填阶段使用。
