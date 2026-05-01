# Codebase Concerns

**Analysis Date:** 2026-05-01

## Tech Debt

**重复的 `maskApiKey` 函数:**
- Issue: 同一个 `maskApiKey` 函数在三个文件中各自独立定义了一份，逻辑完全相同
- Files: `src/commands/current.ts:6`, `src/commands/show.ts:6`, `src/commands/provider.ts:27`
- Impact: 修改掩码逻辑时需同步三处，易遗漏导致行为不一致
- Fix approach: 提取到 `src/utils/` 下统一导出，命令文件引用共享版本

**重复的安全权限常量 `SECURE_DIR_MODE` / `SECURE_FILE_MODE`:**
- Issue: `0o700` 和 `0o600` 常量在 4 个文件中各自定义，已有 `src/utils/file.ts` 提供统一版本但未被全部使用
- Files: `src/utils/file.ts:5-8`, `src/core/profile.ts:13-16`, `src/core/provider.ts:13-16`, `src/core/configGenerator.ts:12-15`, `src/commands/provider.ts:21`
- Impact: 改权限时需改 5 处；且 `file.ts` 已有 `writeSecureFile`/`writeSecureTextFile` 但 profile.ts/provider.ts/configGenerator.ts 绕过它们直接调用 `fs.writeFile`
- Fix approach: 所有文件统一使用 `src/utils/file.ts` 导出的常量和函数，删除各模块的本地重复定义

**重复的 `validTypes` 列表:**
- Issue: Provider 合法类型列表 `['openai-compatible', 'anthropic-compatible', 'custom']` 在 4 处硬编码定义
- Files: `src/types/index.ts:6`（类型定义）, `src/core/provider.ts:66`, `src/core/webuiServer.ts:370`, `src/core/webuiServer.ts:449`, `src/commands/provider.ts:40`
- Impact: 新增 Provider 类型时需改 4-5 处，极易遗漏
- Fix approach: 在 `src/types/index.ts` 导出 `const PROVIDER_TYPES: ProviderType[]`，所有消费方引用该常量

**重复的 `resolveConfig` 函数:**
- Issue: `resolveConfig` 在 `src/core/profile.ts:199` 和 `src/core/switch.ts:94` 各定义了一份，逻辑完全相同。`switch.ts` 中的为私有函数，`profile.ts` 中的为导出函数但 `switch.ts` 并未引用它
- Files: `src/core/profile.ts:199-210`, `src/core/switch.ts:94-105`
- Impact: 配置合并逻辑修改需同步两处
- Fix approach: 保留 `profile.ts` 中的导出版本，`switch.ts` 直接 import 使用

**大量动态 `await import()` 绕过顶层导入:**
- Issue: 多处使用 `await import()` 加载同模块的导出，而非在文件顶部静态导入
- Files: `src/core/profile.ts:70,136,217,233,248`, `src/commands/doctor.ts:66`, `src/commands/provider.ts:253-255,290`, `src/core/webuiServer.ts:253,279`
- Impact: 降低可读性和可维护性；IDE 无法正确追踪依赖；可能是循环依赖的征兆；`profile.ts` 中对 `config.js` 的 `ACTIVE_FILE` 用动态导入尤其不合理（该模块无循环依赖风险）
- Fix approach: 将 `ACTIVE_FILE` 等无循环风险的模块改为静态导入；对确实存在循环风险的 `profile.ts ↔ provider.ts`，考虑提取共享接口到 `types/` 或 `core/config.ts` 来打破循环

**`webuiServer.ts` 文件过大 (564 行):**
- Issue: 单文件包含所有 API 路由定义、验证逻辑和服务器启动，严重超出合理函数长度
- Files: `src/core/webuiServer.ts`
- Impact: 难以维护和测试；路由验证逻辑与核心模块的验证逻辑重复（profile 创建验证、provider 创建验证各写了一份）
- Fix approach: 拆分为路由文件（`routes/profiles.ts`, `routes/providers.ts`）和服务器入口（`server.ts`）；验证逻辑复用核心模块的 `validateProfile`/`validateProvider`

## Known Bugs

