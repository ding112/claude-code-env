# Phase 9: 模板内容提取为独立配置 — Context

**Gathered:** 2026-05-01
**Status:** Ready for planning

<domain>
## Phase Boundary

将 `src/core/sourceTemplates.ts` 中硬编码的模板数据提取为独立的 JSON 配置文件（`sources.json`）。`sourceTemplates.ts` 保留 `SourceTemplate` 类型定义和查询函数（`getTemplate()` / `getAllTemplates()`），但模板数据从外部 JSON 文件加载。

- 创建 `src/core/sources.json` — 所有 Source 模板的 JSON 定义（内置默认模板）
- 支持 `~/.config/cce/sources.json` 用户自定义覆盖
- `getTemplate()` / `getAllTemplates()` 改为从 JSON 文件加载数据
- 保持与现有 `SourceTemplate` 接口完全兼容
- 不影响 WebUI 的 `GET /api/source-templates` API（Phase 8）
- 不影响 CLI 的模板集成逻辑（Phase 7）

</domain>

<decisions>
## Implementation Decisions

### 配置文件格式
- **D-01:** 使用 JSON 格式存储模板数据，零新依赖，Node.js 原生支持
- **D-02:** 所有 Source 模板放在一个 `sources.json` 文件中，与现有 `Record<SourceType, SourceTemplate>` 结构一一对应

### 文件位置与加载优先级
- **D-03:** 双层架构 — 内置默认模板 + 用户可选覆盖
  - 默认位置: `src/core/sources.json`（随代码发布）
  - 用户覆盖: `~/.config/cce/sources.json`（cce init 时可自动生成）
- **D-04:** 加载优先级: 优先加载 `~/.config/cce/sources.json`，不存在则回退到内置的 `src/core/sources.json`
- **D-05:** 用户的 `sources.json` 完全覆盖内置文件（不做合并），避免数据冲突

### 模板数据迁移
- **D-06:** 将 `sourceTemplates.ts` 中 `SOURCE_TEMPLATES` 常量的完整数据原样迁移到 `sources.json`，不修改任何模板值
- **D-07:** `sourceTemplates.ts` 精简为仅保留类型导入 + JSON 加载函数

### 与现有系统的兼容性
- `getTemplate(source)` — 行为不变，从 JSON 数据中查找返回
- `getAllTemplates()` — 行为不变，返回全部模板
- WebUI API（Phase 8 的 `GET /api/source-templates`）— 无影响，仍调用 `getAllTemplates()`
- CLI 模板集成（Phase 7 的 `providerAddCommand`）— 无影响，仍调用 `getTemplate()`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 相关源码
- `src/core/sourceTemplates.ts` — 需重构：保留类型定义和查询函数，移除硬编码数据
- `src/core/sources.json` — 新文件，存储所有 Source 模板的 JSON 数据
- `src/core/config.ts` — 配置路径常量（是否需要添加 CONFIG_DIR 下 sources.json 的路径）
- `src/core/provider.ts` — 验证模板数据是否与此保持一致

### 先前阶段上下文
- `.planning/phases/07-source-template/07-CONTEXT.md` — Phase 7 的模板实现决策
- `.planning/phases/08-source-template-webui/08-CONTEXT.md` — Phase 8 WebUI API 决策

### Spike 验证
- `.planning/spikes/001-source-template-data-model/README.md` — 模板数据模型
- `.planning/spikes/003-template-override-custom/README.md` — 数据隔离验证

</canonical_refs>

<code_context>
## Existing Code Insights

### 需要改动的文件
- `src/core/sourceTemplates.ts` — 核心：移除 SOURCE_TEMPLATES 常量，改为 JSON 加载
- `src/core/sources.json` — 新建：所有模板数据的 JSON 文件
- `src/core/config.ts` — 可能：添加 sources.json 路径常量（若项目规范要求）

### 需要测试的边界
- 用户 `sources.json` 格式错误时的降级行为
- Custom source 在 JSON 中的表示（空 baseURL、空 models 列表）
- 新旧模板加载路径的向后兼容

### 加载方案选项（留给 planner 决定）
- 构建期：使用 TypeScript `resolveJsonModule` 通过 `import` 导入 JSON
- 运行期：使用 `fs.readFileSync` + `JSON.parse` 从文件系统加载
- 推荐：`import` 方式简单可靠，但如需运行时动态加载用户配置则需要 `fs` 方式

</code_context>

<specifics>
## Specific Ideas

- JSON 结构与 TypeScript `Record<SourceType, SourceTemplate>` 完全对应，保持 schema 简单
- Custom source 的 JSON 表示: `"custom": { "source": "custom", "displayName": "自定义", "type": "openai-compatible", "baseURL": "", "models": [], "defaultModel": "", "description": "..." }`
- 内置 `sources.json` 不需要额外的 schema 验证（代码内保证正确性），但用户提供的文件需要运行时验证

</specifics>

<deferred>
## Deferred Ideas

- **用户自定义模板扩展** — 添加新 Source 类型的能力不在本阶段范围，属于未来功能
- **模板编辑 CLI 命令** — 通过 `cce source edit` 编辑 sources.json 不在本阶段范围

</deferred>

---

*Phase: 09-template-config-extract*
*Context gathered: 2026-05-01*
