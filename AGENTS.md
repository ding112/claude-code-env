# claude-code-env (cce) - Claude 配置切换工具

**Type**: TypeScript CLI 工具
**Package**: 标准的 npm 项目结构

## 项目结构

```
.                      # 项目根目录
├── src/
│   ├── index.ts      # CLI 主入口
│   ├── commands/     # 子命令（init/create/use/list/show/edit/remove/current/doctor/provider/ui）
│   ├── core/         # 核心逻辑（config/profile/provider/switch/configGenerator/webuiServer）
│   ├── utils/        # 工具函数（file/logger/validation）
│   └── types/        # 类型定义
├── dist/             # 编译产物
├── package.json      # 项目配置
└── tsconfig.json     # TypeScript 配置
```

## 关键文件

| 用途 | 文件路径 |
|------|----------|
| CLI 入口 | `src/index.ts` |
| 配置路径常量 | `src/core/config.ts` |
| Profile 操作 | `src/core/profile.ts` |
| Provider 操作 | `src/core/provider.ts` |
| 切换逻辑 | `src/core/switch.ts` |
| 配置生成 | `src/core/configGenerator.ts` |
| 命令集合 | `src/commands/*.ts` |

## 构建命令

```bash
npm install    # 安装依赖
npm run build  # 编译到 dist/
npm run dev    # 使用 ts-node 运行
npm start      # 运行编译后的代码
```

## 代码约定

- **语言**: TypeScript，strict 模式
- **模块**: CommonJS，import 使用 `.js` 扩展名
- **缩进**: 2 空格
- **命令添加**: 新建文件于 `src/commands/<command>.ts`
- **复用逻辑**: 放 `src/core/` 或 `src/utils/`

## 安全提示

- Profile/token 存储于 `~/.config/cce/`，**不要提交到 Git**
- 建议设置权限: `chmod 700 ~/.config/cce`