**`switchProfile` 在部分配置写入失败时仍标记 `active`:**
- Symptoms: 当 `generateClaudeConfig` 成功但 `generateOpencodeConfig` 失败时，`setActiveProfile` 仍被调用，`success` 为 `false`，但 active 文件已指向该 profile
- Files: `src/core/switch.ts:78-79`
- Trigger: OpenCode 配置目录权限异常或磁盘满时
- Workaround: 无，用户需手动检查实际生效的配置

**`listProfiles` 静默跳过验证失败的 profile:**
- Symptoms: `listProfiles` 遇到验证失败的 profile 时只 `logger.warn` 然后 `continue`，用户在列表中完全看不到该 profile 的存在，也无法修复
- Files: `src/core/profile.ts:86-89`
- Trigger: 手动编辑 JSON 导致格式错误，或 provider 被删除后 profile 引用失效
- Workaround: 用户需直接查看 `~/.config/cce/profiles/` 目录

**`listProviders` 同样静默跳过验证失败的 provider:**
- Symptoms: 与 profile 相同的问题
- Files: `src/core/provider.ts:121-123`
- Trigger: JSON 文件损坏或手动编辑导致字段缺失
- Workaround: 直接查看 `~/.config/cce/providers/` 目录

**WebUI `init()` 中 `Promise.all` 未 await:**
- Symptoms: `webui/app.js:606` 中 `Promise.all([loadProviders(), loadCurrent(), loadProfiles()])` 缺少 `await`，初始数据加载可能在 DOM 渲染前未完成
- Files: `webui/app.js:606`
- Trigger: 页面首次加载时数据可能未就绪
- Workaround: 刷新页面

**`create` 命令中 `process.exit(0)` 阻止后续操作:**
- Symptoms: `createCommand` 在成功创建 profile 后调用 `process.exit(0)`（第 105 行），这在被 `useCommand` 动态导入调用时会导致整个进程退出
- Files: `src/commands/create.ts:105`
- Trigger: `create` 流程中用户选择"立即激活"时，`useCommand` 被调用后 `process.exit(0)` 被执行两次（use.ts:48 和 create.ts:105）
- Workaround: 目前因 `process.exit(0)` 幂等性不会崩溃，但属于逻辑错误

## Security Considerations

**WebUI 无认证机制:**
- Risk: 任何能访问 localhost:3456 的本地进程都可以读取 API Key、修改配置、切换 profile
- Files: `src/core/webuiServer.ts`
- Current mitigation: 绑定到 `127.0.0.1` 防止局域网访问；`sanitizeProvider` 在 GET 请求中过滤 `apiKey` 字段
- Recommendations: 添加 token 认证或至少检查 `Origin` 头防止 CSRF；在启动时生成一次性 token 作为 URL 参数

**WebUI Provider 编辑接口返回 apiKey:**
- Risk: `GET /api/providers/:name` 虽然用了 `sanitizeProvider` 过滤 apiKey，但 `PUT /api/providers/:name` 的响应中 `existing` 对象包含完整 apiKey，且 `providerEditCommand` CLI 中 `open(tempPath, ...)` 会将包含 apiKey 的完整 JSON 写入临时文件
- Files: `src/core/webuiServer.ts:436-509`, `src/commands/provider.ts:260-262`
- Current mitigation: WebUI GET 请求已过滤；临时文件使用 `0o600` 权限
- Recommendations: PUT 响应中不返回 apiKey；CLI 编辑时考虑使用 `EDITOR` 内联编辑而非写临时文件

**`validateName` 允许空格和特殊字符:**
- Risk: 名称含空格（如 `"my provider"`）虽不构成路径遍历，但在 CLI 交互和文件系统中可能引发意外行为
- Files: `src/utils/validation.ts:23-26`
- Current mitigation: WebUI 前端额外校验 `/^[a-zA-Z0-9_-]+$/`，但后端 API 和 CLI 无此限制
- Recommendations: 后端 `validateName` 也应限制为安全字符集，与前端保持一致

**`readJson` / `readFile` 吞掉所有错误:**
- Risk: `src/utils/file.ts` 的 `readJson` 和 `readFile` 在 catch 块中返回 `null`，不区分文件不存在（ENOENT）和权限错误（EACCES）等
- Files: `src/utils/file.ts:58-65,71-77`
- Current mitigation: 核心模块（profile.ts, provider.ts）直接用 `fs.readFile` 并区分错误码
- Recommendations: `readJson`/`readFile` 应至少在非 ENOENT 错误时抛出异常

