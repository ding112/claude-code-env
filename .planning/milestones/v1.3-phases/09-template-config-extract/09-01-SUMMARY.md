---
phase: 09-template-config-extract
plan: 01
subsystem: config
tags: typescript, json, provider, template, config-extraction

# Dependency graph
requires:
  - phase: 07-provider-add-cmd
    provides: SourceTemplate 接口和 SOURCE_TEMPLATES 常量
  - phase: 08-webui
    provides: getTemplate/getAllTemplates 导入路径
provides:
  - 双层 Sources 模板架构（内置 JSON + 用户覆盖 JSON）
  - SOURCES_USER_FILE 配置路径常量
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "双层配置加载：编译期 import 内置 JSON + 运行时 fs.readFileSync 加载用户覆盖"
    - "JSON 数据验证 + 格式无效自动回退"

key-files:
  created:
    - src/core/sources.json
  modified:
    - src/core/config.ts
    - src/core/sourceTemplates.ts
    - src/types/index.ts

key-decisions:
  - "使用 import resolveJsonModule 编译期加载内置 JSON 而非 fs.readFileSync，确保 dist/ 中包含 JSON"
  - "同步加载（fs.readFileSync）而非异步，维持 getTemplate()/getAllTemplates() 同步函数签名"
  - "模块级单次加载缓存 SOURCE_TEMPLATES，运行时无文件 I/O"
  - "所有 7 个 Source 模板数据从 TypeScript 常量提取为独立 JSON 文件"

patterns-established:
  - "配置数据解耦模式：模板数据（JSON）与加载逻辑（TS）分离"
  - "用户覆盖模式：相同 Config 目录下的同名 JSON 文件提供用户自定义能力"
  - "校验+回退模式：用户配置格式无效时不阻塞应用启动"

requirements-completed: []

# Metrics
duration: 3min
completed: 2026-05-01
---

# Phase 09: Template Config Extract Summary

**将 SourceTemplate 数据从 TypeScript 常量提取为独立 JSON 配置文件，实现双层架构（编译期内置 JSON + 运行时用户覆盖 JSON）**

## Performance

- **Duration:** 3min
- **Started:** 2026-05-01T09:39:21Z
- **Completed:** 2026-05-01T09:41:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- 创建 `src/core/sources.json`，包含全部 7 个 Source 模板数据（deepseek, volcengine, tencent, alibaba, openai, anthropic, custom）
- 将 `config.ts` 和 `types/index.ts` 对齐：新增 `SOURCES_USER_FILE` 常量和 `CliConfig.sourcesFile` 字段
- 重构 `sourceTemplates.ts`：移除硬编码的 `SOURCE_TEMPLATES` 常量，改为从 JSON 加载，保留 `SourceTemplate` 接口和 `getTemplate()`/`getAllTemplates()` 签名不变
- 实现用户配置覆盖机制：`~/.config/cce/sources.json` 存在且格式有效时优先加载，格式无效则日志警告 + 自动回退内置模板
- 验证：编译通过（`npm run build` 零错误），`dist/core/sources.json` 存在于构建产物，运行时所有 7 个模板数据完整正确

## Task Commits

Each task was committed atomically:

1. **Task 1: 创建内置 sources.json 模板数据文件** - `aca308a` (feat)
2. **Task 2: 添加 SOURCES_USER_FILE 常量 + 重构 sourceTemplates.ts** - `2c58ddd` (feat)
3. **Task 3: 编译验证 + 功能完整性检查** - 无文件修改（纯验证任务）

_注：Task 1 由前序 agent 完成并提交；本 agent 完成 Task 2 和 Task 3。_

## Files Created/Modified

- `src/core/sources.json` - 新建：7 个 Source 模板的完整 JSON 数据（deepseek, volcengine, tencent, alibaba, openai, anthropic, custom）
- `src/core/config.ts` - 修改：新增 `SOURCES_USER_FILE` 配置路径常量
- `src/types/index.ts` - 修改：`CliConfig` 接口新增 `sourcesFile` 字段
- `src/core/sourceTemplates.ts` - 重构：移除硬编码常量 `SOURCE_TEMPLATES`，改为从 JSON 加载，保留导出接口和函数签名

## Decisions Made

- **resolveJsonModule 编译期加载**：使用 TypeScript `import` 加载内置 `sources.json`，确保 JSON 自动包含在 `dist/` 输出中，避免 `fs.readFileSync` 需要处理 `__dirname` 路径定位的复杂性
- **同步 fs.readFileSync**：因为 `getTemplate()`/`getAllTemplates()` 是同步函数，使用异步加载会破坏现有调用签名
- **模块级缓存**：`loadSources()` 在模块首次导入时执行一次，结果缓存到 `SOURCE_TEMPLATES` 常量，运行时零延迟
- **无自定义扩展支持**：用户只能覆盖现有 7 个 Source 的模板数据，不能新增 Source 类型（本阶段范围边界）

## Deviations from Plan

None - plan executed exactly as written。

## Issues Encountered

None - 所有任务顺利完成，编译零错误，运行时验证全部通过。

## User Setup Required

None - 无需用户手动配置。用户可选创建 `~/.config/cce/sources.json` 来自定义模板内容。

## Threat Surface Scan

无新增威胁面。`loadSources()` 实现了 T-09-01 的格式验证缓解措施，`SOURCES_USER_FILE` 路径硬编码符合 T-09-04 缓解要求，JSON.parse 在 try-catch 内符合 T-09-03 缓解要求。

## Self-Check: PASSED

- [x] `src/core/sources.json` 存在，包含 7 个 Source 模板（node -e 验证通过）
- [x] `src/core/config.ts` 导出 `SOURCES_USER_FILE` 常量
- [x] `src/core/sourceTemplates.ts` 导出 `SourceTemplate`, `getTemplate()`, `getAllTemplates()`
- [x] `getTemplate('deepseek').baseURL === 'https://api.deepseek.com'` — 通过
- [x] `getTemplate('custom').baseURL === ''` 且 `.models.length === 0` — 通过
- [x] `getAllTemplates().length === 7` — 通过
- [x] `npm run build` 零错误
- [x] `dist/core/sources.json` 存在于构建产物
- [x] `src/commands/provider.ts` 和 `src/core/webuiServer.ts` 导入路径未受影响
- [x] 编译产物 `getConfig().sourcesFile` 返回正确路径

## Next Phase Readiness

- 模板配置提取完成，Sources 数据与代码逻辑完全解耦
- 后续阶段可通过 `sources.json` 修改模板内容，无需修改 TypeScript 源码
- 用户 JSON 覆盖机制的格式验证和自动回退逻辑已就绪

---
*Phase: 09-template-config-extract*
*Completed: 2026-05-01*
