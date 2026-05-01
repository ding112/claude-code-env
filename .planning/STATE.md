---
gsd_state_version: 1.0
milestone: v1.5
milestone_name: Template Config Extract
status: planned
last_updated: "2026-05-01T09:11:20.201Z"
last_activity: 2026-05-01 — Phase 9 planned (1 plan)
progress:
  total_phases: 1
  completed_phases: 0
  total_plans: 1
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-01)

**Core value:** Provider Source Template — 当用户通过 `cce provider add` 添加 Provider 时，选择已知 Source 后自动填充 baseURL 和常用模型列表，减少手动输入负担
**Current focus:** Phase 9 — 模板内容提取为独立配置 (已规划)

## Current Position

Milestone: v1.5 — Template Config Extract
Status: 🔄 PLANNED (Phase 9, 1/1 plan)
Phases: 1 (Phase 9)
Last activity: 2026-05-01 — Phase 9 planned (1 plan)

Progress: [          ] 0% (planned, not yet executed)

## Performance Metrics

**Velocity:**

- Total plans completed: 7 (6 v1.0 + 1 v1.3)
- Total execution time: 1 day
- Files modified (v1.0): 7 (106 insertions, 85 deletions)
- Files added (v1.3): 1 new file (sourceTemplates.ts) + 1 modified (provider.ts)

**By Phase:**

| Phase | Milestone | Plans | Status |
|-------|-----------|-------|--------|
| 1. 类型定义重命名 | v1.0 | 1 | Complete |
| 2. 核心业务层与迁移逻辑 | v1.0 | 1 | Complete |
| 3. CLI 命令层修改 | v1.0 | 1 | Complete |
| 4. WebUI 后端 API 修改 | v1.0 | 1 | Complete |
| 5. WebUI 前端修改 | v1.0 | 1 | Complete |
| 6. 全局验证 | v1.0 | 1 | Complete |
| 7. Source Template 实现 | v1.3 | 1 | Complete |
| 8. Source Template WebUI 集成 | v1.4 | 0 | Discussing |
| 9. 模板内容提取为独立配置 | v1.5 | 1 | Planned |

## Accumulated Context

### Decisions

**v1.0 Decisions (Vendor → Source 重命名):**

- 迁移模式：读取仅做内存映射（`data.source ?? data.vendor`），写入时统一 `source` 并删除 `vendor`
- WebUI API 双读兼容：同时接受 `vendor` 和 `source` 字段，`source` 优先

**v1.3 Decisions (Provider Source Template):**

- 模板数据结构需与现有 `Provider` 接口兼容（来自 Spike 001）
- 模板仅用于表单预填，不污染最终保存的 provider 数据（来自 Spike 003）
- Custom source 不留任何默认值，强制用户手动填写
- 每个字段均可独立覆盖/修改
- 无需引入新依赖
- API Key 始终强制用户输入（模板不预设）

**v1.4 Decisions (Source Template WebUI):**

- 单端点 `GET /api/source-templates` 返回全部模板，前端一次性加载
- Source 选择后自动实时预填 + 高亮预填字段 + 提示条
- 切换 Source 时若字段有修改则弹出确认框，确认后全部重新预填
- 编辑模式也触发模板预填
- 前端 `ALL_SOURCES` 硬编码改为通过 API 动态获取

**v1.5 Decisions (Template Config Extract):**

- JSON 格式存储模板数据，零新依赖
- 双层架构：内置 `src/core/sources.json` + 用户覆盖 `~/.config/cce/sources.json`
- 所有 Source 模板放在一个 JSON 文件中
- 用户配置完全覆盖内置文件（不做合并）
- `getTemplate()` / `getAllTemplates()` 行为不变，改为从 JSON 加载
- 内置模板使用 TypeScript `resolveJsonModule` 编译期导入加载
- 用户配置使用 `fs.readFileSync` + `JSON.parse` 运行时加载
- 格式无效时自动回退到内置并记录警告

### Pending Todos

- （无）

### Blockers/Concerns

None.

## Deferred Items

| Category | Item | Status |
|----------|------|--------|
| frontend | webui/app.js CSS class `badge-vendor` 未重命名 | cosmetic |
| testing | 项目尚未配置测试框架 | known gap |

## Session Continuity

Last session: 2026-05-01T09:11:20.197Z
Current state: Phase 9 planned, ready for execution.