## Performance Bottlenecks

**`listProfiles` 每次调用都读取所有 providers:**
- Problem: 每次列出 profiles 时都要先调用 `listProviders()` 加载全部 provider 文件来验证引用
- Files: `src/core/profile.ts:70-72`
- Cause: 验证 profile 的 provider 引用是否存在需要读取 provider 列表
- Improvement path: 缓存 provider 列表或延迟验证（仅在 switch 时验证）

**`listCommand` N+1 查询:**
- Problem: 列出所有 profile 时，每个 profile 都单独调用 `getProvider()` 读取一次 provider 文件
- Files: `src/commands/list.ts:30`
- Cause: `listProfiles` 已加载 provider 列表但未将其附在返回结果中，命令层需再次查询
- Improvement path: `listProfiles` 返回值中附带 provider 信息，或在命令层复用已加载的 provider 列表

**`isProviderInUse` 和 `getProviderUsage` 重复扫描:**
- Problem: 删除 provider 时先调用 `isProviderInUse` 检查，再调用 `getProviderUsage` 获取详情，两次都读取全部 profile 文件
- Files: `src/core/provider.ts:229-287`, `src/commands/provider.ts:335-338`
- Cause: 两个函数各自独立遍历 profiles 目录
- Improvement path: 合并为 `getProviderUsage` 一个函数，返回空数组即表示未使用

**`migrateProviderType` 在 `listProviders` 和 `getProvider` 中重复触发:**
- Problem: 每次列出或获取 provider 时都检查并可能触发类型迁移写文件操作，导致读操作可能产生写副作用
- Files: `src/core/provider.ts:117-118,153`
- Cause: 迁移逻辑嵌入在读取路径中
- Improvement path: 迁移应为一次性操作（如 `cce doctor --migrate` 或 `init` 时执行），而非每次读取时触发

## Fragile Areas

**`configGenerator.ts` 直接覆写用户现有配置文件:**
- Files: `src/core/configGenerator.ts:50-62,104-125`
- Why fragile: `generateClaudeConfig` 使用 spread 合并现有 settings.json，但如果 Claude Code 更新了 settings.json 的结构（新增必需字段），spread 可能丢失或破坏；`generateOpencodeConfig` 同理
- Safe modification: 修改前备份现有文件；对 settings.json 的 `env` 字段做增量合并而非全量覆盖
- Test coverage: 无测试覆盖

**Provider 编辑临时文件未可靠清理:**
- Files: `src/commands/provider.ts:260-309`
- Why fragile: 编辑流程创建 `.tmp` 文件后，如果用户 Ctrl+C 或编辑器未关闭，临时文件（含 apiKey）会残留在磁盘上；`unlink` 在 catch 中被忽略
- Safe modification: 使用 `os.tmpdir()` 而非源文件同目录；添加 `process.on('exit')` 清理钩子；或改用内存编辑
- Test coverage: 无测试覆盖

**`ClaudeSettings` 类型定义与实际文件结构不匹配:**
- Files: `src/types/index.ts:69-71`
- Why fragile: `ClaudeSettings` 接口定义为 `{ env: ClaudeEnvConfig }`，但实际 `settings.json` 包含更多字段（如 `hooks`, `permissions`）；`generateClaudeConfig` 用 `...existingSettings` spread 处理，但类型系统不反映这一点
- Safe modification: 将 `ClaudeSettings` 改为 `{ env: ClaudeEnvConfig; [key: string]: unknown }` 或使用 `Record<string, unknown>` 作为基础类型
- Test coverage: 无测试覆盖

**`switchProfile` 的部分成功状态:**
- Files: `src/core/switch.ts:62-79`
- Why fragile: `generateAllConfigs` 可能 Claude 成功而 OpenCode 失败，此时 `success` 为 `false` 但 `active` 已被设置，用户无法判断哪个配置实际生效
- Safe modification: 只有在两个配置都成功时才 `setActiveProfile`；或在部分失败时回滚成功的配置
- Test coverage: 无测试覆盖

## Scaling Limits

**配置文件全量扫描:**
- Current capacity: 适合几十个 profiles/providers
- Limit: 每次 `list`/`use` 都读取全部 JSON 文件，provider 数量上百时会明显变慢
- Scaling path: 添加索引文件（如 `profiles/index.json`）缓存元数据，修改时增量更新

