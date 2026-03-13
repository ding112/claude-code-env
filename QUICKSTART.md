# cce 快速开始指南

## 1. 安装

```bash
cd /Volumes/yidongpan/workspace/scripts/cce
npm install
npm run build
```

## 2. 添加到 PATH

由于 `bin` 字段在 `package.json` 中指向 `dist/index.js`，可以使用 `npm link` 或手动添加到 PATH：

```bash
npm link
```

或者在 `~/.zshrc` 中添加别名：

```bash
alias cce="node /Volumes/yidongpan/workspace/scripts/cce/dist/index.js"
```

然后执行：

```bash
source ~/.zshrc
```

## 3. 初始化 cce

```bash
cce init
```

初始化会创建以下目录结构：

```
~/.config/cce/
├── providers/   # Provider 配置文件
└── profiles/    # Profile 配置文件
```

## 4. 添加 Provider

### 火山引擎

```bash
cce provider add volcano
```

交互式输入：
- Config name: 配置名称（如 `volcano-prod`）
- Display name: 显示名称
- Base URL: API 地址
- API Key: API 密钥
- Models: 可用模型列表
- Default model: 默认模型

## 5. 创建 Profile

```bash
cce create work
```

交互式选择：
- 选择一个已配置的 Provider
- 输入 Profile 描述（可选）
- 是否覆盖默认模型
- 是否立即激活

## 6. 启用配置

```bash
cce use work
```

激活后会同时更新：
- Claude Code 配置：`~/.claude/settings.json`
- OpenCode 配置：`~/.config/opencode/opencode.json`

## 7. 验证配置

```bash
# 查看当前配置
cce current

# 查看所有配置
cce list

# 诊断配置
cce doctor
```

## 常用命令

```bash
# 列出所有 Profile
cce list

# 查看 Profile 详情
cce show work

# 编辑 Profile
cce edit work

# 删除 Profile
cce remove work

# 列出所有 Provider
cce provider list

# 查看 Provider 详情
cce provider show volcano-prod

# 启动 WebUI
cce ui
```

## 注意事项

1. **配置生效**：`cce use` 会直接修改 Claude Code 和 OpenCode 的配置文件，无需手动 source
2. **安全性**：配置文件存储在 `~/.config/cce/`，目录权限 `700`，文件权限 `600`
3. **Provider 先于 Profile**：创建 Profile 前必须先添加至少一个 Provider

## 故障排除

### 无法创建 Profile？

确保已先添加至少一个 Provider：

```bash
cce provider add volcano
```

### 配置诊断

运行 `cce doctor` 检查配置目录、Provider、Profile 和外部工具配置是否正常。
