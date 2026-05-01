# cce - Provider Source Template

## What This Is

cce (claude-code-env) 是一个 TypeScript CLI 工具，用于管理多个 Claude API 配置文件，通过 Provider-Profile 架构切换不同 API 端点。

**v1.3 (Phases 7-9):** 实现完整的 Provider Source Template 功能体系 — CLI 模板预填（Phase 7）+ WebUI 模板集成（Phase 8）+ 模板配置独立化（Phase 9）。当用户选择已知 Source（DeepSeek, OpenAI, Anthropic 等）时自动填充 baseURL 和常用模型列表，减少手动输入负担。模板仅用于表单预填，不污染最终保存的数据。

## Core Value

Provider Source Template — 让用户添加 Provider 时无需手动记忆和输入各 Source 的 baseURL 和模型列表，通过模板自动预填默认值，同时保留完全覆盖的能力。

## Requirements

### Validated

- ✅ Provider CRUD 操作 — 现有
- ✅ Profile CRUD 操作 — 现有
- ✅ Provider-Profile 架构与配置切换 — 现有
- ✅ WebUI Provider 管理 — 现有
- ✅ Provider Vendor/Source 字段 — v1.0
- ✅ Claude Code 高级设置 — 现有
- ✅ TypeScript 类型 VendorType → SourceType 重命名 — v1.0
- ✅ Provider 接口 vendor → source 字段重命名 — v1.0
- ✅ CLI 命令 vendor → source 参数和提示重命名 — v1.0
- ✅ WebUI vendor → source 字段和提示重命名 — v1.0
- ✅ 用户输出 "Vendor" / "供应商" → "Source" / "来源" — v1.0
- ✅ 读取旧 provider JSON 时兼容 vendor 字段并自动映射为 source — v1.0
- ✅ 写入 provider JSON 时使用新 source 字段并删除旧 vendor — v1.0
- ✅ Spike 001: Source Template 数据模型 — VALIDATED
- ✅ Spike 002: Template 与 Provider Add 表单集成 — VALIDATED
- ✅ Spike 003: 模板仅用于预填 — 数据隔离验证 — VALIDATED
- ✅ CLI Provider Add/Edit Source 模板自动预填 — Phase 7
- ✅ WebUI Source 模板自动预填（后端 API + 前端动态加载 + 预填高亮 + 脏字段检测） — Phase 8


- ✅ WebUI Source 下拉框改为 API 动态获取 — Phase 8
- ✅ 模板内容提取为独立 JSON 配置（双层架构：内置 + 用户覆盖） — Phase 9
- ✅ Source Template 数据模型定义（`SourceTemplate` 接口 + 7 个模板） — Phase 7
- ✅ CLI Provider Add 模板自动预填 — Phase 7
- ✅ CLI Provider Edit 交互式表单替代外部编辑器 — Phase 7
- ✅ 数据隔离：模板仅用于表单预填，不污染保存数据 — Phase 7

### Out of Scope

- 修改 `ProviderType`（openai-compatible / anthropic-compatible / custom）— 不同的概念，不在本次范围
- 修改 Profile 结构 — Profile 不包含 vendor/source 字段
- 修改 Claude Code 或 OpenCode 生成的配置格式 — 不影响
- WebUI 模板功能 — 在 Phase 8 中已实现（原规划仅在 CLI 实现）
- 配置单元测试框架 — 项目当前零测试覆盖，待后续考虑

## Context

### v1.0 (shipped)
Vendor → Source 重命名完成，7 个文件修改，106 行插入，85 行删除。

### v1.3 (shipped)
Phases 7-9 在 2026-05-01 同一天完成，合并为一个统一里程碑：

- **Phase 7**: Source Template 数据模型 + CLI 表单集成 + Provider Edit 交互式增强
- **Phase 8**: WebUI Source 模板自动预填（后端 API + 前端动态加载 + 预填高亮 + 脏字段检测）
- **Phase 9**: 模板内容提取为独立 JSON 配置（内置 JSON + 用户覆盖 JSON 双层架构）

Tech stack: TypeScript, Commander, Express, CommonJS.

## Constraints

- **Tech stack**: TypeScript, Commander, Express, CommonJS (`.js` 扩展名导入)
- **零新依赖**: 基于已验证的 Spike 结论，无需引入新依赖
- **兼容性**: 不破坏现有 Provider/Profile 数据结构
- **模板隔离**: 模板仅用于表单预填阶段，最终保存数据无模板痕迹

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 旧文件自动迁移 | 读取时检测 `vendor` 字段并自动转为 `source`，保存时写入新字段 | ✅ v1.0 实现并验证 |
| 破坏性 API 变更 | CLI 参数 `--vendor` 改为 `--source`，WebUI API 字段名同步变更 | ✅ v1.0 实现并验证 |
| 迁移模式 | 读取仅做内存映射（`data.source ?? data.vendor`），写入时统一 `source` 并删除 `vendor` | ✅ 避免读取路径写副作用 |
| WebUI 双读兼容 | API 同时接受 `vendor` 和 `source` 字段（`source` 优先），响应只返回 `source` | ✅ 前后端版本兼容 |
| 模板仅用于预填 | `createProviderFromTemplate()` 模板提供默认值，用户覆盖层合并 | ✅ Spike 003 验证 |
| Custom 不留默认值 | Custom source 模板故意留空所有字段，让验证器强制用户填写 | ✅ Spike 001 验证 |
| API Key 不预设 | 模板不包含 API Key，始终强制用户输入 | ✅ Spike 001 验证 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone:**
1. Full review of all sections
2. Core Value check — still correct
3. Audit Out of Scope — reasons still valid
4. Update Context with current state

---
*Last updated: 2026-05-01 — v1.3 milestone (Phases 7-9) completed, full PROJECT.md review*
*Next milestone: TBD*
*Note: Issue #159 rebranding (badge-vendor CSS class) and test framework setup remain deferred.*
