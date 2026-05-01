# Phase 7: Source Template 实现 — Context

**Gathered:** 2026-05-01
**Status:** Ready for planning (updated with Provider Edit enhancement)

<domain>
## Phase Boundary

### Original Scope (Completed)
实现 Provider Source Template 功能：当用户通过 `cce provider add` 选择已知 Source（DeepSeek, OpenAI 等）时，自动填充 baseURL、常用模型列表和 defaultModel 等默认值，减少手动输入负担。模板仅用于表单预填，不污染最终保存的 provider 数据。

- 创建 `src/core/sourceTemplates.ts` — 模板定义与查询函数
- 修改 `src/commands/provider.ts` — 将交互拆为两阶段：选 Source → 加载模板 → 填配置
- 无需新依赖、新类型

### Enhancement (New)
改进 `cce provider edit` 命令的编辑体验：将外部编辑器 JSON 编辑方式改为交互式 inquirer 表单（类似 `provider add`），编辑时无需重新输入 API Key。

- 修改 `src/commands/provider.ts` — `providerEditCommand()` 改用 inquirer 表单
- API Key 以掩码形式展示，可选择是否修改
- 不涉及 Source Template 逻辑（编辑模式不应用模板）
- 不修改 `validateProvider()`
</domain>

<decisions>
## Implementation Decisions

### 编辑流程
- **D-01**: 将 `providerEditCommand()` 从外部编辑器 JSON 编辑改为交互式 inquirer 表单（和 `provider add` 风格一致）
- **D-02**: 所有字段以当前值预填为 `default`，用户按 Enter 即可保留
- **D-03**: 先展示当前 Provider 摘要信息，然后逐字段编辑

### API Key 处理
- **D-04**: API Key 字段显示掩码（`maskApiKey()` 格式，如 `sk-****abcd`），同时提供一个选项「是否要修改 API Key？」
- **D-05**: 如果用户选择「不修改」，自动使用旧值填充后再保存
- **D-06**: 如果用户选择「修改」，展示空输入框要求输入新 API Key

### Source Template 与编辑的关系
- **D-07**: 编辑模式不应用 Source Template 预填（与 WUI-10 一致）
- **D-08**: 默认值完全来源于当前 Provider 数据，不涉及模板逻辑

### 验证
- **D-09**: 不修改 `validateProvider()` — 它仍然要求 apiKey 必填
- **D-10**: 编辑命令在流程内处理 apiKey：用户不修改时自动填入旧值，确保保存时通过验证

### 实现细节
- **D-11**: 编辑表单字段顺序：type → displayName → baseURL → apiKey（掩码/修改选项）→ models → defaultModel
- **D-12**: name 字段不可编辑（编辑时显示提示，不包含在表单中）
- **D-13**: 编辑完成后显示更新摘要
- **D-14**: 无需修改类型系统（`src/types/index.ts`）

### boundary
- **B-01**: 不涉及 Provider 的 source 字段编辑（创建时确定 source，编辑不修改）
- **B-02**: 不涉及 Profile 或其它命令的修改
- **B-03**: 不涉及 `validateProvider()` 函数的行为变更
</decisions>

<canonical_refs>
## Canonical References

### 相关源码
- `src/commands/provider.ts` — CLI 命令，`providerEditCommand()` 和 `providerAddCommand()` 是主要修改目标
- `src/core/provider.ts` — `validateProvider()` 验证函数，保持不修改
- `src/types/index.ts` — Provider/ProviderType 类型定义

### 里程碑需求
- `.planning/milestones/v1.3-REQUIREMENTS.md` — v1.3 需求定义

### 已有 Phase 7 上下文
- `.planning/phases/07-source-template/07-CONTEXT.md` — 原始 Phase 7 上下文（本文件已包含原始内容）
- `.planning/phases/07-source-template/07-01-PLAN.md` — 原始 Phase 7 计划（已实现并完成）

### 参考命令模式
- `src/commands/provider.ts` `providerAddCommand()` — 交互式表单的参考实现（inquirer 用法、模板预填模式）
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/commands/provider.ts` 中的 `providerAddCommand()` — 完整的 inquirer 表单模式，可直接参考其交互流程和字段顺序
- `src/commands/provider.ts` 中的 `maskApiKey()` — API Key 掩码函数，可直接复用
- `src/core/provider.ts` 中的 `validateProvider()` — 保持不修改，编辑命令在流程内处理验证通过

### Established Patterns
- `providerAddCommand()` 的交互模式（两阶段 + inquirer `default` 预填）可直接在 `providerEditCommand()` 中复用
- 目前的 `providerEditCommand()` 使用外部编辑器 + JSON 读取 + `validateProvider()` + `saveProvider()` 的流程
- 所有字段均有对应的 inquirer prompt 类型（list/input/password）

### Integration Points
- `providerEditCommand()` 函数签名保持 `async function providerEditCommand(name: string)`
- 从 `core/provider.ts` 读取 `getProvider()`，保存时调用 `saveProvider()`
- 路径在 `src/index.ts` 中注册为 `cce provider edit <name>`
</code_context>

<specifics>
## Specific Ideas

- 参考 `providerAddCommand()` 的 inquirer 字段配置和交互风格，降低学习成本
- 编辑表单第一行显示当前 Provider 的摘要（name, type, source, models count, apiKey 掩码）
- `maskApiKey()` 已存在于 `provider.ts` 中，输出格式如 `sk-12345678****abcd`
- 选择修改 API Key 时弹出新密码输入框，确认后使用新值
</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.
</deferred>

---

*Phase: 07-source-template*
*Context gathered: 2026-05-01 (updated with provider edit enhancement)*