**WebUI 单线程:**
- Current capacity: 适合单个用户本地管理
- Limit: Express 无并发保护，快速连续操作可能导致数据竞争（如同时创建两个同名 profile）
- Scaling path: 添加操作锁或乐观并发控制

## Dependencies at Risk

**`chalk` v4:**
- Risk: 使用 CommonJS 兼容的 v4 而非最新 ESM-only v5，虽然当前项目用 CommonJS 输出所以无问题，但 v4 已不再积极维护
- Impact: 未来 Node.js 版本可能弃用 v4 依赖的 API
- Migration plan: 如果项目迁移到 ESM 输出，升级到 chalk v5；否则保持 v4

**`inquirer` v8:**
- Risk: v8 是 CommonJS 版本，最新版为 v12（@inquirer/prompts），v8 已不再积极维护
- Impact: 安全补丁可能不再提供
- Migration plan: 迁移到 `@inquirer/prompts` 或 `@inquirer/select` 等独立包

**`express` v5:**
- Risk: v5 是较新的主要版本（2025 年发布），生态系统中间件兼容性可能存在问题
- Impact: 部分第三方中间件可能尚未兼容 v5
- Migration plan: 当前使用量极少（仅静态文件和 JSON 路由），风险低；关注 v5 的 bug 修复

**`@mengzai1/cce` 自身依赖:**
- Risk: `package.json` 中 `dependencies` 包含 `"@mengzai1/cce": "^1.0.1"`，即项目依赖自身
- Impact: npm install 可能产生循环依赖或安装错误
- Migration plan: 删除该自身引用，这显然是发布配置错误

## Missing Critical Features

**零测试覆盖（除 validation.ts 外）:**
- Problem: 仅 `src/utils/validation.ts` 有单元测试（`tests/validation.test.ts`），核心模块（switch, profile, provider, configGenerator）和所有命令均无测试
- Blocks: 安全重构、添加新功能时无法验证不破坏现有行为

**无配置回滚机制:**
- Problem: 切换 profile 时直接覆写 `~/.claude/settings.json` 和 `~/.config/opencode/opencode.json`，无备份、无回滚
- Blocks: 用户误操作后无法恢复之前的配置

**无 Profile 编辑功能（WebUI）:**
- Problem: WebUI 支持创建和删除 profile，但不支持编辑（修改 provider、model、description）
- Blocks: 用户需通过 CLI `cce edit` 或直接编辑 JSON 文件修改 profile

## Test Coverage Gaps

**`src/core/switch.ts` - Profile 切换逻辑:**
- What's not tested: 切换流程、部分失败处理、active 文件写入
- Files: `src/core/switch.ts`
- Risk: 切换逻辑是最核心功能，无测试意味着任何重构都可能破坏用户配置
- Priority: High

**`src/core/configGenerator.ts` - 配置文件生成:**
- What's not tested: Claude Code 和 OpenCode 配置生成、现有配置合并、文件权限
- Files: `src/core/configGenerator.ts`
- Risk: 配置格式错误会导致 Claude Code/OpenCode 无法工作
- Priority: High

**`src/core/profile.ts` - Profile CRUD:**
- What's not tested: 保存/删除/列表、active profile 管理、resolveConfig
- Files: `src/core/profile.ts`
- Risk: 数据损坏或丢失
- Priority: High

**`src/core/provider.ts` - Provider CRUD:**
- What's not tested: 保存/删除/列表、类型迁移、使用追踪
- Files: `src/core/provider.ts`
- Risk: 数据损坏或迁移失败
- Priority: High

**`src/core/webuiServer.ts` - WebUI API 路由:**
- What's not tested: 所有 API 端点、输入验证、错误处理
- Files: `src/core/webuiServer.ts`
- Risk: API 行为变化无法被检测
- Priority: Medium

**所有 CLI 命令:**
- What's not tested: 命令行参数解析、交互流程、错误输出
- Files: `src/commands/*.ts`
- Risk: CLI 用户体验退化
- Priority: Medium

**`src/utils/file.ts` - 文件工具:**
- What's not tested: 安全文件读写、权限设置、错误处理
- Files: `src/utils/file.ts`
- Risk: 文件权限错误导致敏感信息泄露
- Priority: Low

---

*Concerns audit: 2026-05-01*
