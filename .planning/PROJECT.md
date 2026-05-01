# cce - Vendor → Source 重命名

## What This Is

cce (claude-code-env) 是一个 TypeScript CLI 工具，用于管理多个 Claude API 配置文件，通过 Provider-Profile 架构切换不同 API 端点。本次工作是将 Provider 中的 `vendor` / `VendorType` 字段全面重命名为 `source` / `SourceType`，使术语更准确地表达"配置来源"的含义。

## Core Value

将 `vendor` 重命名为 `source`，让字段名更准确地反映"配置来源"的语义，同时保持对旧数据文件的自动迁移兼容。

## Requirements

### Validated

- ✓ Provider CRUD 操作 — 现有
- ✓ Profile CRUD 操作 — 现有
- ✓ Provider-Profile 架构与配置切换 — 现有
- ✓ WebUI Provider 管理 — 现有
- ✓ Provider Vendor 字段 — 现有 (PR #8)
- ✓ Claude Code 高级设置 — 现有 (PR #8)

### Active

- [ ] 将 TypeScript 类型中 `VendorType` 重命名为 `SourceType`
- [ ] 将 Provider 接口中 `vendor` 字段重命名为 `source`
- [ ] 将 CLI 命令中 `vendor` 相关参数和提示改为 `source`
- [ ] 将 WebUI 中 `vendor` 相关字段和提示改为 `source`
- [ ] 将用户输出中所有 "Vendor" / "供应商" 文本改为 "Source" / "来源"
- [ ] 读取旧 provider JSON 时兼容 `vendor` 字段，自动迁移为 `source`
- [ ] 写入 provider JSON 时使用新的 `source` 字段

### Out of Scope

- 修改 `ProviderType`（openai-compatible / anthropic-compatible / custom）— 这是不同的概念，不在本次范围
- 修改 Profile 结构 — Profile 不包含 vendor/source 字段
- 修改 Claude Code 或 OpenCode 生成的配置格式 — 这些是输出格式，不受影响

## Context

- PR #8 引入了 `VendorType` 和 `vendor` 字段，用于标识 Provider 的供应商（如 volcengine、deepseek、openai、custom）
- 当前 `vendor` 出现在：类型定义、Provider 核心 CRUD、CLI 命令交互、WebUI API 和前端
- 已有 Provider 类型迁移机制（`migrateProviderType`），可参考其模式实现 vendor → source 的迁移
- 用户存储的 provider JSON 文件可能包含旧的 `vendor` 字段，需要自动迁移

## Constraints

- **Tech stack**: TypeScript, Commander, Express, CommonJS (`.js` 扩展名导入)
- **兼容性**: 必须自动迁移旧 `vendor` 字段到 `source`，不能破坏现有用户数据
- **测试**: 当前零测试覆盖，但重命名本身是低风险操作

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 旧文件自动迁移 | 读取时检测 `vendor` 字段并自动转为 `source`，保存时写入新字段 | — Pending |
| 破坏性 API 变更 | CLI 参数 `--vendor` 改为 `--source`，WebUI API 字段名同步变更 | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-01 after initialization*
