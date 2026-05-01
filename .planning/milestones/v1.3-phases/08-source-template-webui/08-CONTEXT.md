# Phase 8: Source Template WebUI 集成 — Context

**Gathered:** 2026-05-01
**Status:** Ready for planning

<domain>
## Phase Boundary

将 Source Template 集成到 WebUI 的 Provider 创建/编辑表单中。用户在选择 Source（DeepSeek、火山引擎等）后，自动通过 API 获取模板并预填 baseURL、type、models、defaultModel 等字段，与 CLI 体验保持一致。模板仅用于预填，不污染最终保存的 provider 数据。

- WebUI 后端新增 `GET /api/source-templates` API 端点
- WebUI 前端的 Source 下拉框改为通过 API 动态获取
- 创建/编辑 Provider 时，选择 Source 后自动预填模板值并给视觉反馈
- Custom source 不留默认值，所有字段保持空

</domain>

<decisions>
## Implementation Decisions

### API 端点设计
- **D-01:** 新增单个端点 `GET /api/source-templates`，返回所有 Source 模板列表（包含 displayName、source、type、baseURL、models、defaultModel、description）
- **D-02:** 前端一次性加载全部模板数据，根据用户选择的 source 值在客户端查找对应模板，不额外请求
- **D-03:** API 返回的模板数据不包含敏感信息（模板本身无密钥类字段）

### 预填交互与反馈
- **D-04:** Source 下拉框 change 事件自动触发预填，无需点击「应用模板」按钮
- **D-05:** 预填字段加视觉高亮（绿色边框或背景闪烁），提示用户这些字段已被自动填充
- **D-06:** 显示蓝色提示条「已应用 [Source 名称] 模板」，2-3 秒后自动消失

### 预填与编辑的边界
- **D-07:** 选择新 Source 时，如果有字段被用户修改过，弹出确认框「更换 Source 将重置预填字段，是否继续？」
- **D-08:** 确认后全部重新预填（覆盖所有可预填字段）；取消则保持原 Source 不变
- **D-09:** 编辑模式也触发模板，与创建模式行为一致

### 来源列表同步
- **D-10:** 前端 `ALL_SOURCES` 硬编码改为通过 `GET /api/source-templates` 动态获取
- **D-11:** Source 下拉框选项从 API 返回数据中提取，与 `sourceTemplates.ts` 保持 100% 同步

### 来自 Phase 7 的已有决策
- 模板仅用于预填，不污染保存数据
- Custom source 不留任何默认值，所有字段留空
- API Key 不预设，始终强制用户输入
- 所有字段可独立覆盖修改

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 相关源码
- `src/core/sourceTemplates.ts` — 模板数据模型与查询函数（`getTemplate()` / `getAllTemplates()`）
- `webui/app.js` — 前端单页应用，Provider 表单逻辑（`openProviderModal()` / `submitProviderForm()`）
- `webui/index.html` — Provider 模态表单 HTML 结构（`#provider-modal`）
- `src/core/webuiServer.ts` — Express 服务器，需要新增 API 路由
- `src/types/index.ts` — Provider / SourceType 类型定义

### 先前阶段上下文
- `.planning/phases/07-source-template/07-CONTEXT.md` — Phase 7 的模板决策和实现细节

### Spike 验证
- `.planning/spikes/001-source-template-data-model/README.md` — 数据模型验证
- `.planning/spikes/002-template-integration-ux/README.md` — 表单集成验证
- `.planning/spikes/003-template-override-custom/README.md` — 数据隔离验证

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/core/sourceTemplates.ts` — `getAllTemplates()` 直接返回所有模板，后端路由可直接调用
- `webui/app.js` — `openProviderModal()` 当前硬编码 ALL_SOURCES，需改为 API 加载

### Established Patterns
- WebUI 为纯 HTML/CSS/JS SPA，无构建步骤、无框架依赖
- 后端 REST API 通过 Express 实现，所有 `/api/*` 路由在 `webuiServer.ts` 中集中管理
- Provider 表单使用模态框（`#provider-modal`），CRUD 操作均通过模态表单完成
- 验证逻辑前后端分离：前端 JS 验证 + 后端 `webuiServer.ts` 验证

### Integration Points
- 后端：在 `webuiServer.ts` 新增 `GET /api/source-templates` 路由，调用 `getAllTemplates()`
- 前端：Source 下拉框 (`#provider-source`) 的 change 事件需要绑定模板预填逻辑
- 预填字段：`#provider-type`、`#provider-base-url`、`#provider-models`、`#provider-default-model`
- 前端硬编码 `ALL_SOURCES` 需替换为 API 获取的动态数据

</code_context>

<specifics>
## Specific Ideas

- Custom source 模板的类型固定为 `openai-compatible`，其他字段留空
- Anthropic 是唯一 `anthropic-compatible` 类型 source，切换时需同步 type 字段
- 预填高亮使用 CSS 动画（闪绿色边框），不影响表单验证状态
- 提示条复用现有的 `success-toast` / `error-toast` 样式

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 08-source-template-webui*
*Context gathered: 2026-05-01*
