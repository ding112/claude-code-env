# Phase 9: 模板内容提取为独立配置 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-01
**Phase:** 09-template-config-extract
**Areas discussed:** 配置文件格式, 文件位置与生命周期, 配置文件结构

---

## 配置文件格式

| Option | Description | Selected |
|--------|-------------|----------|
| JSON 文件 | sources.json，零新依赖，Node.js 原生支持 | ✓ |
| TypeScript 配置文件 | sources.config.ts，保留类型安全但需要编译 | |
| YAML 文件 | sources.yaml，可读性好但需引入解析库 | |

**User's choice:** JSON 文件
**Notes:** 模板数据是纯静态数据，JSON 最合适。零新依赖。

---

## 文件位置与生命周期

| Option | Description | Selected |
|--------|-------------|----------|
| 随代码发布（内置） | 放在 src/core/ 下，随 npm 包分发 | |
| 用户配置目录 | 放在 ~/.config/cce/ 下，用户可自由编辑 | |
| 双层架构 | 内置默认 + 用户可选覆盖 | ✓ |

**User's choice:** 双层架构 — 内置默认 src/core/sources.json + 用户可选覆盖 ~/.config/cce/sources.json
**Notes:** 用户配置文件优先，不存在则回退到内置。用户配置完全覆盖内置，不做合并。

---

## 配置文件结构

| Option | Description | Selected |
|--------|-------------|----------|
| 单文件，所有 Source | 一个 sources.json，与现有 Record 结构对应 | ✓ |
| 每个 Source 一个文件 | 每个 Source 单独一个 JSON 文件 | |

**User's choice:** 单文件，所有 Source
**Notes:** 数据量小，结构简单，一个文件足够。

---

## Claude's Discretion

运行时加载方式（import vs fs.readFileSync）留给 planner 决定。

## Deferred Ideas

- **用户自定义模板扩展** — 添加新 Source 类型的能力属于未来功能
- **模板编辑 CLI 命令** — `cce source edit` 不在本阶段范围
