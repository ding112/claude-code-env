# Phase 7: Source Template 实现 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-01
**Phase:** 07-source-template
**Areas discussed:** 编辑流程方式, API Key 处理, Source Template 编辑关联, 验证策略

---

## Gray Area 1: 阶段归属

用户需求「provider 编辑时不再需要输入 apikey」不在现有 ROADMAP 中。

| Option | Description | Selected |
|--------|-------------|----------|
| 作为新阶段 (Phase 10) | 添加到 roadmap 按新阶段流程走 | |
| 归入现有阶段 Phase 7 | 作为 Phase 7 增强功能 | ✓ |
| 直接实现 | 不经过 GSD 流程，直接改代码 | |

**User's choice:** 归入 Phase 7

---

## Gray Area 2: 编辑流程方式

| Option | Description | Selected |
|--------|-------------|----------|
| 交互式表单 | 像 provider add 一样用 inquirer 展示所有字段，当前值作为默认值 | ✓ |
| 保留 JSON 编辑 | 保留外部编辑器编辑 JSON 的方式，验证放宽 | |

**User's choice:** 交互式表单

---

## Gray Area 3: API Key 处理方式

| Option | Description | Selected |
|--------|-------------|----------|
| 预填当前值 | apiKey 字段默认显示当前值，用户按 Enter 保留 | |
| 跳过 API Key | 编辑时不显示 apiKey 字段，自动保留旧值 | |
| 掩码 + 修改选项 | 显示掩码 + 询问是否要修改 | ✓ |

**User's choice:** 掩码 + 修改选项

---

## Gray Area 4: Source Template 在编辑中的应用

| Option | Description | Selected |
|--------|-------------|----------|
| 不应用模板 | 仅保留现有数据作为默认值，不涉及模板逻辑 | ✓ |
| 应用模板作为备选 | 加载模板但默认值优先使用现有数据 | |

**User's choice:** 不应用模板（与 WUI-10 一致）

---

## Gray Area 5: 验证策略

| Option | Description | Selected |
|--------|-------------|----------|
| 流程内处理 | 编辑命令中自动处理 apiKey，validateProvider 保持不变 | ✓ |
| 放宽验证 | 创建单独的 validateProviderForEdit() | |

**User's choice:** 流程内处理

---

## Claude's Discretion

No areas deferred to Claude discretion.

## Deferred Ideas

None.

---

*Discussion log: 2026-05-01*
