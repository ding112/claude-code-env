# Provider System 设计文档

## 架构概览

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLI 命令层                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  provider add|list|show|edit|remove    profile create|list|show|edit... │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Core 业务逻辑层                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Provider   │  │   Profile    │  │    Switch    │  │    Config    │ │
│  │   Manager    │  │   Manager    │  │   Service    │  │   Generator  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          数据存储层                                      │
├─────────────────────────────────────────────────────────────────────────┤
│  ~/.config/cce/                                                         │
│  ├── providers/              # Provider JSON 文件                        │
│  │   ├── volcano-prod.json                                            │
│  │   └── ...                                                           │
│  ├── profiles/               # Profile JSON 文件（新格式）               │
│  │   ├── work.json                                                     │
│  │   └── ...                                                           │
│  └── active                  # 当前激活的 profile 名称                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        外部工具配置                                      │
├─────────────────────────────────────────────────────────────────────────┤
│  ~/.claude/settings.json          # Claude Code 配置                    │
│  ~/.config/opencode/opencode.json   # OpenCode 配置                       │
└─────────────────────────────────────────────────────────────────────────┘
```

## 模块设计

### 1. Provider 模块

**职责**: 管理 Provider 的 CRUD 操作

**文件**: `src/core/provider.ts`

```typescript
// 数据模型
interface Provider {
  name: string;
  displayName: string;
  type: 'openai-compatible' | 'anthropic-compatible' | 'custom';
  baseURL: string;
  apiKey: string;
  models: string[];
  defaultModel: string;
}

// 核心函数
async function listProviders(): Promise<Provider[]>;
async function getProvider(name: string): Promise<Provider | null>;
async function saveProvider(provider: Provider): Promise<void>;
async function deleteProvider(name: string): Promise<void>;
function validateProvider(provider: Partial<Provider>): ValidationError[];
async function isProviderInUse(name: string): Promise<boolean>;
```

### 2. Profile 模块（重构）

**职责**: 管理新格式的 Profile

**文件**: `src/core/profile.ts`（重构）

```typescript
// 新数据模型（与旧版本不兼容）
interface Profile {
  name: string;
  description?: string;
  provider: string;           // 引用 Provider name
  model?: string;             // 可选：覆盖 Provider 的 defaultModel
  createdAt: string;
  updatedAt: string;
}

// 核心函数
async function listProfiles(): Promise<Profile[]>;
async function getProfile(name: string): Promise<Profile | null>;
async function saveProfile(profile: Profile): Promise<void>;
async function deleteProfile(name: string): Promise<void>;
function validateProfile(profile: Partial<Profile>, availableProviders: string[]): ValidationError[];

// 配置生成
async function generateClaudeConfig(profile: Profile, provider: Provider): Promise<ClaudeConfig>;
async function generateOpencodeConfig(profile: Profile, provider: Provider): Promise<OpencodeConfig>;
```

### 3. 切换服务模块

**职责**: 处理 Profile 激活时的配置应用

**文件**: `src/core/switch.ts`（重构）

```typescript
interface SwitchResult {
  success: boolean;
  profile: string;
  provider: string;
  model: string;
  configsApplied: {
    claude: boolean;
    opencode: boolean;
  };
  errors: string[];
}

async function switchProfile(profileName: string): Promise<SwitchResult>;

// 内部函数
async function applyClaudeConfig(config: ClaudeConfig): Promise<void>;
async function applyOpencodeConfig(config: OpencodeConfig): Promise<void>;
async function setActiveProfile(name: string): Promise<void>;
```

### 4. CLI 命令模块

**文件**: `src/commands/provider.ts`（新增）

```typescript
// cce provider add <type>
export async function providerAddCommand(type: string): Promise<void>;

// cce provider list
export async function providerListCommand(): Promise<void>;

// cce provider show <name>
export async function providerShowCommand(name: string): Promise<void>;

// cce provider edit <name>
export async function providerEditCommand(name: string): Promise<void>;

// cce provider remove <name>
export async function providerRemoveCommand(name: string): Promise<void>;
```

**文件**: `src/commands/create.ts`（重构）

```typescript
// cce create <name>
// 交互式：选择 provider -> 是否覆盖 model
export async function createCommand(name: string): Promise<void>;
```

## 文件结构变化

```
src/
├── index.ts                      # 更新：注册新命令
├── commands/
│   ├── provider.ts               # 新增：provider 命令集
│   ├── create.ts                   # 重构：新 Profile 创建流程
│   ├── edit.ts                   # 重构：简化编辑逻辑
│   └── ... (其他命令适配)           # 更新：适配新模型
├── core/
│   ├── provider.ts               # 新增：Provider 管理
│   ├── profile.ts                # 重构：新 Profile 模型
│   ├── switch.ts                 # 重构：新切换逻辑
│   └── configGenerator.ts        # 新增：配置生成器
└── types/
    └── index.ts                  # 更新：新类型定义
```

## 与旧系统的关系

### 不兼容变更

1. **Profile JSON 格式变更**：不再支持 `type`, `claudeConfig`, `opencodeConfig` 字段
2. **删除旧命令**：移除与旧 Profile 类型相关的逻辑
3. **不迁移**：现有 Profile 需要重新创建（符合需求 #4）

### 实现策略

1. 直接替换 `src/core/profile.ts` 和 `src/core/switch.ts`
2. 保留 `~/.config/cce/profiles/` 目录，但新 Profile 使用新格式
3. 旧 Profile JSON 会被忽略（因为缺少 `provider` 字段，验证会失败）

## 测试策略

### 单元测试

1. **Provider 管理**：CRUD 操作、验证逻辑
2. **Profile 管理**：新格式 CRUD、Provider 引用验证
3. **配置生成**：Claude 和 OpenCode 配置正确性

### 集成测试

1. **完整流程**：添加 Provider → 创建 Profile → 激活 → 验证配置
2. **边界情况**：删除被引用的 Provider、无效的 model 覆盖
3. **火山引擎专用**：专用交互流程测试

## 性能考虑

1. **文件 I/O**：Provider 和 Profile 都是小 JSON 文件，直接读写即可
2. **缓存**：不需要缓存，配置简单，读取开销小
3. **并发**：单用户 CLI 工具，不需要考虑并发
