---
phase: 07-source-template
plan: 01
subsystem: cli
tags: [source-template, typescript, provider, inquirer]

requires:
  - phase: spikes-001-003
    provides: SourceTemplate 数据模型验证、表单集成验证、数据隔离验证

provides:
  - SourceTemplate 接口定义和 7 个模板数据（6 已知 + 1 custom）
  - CLI Provider Add 模板预填（两阶段交互 + inquirer default 属性）
  - 数据隔离（模板仅用于预填，不污染最终保存数据）

affects: [Phase 07-02, Phase 08, Phase 09]

tech-stack:
  added: []
  patterns:
    - "两阶段交互：选 Source → 加载模板 → 填配置"
    - "模板通过 inquirer `default` 属性预填，用户可独立覆盖"
    - "纯函数数据隔离：`getTemplate()` 只读返回模板数据"

key-files:
  created:
    - src/core/sourceTemplates.ts
  modified:
    - src/commands/provider.ts

key-decisions:
  - "模板数据存储为 TypeScript 常量（`SOURCE_TEMPLATES`）"
  - "7 个模板：deepseek, volcengine, tencent, alibaba, openai, anthropic, custom"
  - "Custom source 所有字段留空，强制用户手动填写"
  - "API Key 不预设 default，始终强制用户输入"
  - "Anthropic 是唯一 `anthropic-compatible` 类型 source"

patterns-established:
  - "Provider Add 拆为两阶段交互：先选 source，再填其他配置"
  - "模板通过 `template.field || undefined` 方式处理空值（custom 场景）"
  - "models 逗号分隔字符串 → split/trim/filter 解析模式"

requirements-completed: [TPL-01, TPL-02, TPL-03, TUX-01, TUX-02, TUX-03, TISO-01, TISO-02]

duration: 15min
completed: 2026-05-01
---

# Phase 07 Plan 01: Source Template Implementation Summary

**实现 Provider Source Template 数据模型（SourceTemplate 接口 + 7 个模板）+ CLI Provider Add 两阶段交互集成 + 数据隔离保证**

## Performance

- **Duration:** 15 min
- **Started:** 2026-05-01T08:00:00Z
- **Completed:** 2026-05-01T08:15:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- 创建 `src/core/sourceTemplates.ts`，定义 `SourceTemplate` 接口和 `SOURCE_TEMPLATES` 常量
- 实现 7 个模板: deepseek, volcengine, tencent, alibaba, openai, anthropic, custom
- 导出 `getTemplate(source)` 和 `getAllTemplates()` 纯函数查询接口
- 重构 `providerAddCommand()` 交互流程为两阶段：先选 Source（加载模板），再填配置
- 所有字段使用模板值作为 inquirer `default`，用户可独立覆盖
- Custom source 仅设 type=openai-compatible，其余字段全部留空
- API Key 始终不预设 default，强制用户输入
- 模板仅用于表单预填，不污染最终保存的 provider 数据

## Task Commits

Each task was committed atomically:

1. **Task 1: 创建 Source Template 数据模型** — included in `7638013`
2. **Task 2: 集成模板到 Provider Add 命令** — included in `7638013`

## Files Created/Modified

- `src/core/sourceTemplates.ts` — 新建：SourceTemplate 接口定义、7 个模板常量、getTemplate()/getAllTemplates() 查询函数
- `src/commands/provider.ts` — 修改：引入 getTemplate，拆 providerAddCommand 为两阶段交互，模板值作为 default

## Decisions Made

- 模板存储在 TypeScript 常量中而非 JSON 文件（后续 Phase 9 提取为独立配置）
- inquirer `default` 属性实现预填模式，零额外逻辑
- `custom` 模板故意全部留空，通过 validator 强制手动填写
- Anthropic 特殊处理：其 type 为 `anthropic-compatible`，需正确映射

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None — 所有任务顺利完成，编译零错误。

## User Setup Required

None.

## Self-Check: PASSED

- [x] `src/core/sourceTemplates.ts` — exists, defines `SourceTemplate` interface and 7 templates
- [x] `src/commands/provider.ts` — imports `getTemplate` from sourceTemplates.js
- [x] `getTemplate('deepseek').baseURL === 'https://api.deepseek.com'` — verified
- [x] `getTemplate('anthropic').type === 'anthropic-compatible'` — verified
- [x] `getTemplate('custom').baseURL === ''` and `.models.length === 0` — verified
- [x] `getAllTemplates().length === 7` — verified
- [x] `tsc --noEmit` — exit code 0

## Next Phase Readiness

- Source Template 数据模型就绪，供 Phase 07-02（Edit 增强）和 Phase 08（WebUI）使用
- 模板数据在 Phase 9 中将提取为独立 JSON 配置

---
*Phase: 07-source-template*
*Completed: 2026-05-01*
