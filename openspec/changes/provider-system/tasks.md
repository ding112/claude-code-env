# Provider System 任务清单

## 阶段 1: 基础架构

### 1.1 类型定义
- [ ] 更新 `src/types/index.ts`
  - [ ] 添加 `Provider` 接口
  - [ ] 添加新 `Profile` 接口（与旧版不兼容）
  - [ ] 添加 Provider 类型常量
  - [ ] 添加验证错误类型

**依赖**: 无
**预计时间**: 1-2 小时

### 1.2 Provider 核心模块
- [ ] 创建 `src/core/provider.ts`
  - [ ] `listProviders()` - 列出所有 provider
  - [ ] `getProvider(name)` - 获取单个 provider
  - [ ] `saveProvider(provider)` - 保存 provider
  - [ ] `deleteProvider(name)` - 删除 provider
  - [ ] `validateProvider(data)` - 验证 provider 数据
  - [ ] `isProviderInUse(name)` - 检查是否被 profile 引用

**依赖**: 1.1
**预计时间**: 3-4 小时

### 1.3 Profile 核心模块（重构）
- [ ] 重写 `src/core/profile.ts`
  - [ ] 新 `listProfiles()` - 只读取新格式
  - [ ] 新 `getProfile(name)` - 新格式验证
  - [ ] 新 `saveProfile(profile)` - 保存新格式
  - [ ] 新 `deleteProfile(name)` - 删除 profile
  - [ ] `validateProfile(data, providers)` - 验证 profile
  - [ ] `resolveConfig(profile, provider)` - 合并配置

**依赖**: 1.2
**预计时间**: 4-5 小时

## 阶段 2: CLI 命令实现

### 2.1 Provider 命令集
- [ ] 创建 `src/commands/provider.ts`
  - [ ] `providerAddCommand(type)` - 添加 provider（交互式）
    - [ ] 火山引擎专用交互流程
    - [ ] 通用 provider 交互流程
  - [ ] `providerListCommand()` - 列表展示
  - [ ] `providerShowCommand(name)` - 详情展示
  - [ ] `providerEditCommand(name)` - 编辑（打开编辑器）
  - [ ] `providerRemoveCommand(name)` - 删除（检查引用）

**依赖**: 1.2
**预计时间**: 6-8 小时

### 2.2 Profile 命令重构
- [ ] 重写 `src/commands/create.ts`
  - [ ] 新交互流程：选择 provider -> 可选 model 覆盖
  - [ ] 移除 type 选择
  - [ ] 简化配置流程

- [ ] 重写 `src/commands/edit.ts`
  - [ ] 只支持修改 description 和 model
  - [ ] 简化编辑器界面

- [ ] 更新 `src/commands/list.ts`
  - [ ] 新格式展示（显示 provider 引用）

- [ ] 更新 `src/commands/show.ts`
  - [ ] 新格式展示

- [ ] 更新 `src/commands/remove.ts`
  - [ ] 确认提示更新

**依赖**: 1.3, 2.1
**预计时间**: 6-8 小时

### 2.3 激活与诊断命令
- [ ] 重写 `src/core/switch.ts`
  - [ ] 新 `switchProfile(name)` - 使用新配置生成逻辑
  - [ ] 同时为 Claude Code 和 OpenCode 生成配置

- [ ] 重写 `src/core/configGenerator.ts`（新增）
  - [ ] `generateClaudeConfig(profile, provider)` - 生成 Claude 配置
  - [ ] `generateOpencodeConfig(profile, provider)` - 生成 OpenCode 配置

- [ ] 更新 `src/commands/use.ts`
  - [ ] 适配新的 switchProfile

- [ ] 更新 `src/commands/current.ts`
  - [ ] 适配新格式展示

- [ ] 更新 `src/commands/doctor.ts`
  - [ ] 添加 Provider 配置验证
  - [ ] 验证 Profile 引用的 Provider 存在

**依赖**: 2.2
**预计时间**: 5-6 小时

## 阶段 3: 入口与集成

### 3.1 CLI 入口更新
- [ ] 更新 `src/index.ts`
  - [ ] 注册新的 provider 命令
  - [ ] 更新 profile 命令描述
  - [ ] 移除 type 相关选项

**依赖**: 2.1, 2.2, 2.3
**预计时间**: 2 小时

### 3.2 目录初始化
- [ ] 更新 `src/core/config.ts`
  - [ ] 添加 `providers/` 目录初始化
  - [ ] 确保目录结构完整

**依赖**: 无
**预计时间**: 1 小时

## 阶段 4: 测试

### 4.1 单元测试
- [ ] 创建 `tests/core/provider.test.ts`
  - [ ] Provider CRUD 测试
  - [ ] Provider 验证测试
  - [ ] Provider 引用检查测试

- [ ] 创建 `tests/core/profile.test.ts`
  - [ ] 新 Profile CRUD 测试
  - [ ] Profile 配置合并测试
  - [ ] Profile 验证测试

- [ ] 创建 `tests/core/configGenerator.test.ts`
  - [ ] Claude 配置生成测试
  - [ ] OpenCode 配置生成测试

**预计时间**: 8-10 小时

### 4.2 集成测试
- [ ] 创建 `tests/integration/provider-flow.test.ts`
  - [ ] 完整 Provider 生命周期测试

- [ ] 创建 `tests/integration/profile-flow.test.ts`
  - [ ] 完整 Profile 生命周期测试

- [ ] 创建 `tests/integration/switch-flow.test.ts`
  - [ ] 激活流程测试

- [ ] 创建 `tests/integration/volcano.test.ts`
  - [ ] 火山引擎专用流程测试

**预计时间**: 6-8 小时

## 任务依赖图

```
1.1 类型定义 ─────────────────────────────────────┐
    │                                              │
    ▼                                              │
1.2 Provider 核心 ◀───────────────────────────────┤
    │                                              │
    ▼                                              │
1.3 Profile 核心 ─────────────────────────────────┤
    │         │                                    │
    │         ▼                                    │
    │    3.2 目录初始化                             │
    │                                              │
    ▼                                              │
2.1 Provider 命令 ◀────────────────────────────────┤
    │                                              │
    ▼                                              │
2.2 Profile 命令 ─────────────────────────────────┤
    │                                              │
    ▼                                              │
2.3 激活与诊断 ────────────────────────────────────┤
    │                                              │
    ▼                                              │
3.1 CLI 入口 ◀─────────────────────────────────────┘
    │
    ▼
4.1 单元测试
    │
    ▼
4.2 集成测试
```

## 时间估算

| 阶段 | 任务数 | 预计时间 |
|-----|-------|---------|
| 阶段 1: 基础架构 | 3 | 8-11 小时 |
| 阶段 2: CLI 命令 | 3 | 17-22 小时 |
| 阶段 3: 入口与集成 | 2 | 3 小时 |
| 阶段 4: 测试 | 2 | 14-18 小时 |
| **总计** | **13** | **42-54 小时** |

## 风险与缓解

| 风险 | 影响 | 缓解措施 |
|-----|------|---------|
| 与旧格式 Profile 混淆 | 高 | 明确文档说明，旧 Profile 将被忽略 |
| Provider 删除时检查遗漏 | 中 | 实现 `isProviderInUse()` 并强制检查 |
| 配置生成错误 | 高 | 完善的单元测试覆盖，错误处理 |
| 火山引擎交互复杂 | 低 | 专用测试用例，文档说明 |
