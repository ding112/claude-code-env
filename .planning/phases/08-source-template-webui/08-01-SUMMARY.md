---
phase: 08-source-template-webui
plan: 01
subsystem: api, ui
tags: [webui, source-template, express, css-animation]

requires:
  - phase: 07-source-template
    provides: sourceTemplates.ts with getAllTemplates() / getTemplate()

provides:
  - GET /api/source-templates 后端端点
  - WebUI Source 下拉框动态 API 加载
  - 模板预填 + 绿色高亮动画 + info toast
  - 脏字段检测 + 切换确认框
  - Custom source 不预设 + API Key 不预设

affects: [future phases that consume template endpoints]

tech-stack:
  added: []
  patterns:
    - 前端动态加载 Source 模板，不依赖硬编码
    - 模板预填绿色高亮动画（CSS @keyframes + class toggle）
    - 脏字段对比检测：记录 lastPrefilledValues，切换时 diff

key-files:
  created: []
  modified:
    - src/core/webuiServer.ts
    - webui/index.html
    - webui/styles.css
    - webui/app.js

key-decisions:
  - "单端点 GET /api/source-templates 返回全部模板，前端一次性加载"
  - "编辑模式也触发模板预填（D-09 优先于 WUI-10）"
  - "前端 SOURCE_DISPLAY_NAMES 硬编码改为通过 API 动态获取"
  - "API Key 和 Custom source 均不预设（与 CLI 行为一致）"

patterns-established:
  - "模板预填字段使用 .template-filled CSS class 驱动绿色边框动画"
  - "脏字段检测通过对比当前值与 lastPrefilledValues 实现"
  - "info toast 复用已有 toast 系统模式，新增 showInfo()"

requirements-completed: [WUI-01, WUI-03, WUI-04, WUI-05, WUI-06, WUI-07, WUI-08, WUI-09]

duration: 23min
completed: 2026-05-01
---

# Phase 08 Plan 01: Source Template WebUI Integration Summary

**WebUI 集成 Source Template：GET /api/source-templates 端点 + 前端动态 Source 加载 + 自动预填 type/baseURL/models/defaultModel + 绿色高亮动画 + info toast + 脏字段检测确认框**

## Performance

- **Duration:** 23 min
- **Started:** 2026-05-01T09:19:15Z
- **Completed:** 2026-05-01T09:42:14Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- 新增 `GET /api/source-templates` 后端路由，返回 7 个已知 Source 的模板（含 source/displayName/type/baseURL/models/defaultModel/description）
- 删除前端 `ALL_SOURCES` 和 `SOURCE_DISPLAY_NAMES` 硬编码，Source 下拉框通过 API 动态加载
- 选择 Source 后自动预填 type/baseURL/models/defaultModel/模型下拉，绿色边框闪烁动画
- 预填后蓝色 info toast 显示「已应用 [Source 名称] 模板」，2.5 秒后自动消失
- 用户修改预填字段后切换 Source，弹出 `confirm()` 确认框询问是否继续
- Custom source 仅设 type=openai-compatible，其余字段清空
- API Key 始终不被模板触及，留空由用户输入
- 编辑模式打开 Provider 表单时同样触发模板预填（D-09 决策）
- 修复：为 `api-key-required-mark` 添加 HTML 元素，防止 JS null 引用（Rule 1）

## Task Commits

Each task was committed atomically:

1. **Task 1: 新增 GET /api/source-templates 后端端点 + info toast HTML + 高亮 CSS** - `a1fa577` (feat)
2. **Task 2: 前端 Source 动态加载 + 模板预填逻辑** - `ee4b201` (feat)

## Files Created/Modified

- `src/core/webuiServer.ts` - 新增 `getAllTemplates` 导入和 `GET /api/source-templates` 路由
- `webui/index.html` - 新增 info-toast 元素和 api-key-required-mark 标签
- `webui/styles.css` - 新增 `.toast.info` 样式、`@keyframes template-highlight` 和 `.template-filled` 动画
- `webui/app.js` - 删除硬编码 ALL_SOURCES/SOURCE_DISPLAY_NAMES；新增 loadSourceTemplates/applySourceTemplate/arePrefilledFieldsDirty/showInfo/updateProviderSourceOptions 重写/openProviderModal 重写/Source change 事件绑定

## Decisions Made

- 单端点 `GET /api/source-templates` 返回全部模板，前端一次性加载并缓存到 `sourceTemplates[]` 数组
- 编辑模式也触发模板预填 — Source 下拉框 change 事件统一处理两种模式
- API Key 编辑模式下移除 `required` 属性，对应 `*` 标记通过 `api-key-required-mark` span 控制显隐

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 添加 api-key-required-mark span 防止 JS null 引用**
- **Found during:** Task 2 (openProviderModal 重写)
- **Issue:** Plan 中 openProviderModal 引用 `document.getElementById('api-key-required-mark')`，但 HTML 中 label 的 `*` 是纯文本，无对应 DOM 元素。调用时将抛出 TypeError。
- **Fix:** 将 HTML 中 `label for="provider-api-key"` 的 `*` 包裹在 `<span id="api-key-required-mark">*</span>` 中
- **Files modified:** webui/index.html
- **Verification:** `document.getElementById('api-key-required-mark')` 不再返回 null
- **Committed in:** ee4b201 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** 修复防止运行时崩溃，不影响其他功能。无范围扩展。

## Issues Encountered

- 无 — 计划执行顺利，tsc --noEmit 全程通过

## User Setup Required

None — 无外部服务配置变更。

## Next Phase Readiness

- Source Template WebUI 集成完成
- 前端和后端均已支持模板预填，与 CLI 体验一致
- `src/core/sourceTemplates.ts` 中的模板数据可在 Phase 9 中提取为独立 JSON 配置

---
*Phase: 08-source-template-webui*
*Completed: 2026-05-01*

## Self-Check: PASSED

- [x] `src/core/webuiServer.ts` — exists, contains `getAllTemplates` and `/api/source-templates` route
- [x] `webui/index.html` — exists, contains `info-toast` and `api-key-required-mark` elements
- [x] `webui/styles.css` — exists, contains `.toast.info`, `@keyframes template-highlight`, and `.template-filled`
- [x] `webui/app.js` — exists, `ALL_SOURCES` and `SOURCE_DISPLAY_NAMES` removed, contains `applySourceTemplate`, `arePrefilledFieldsDirty`, `showInfo`
- [x] `08-01-SUMMARY.md` — exists
- [x] Commit `a1fa577` — Task 1
- [x] Commit `ee4b201` — Task 2
- [x] `tsc --noEmit` — exit code 0
