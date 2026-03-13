# commands - CLI 子命令

**Parent**: cce/AGENTS.md
**Scope**: cce/src/commands/

## 概述

所有 CLI 子命令实现。每个文件导出一个 `*Command` 函数。

## 命令列表

| 命令 | 文件 | 描述 |
|------|------|------|
| `init` | `init.ts` | 初始化配置目录 |
| `create` | `create.ts` | 创建新 profile（交互式选择 Provider） |
| `use` | `use.ts` | 启用指定 profile |
| `list` | `list.ts` | 列出所有 profile |
| `show` | `show.ts` | 显示 profile 详情 |
| `edit` | `edit.ts` | 编辑 profile |
| `remove` | `remove.ts` | 删除 profile |
| `current` | `current.ts` | 显示当前配置 |
| `doctor` | `doctor.ts` | 诊断配置问题 |
| `provider` | `provider.ts` | Provider 管理（add/list/show/edit/remove） |
| `ui` | `ui.ts` | 启动 WebUI 管理界面 |

## 添加新命令

1. 创建 `src/commands/<command>.ts`
2. 导出 `*Command` 函数
3. 在 `src/index.ts` 中导入并注册

## 依赖

命令通常依赖：
- `core/config.ts` - 配置路径
- `core/profile.ts` - profile CRUD
- `core/provider.ts` - provider CRUD
- `core/switch.ts` - profile 切换
- `utils/logger.ts` - 日志输出
