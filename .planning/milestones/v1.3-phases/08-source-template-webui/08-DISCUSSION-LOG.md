# Phase 8: Source Template WebUI 集成 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-01
**Phase:** 08-source-template-webui
**Areas discussed:** API 端点设计, 预填交互与反馈, 预填与编辑的边界, 来源列表同步方案

---

## API 端点设计

| Option | Description | Selected |
|--------|-------------|----------|
| 单个端点 GET /api/source-templates | 返回所有 Source 模板列表，前端一次性加载 | ✓ |
| 两个端点 | 列表端点 + 单个详情端点 | |
| 仅 GET /api/source-templates/:source | 单个查询，前端保持硬编码源列表 | |

**User's choice:** 单个端点 GET /api/source-templates，返回全部模板
**Notes:** 前端一次性加载，客户端根据 source 值查找对应模板，减少网络请求

---

## 预填交互与反馈

| Option | Description | Selected |
|--------|-------------|----------|
| 自动实时预填 + 提示条 | Source change 自动触发，显示蓝色提示条 | |
| 自动实时预填 + 高亮字段 | 自动触发 + 提示条 + 预填字段视觉高亮 | ✓ |
| 点击「应用模板」按钮触发 | 手动点击按钮才应用，用户完全控制 | |

**User's choice:** 自动实时预填 + 高亮字段
**Notes:** Source 下拉框 change 事件自动触发，预填字段加绿色边框或背景闪烁提示，同时显示蓝色提示条 2-3 秒

---

## 预填与编辑的边界

| Option | Description | Selected |
|--------|-------------|----------|
| 始终重新预填 | 选择新 Source 始终覆盖所有字段 | |
| 仅补填空白字段 | 只填充空字段，保留用户已填内容 | |
| 智能重置 + 确认 | 有修改时弹出确认框，确认后全部重新预填 | ✓ |

**User's choice:** 智能重置 + 确认
**Notes:** 用户修改过字段后重新选择 Source 会弹出确认框「更换 Source 将重置预填字段，是否继续？」

### 子问题：编辑模式行为

| Option | Description | Selected |
|--------|-------------|----------|
| 编辑模式也触发模板 | 与创建模式一致，更改 Source 后预填 | ✓ |
| 编辑模式不触发模板 | 更安全，避免意外覆盖现有配置 | |

**User's choice:** 编辑模式也触发模板

---

## 来源列表同步方案

| Option | Description | Selected |
|--------|-------------|----------|
| 通过 API 动态获取 | 页面加载时调用 API 构建下拉框，删除硬编码 | ✓ |
| 保持硬编码 + 注释约定 | 继续使用 ALL_SOURCES，加注释提示同步 | |

**User's choice:** 通过 API 动态获取
**Notes:** 前端 ALL_SOURCES 硬编码删除，改为从 GET /api/source-templates 返回数据动态构建

---

## Claude's Discretion

None — all areas discussed with user decisions.

## Deferred Ideas

None.

