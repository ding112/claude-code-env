---
phase: 07-source-template
plan: 02
subsystem: cli
tags: [provider, edit, inquirer, api-key-mask]

requires:
  - phase: 07-01
    provides: sourceTemplates.ts、providerAddCommand() 交互模式参考

provides:
  - providerEditCommand() 交互式表单替代外部编辑器编辑
  - API Key 掩码显示 + 确认修改流程
  - 编辑摘要显示有变化的字段

affects: []

tech-stack:
  added: []
  removed:
    - open (外部编辑器依赖, 不再需要)
  patterns:
    - "Edit 与 Add 一致的 inquirer 交互风格"
    - "API Key 掩码 + 确认修改模式"
    - "编辑后仅显示有变化的字段摘要"

key-files:
  created: []
  modified:
    - src/commands/provider.ts

key-decisions:
  - "编辑模式不应用 Source Template（D-07）"
  - "API Key 掩码显示 + confirm 询问是否修改（D-04/D-05/D-06）"
  - "name 字段不可编辑（D-12）"
  - "不修改 validateProvider()（D-09）"
  - "编辑字段顺序：type → displayName → baseURL → apiKey → models → defaultModel（D-11）"

requirements-completed: []

duration: 20min
completed: 2026-05-01
---

# Phase 07 Plan 02: Provider Edit Interactive Enhancement Summary

**将 `cce provider edit` 从外部编辑器 JSON 编辑改为 inquirer 交互式表单，API Key 掩码显示 + 确认修改模式**

## Performance

- **Duration:** 20 min
- **Started:** 2026-05-01T08:30:00Z
- **Completed:** 2026-05-01T08:50:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- 完全重写 `providerEditCommand()`，用 inquirer 交互式表单替代外部编辑器编辑
- 编辑时先显示当前 Provider 摘要（name, source, type, baseURL, apiKey 掩码, models, defaultModel）
- 所有字段预填当前值作为 default，Enter 即可保留
- API Key 特殊处理：掩码显示 + `confirm` 询问「是否修改 API Key?」
- 选择「是」→ password 输入框；选择「否」→ 自动保留旧值
- 编辑完成后仅显示有变化的字段摘要（类型不变时不显示，减少信息噪声）
- 移除外部编辑器关联代码（open, 临时文件读写, SECURE_FILE_MODE）
- name 字段不在表单中，确保不可编辑

## Task Commits

Implemented as part of the 07-02+08-01 merged workflow:

1. **Task 1: 重写 providerEditCommand() 为交互式表单** — included in merge commit `d25c2c6`

## Files Modified

- `src/commands/provider.ts` — `providerEditCommand()` 完整重写：移除 open 导入、移除临时文件逻辑、新增 inquirer 表单、新增 Provider 摘要展示、新增 API Key 确认修改流程、新增变化字段摘要输出

## Decisions Made

- 编辑模式不应用 Source Template，默认值完全来源于当前 Provider 数据
- API Key 处理设计：看不到当前值（安全），但通过掩码和确认流程降低认知负担
- 仅在 API Key 变更时才在摘要中显示「已更新」
- 无状态差异：保留 `...provider` 展开保证 createdAt 等字段不受影响
- 不修改 `validateProvider()` — 编辑命令在流程内处理 apiKey 验证

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None — 实现顺利，与 08-01 开发流程合并提交。

## User Setup Required

None — 无需额外配置，不再依赖外部编辑器环境变量。

## Self-Check: PASSED

- [x] `providerEditCommand()` uses inquirer interactive form
- [x] `open` import removed — no external editor dependency
- [x] Temporary file code removed
- [x] API Key mask display + confirm-to-modify pattern implemented
- [x] Change summary shows only modified fields
- [x] `name` field not in edit form (immutable)
- [x] `tsc --noEmit` — exit code 0

## Next Phase Readiness

- Provider Edit 交互体验与 Provider Add 一致，使用统一的 inquirer 交互模式
- 移除外部编辑器依赖，减少运行时不确定性和安全风险

---
*Phase: 07-source-template*
*Completed: 2026-05-01*
