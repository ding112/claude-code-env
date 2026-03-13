# 为 cce 增加 ui 命令：本地 WebUI（127.0.0.1 + 自动打开浏览器）

  ## Summary

  新增 cce ui 命令：在 127.0.0.1 启动一个本地 HTTP 服务（默认从 4200 起自动找空闲端口），自动打开浏览器访问交互页面。WebUI 支持：查看 profiles 列表、查看当前激活、切换 profile、创建 profile（claude/
  opencode/all）。

  ## User-Facing Behavior

  ### CLI

  - 新命令：cce ui
  - 参数：
      - --port <number>：指定端口；不指定则从 4200 起递增寻找可用端口
      - --no-open：不自动打开浏览器（默认自动打开）
  - 输出：
      - 启动成功后打印访问 URL（例如 http://127.0.0.1:4200/）
      - 打印“按 Ctrl+C 退出”

  ### Web UI（最小功能集：列表 + 当前 + 切换 + 创建）

  - 顶部状态：显示当前激活 profile（name/type/描述），以及 opencode/claude 摘要
  - Profiles 列表：
      - 每行：name、type、description、（可选）opencode provider/model 摘要
      - 操作按钮：Use（切换）、Details（弹出/侧栏展示 profile 详情，敏感字段打码）
  - Create 表单：
      - 选择 type：claude/opencode/all
      - 按 type 显示输入项，并在每个输入项 label 中展示例子
      - 提交后创建 profile；可选“创建后立即启用”（UI 侧 checkbox，默认勾选）

  ## Architecture / Implementation Choice

  - 服务端：express（新增依赖）+ 静态资源目录
  - 静态资源放在包根目录：cce/webui/（避免 tsc 不拷贝资源到 dist 的问题）
      - 运行时从 dist 代码通过 import.meta.url 解析到 ../webui/ 目录（dist 与 webui 同级）
  - 后端提供 JSON API，前端 fetch 调用，不引入前端构建（纯原生 JS/CSS）。

  ## HTTP Contract (Decision-Complete)

  - GET /api/health -> { ok: true, version: "1.0.0" }
  - GET /api/profiles -> { profiles: Array<{ name, type, description?, createdAt, updatedAt, hasClaudeEnv: boolean, opencode?: { provider, model, baseURL? } }> }
  - GET /api/current -> { active: string|null, profile?: ProfileSummary }
  - POST /api/use body { name: string } -> { ok: true } 或 { ok: false, error: string }
  - POST /api/create body：
      - { name, type, description?, claude?: { baseURL, authToken, model }, opencode?: { provider, baseURL, apiKey, model, enableThinking } , useNow?: boolean }
      - 返回：{ ok: true, created: string, used?: boolean } 或 { ok: false, error: string }

  ### 关键规则

  - 仅监听 127.0.0.1（不提供外网访问）
  - 只修改/创建 ~/.config/cce/* 与 ~/.config/opencode/opencode.json（通过现有核心逻辑）
  - 敏感字段（Token/Key）：
      - API 返回中不回传明文（只返回 hasToken: true / 打码后的字符串）
      - 任何错误日志不打印明文 key/token

  ## Code Changes (Files)

  ### 1) 新增命令文件与注册

  - 新增：cce/src/commands/ui.ts
      - 解析端口策略、启动 server、打印 URL、自动打开浏览器
  - 修改：cce/src/index.ts
      - 注册 ui 命令：.command('ui').option('--port <number>').option('--no-open')...

  ### 2) 抽取“切换 profile”逻辑为可复用核心函数

  目的：避免 commands/use.ts 的交互/输出逻辑直接被 WebUI 调用。

  - 新增：cce/src/core/switch.ts
      - switchProfile(name: string, opts?: { quiet?: boolean }): Promise<void>
      - 内部复用现有：getProfile、generateEnvFile、setActiveProfile、updateOpencodeProvider
  - 修改：cce/src/commands/use.ts
      - 用 switchProfile 替代内联切换逻辑（保留交互选择 + 终端提示）
  - WebUI 的 POST /api/use 直接调用 switchProfile(name, { quiet: true })

  ### 3) Web Server（express）

  - 新增：cce/src/core/webuiServer.ts
      - startWebuiServer({ host, portPolicy, openBrowser }): Promise<{ url, port, close }>
      - 自动找端口：从 4200 起递增尝试 server.listen，捕获 EADDRINUSE 继续
      - 静态目录：cce/webui（通过 new URL('../webui/', import.meta.url) 转换为路径）
      - API handlers 调用 core 函数：
          - list: listProfiles
          - current: getActiveProfile + getProfile
          - use: switchProfile
          - create: 直接构造 Profile 并 saveProfile，必要时 switchProfile
      - SIGINT/SIGTERM 时优雅关闭

  ### 4) 静态资源

  - 新增目录与文件：
      - cce/webui/index.html
      - cce/webui/app.js
      - cce/webui/styles.css
  - UI 实现细节（固定，不留决策）：
      - index.html：单页布局（header + profiles table + details drawer + create modal）
      - app.js：
          - 初始化加载：并行 GET /api/current + GET /api/profiles
          - Use 按钮：POST /api/use，成功后刷新 current + profiles
          - Create：收集表单 -> POST /api/create -> 刷新列表；若 useNow 则展示当前
          - 错误展示：页面顶部 toast/alert 区
      - styles.css：简洁但可用（响应式、表格可滚动、按钮状态、loading）

  ### 5) 依赖

  - 修改：cce/package.json
      - 添加依赖：express
      - 添加 dev 依赖：@types/express
  - 需要更新：cce/package-lock.json

  ## Test Plan

  - 构建：cd cce && npm run build
  - 手动验证：
      1. ./bin/cce ui 能启动并自动打开浏览器
      2. 端口占用时自动递增（先手动占用 4200）
      3. UI 列表展示正确，切换 profile 生效（claude 更新 env.sh；opencode 更新 opencode.json）
      4. UI 创建三种 type 的 profile 均可成功；创建后立即启用可用
      5. 退出进程（Ctrl+C）server 能正常关闭

  ## Plan Output File

  实现阶段同时新增/写入：docs/plans/2026-02-10-cce-webui-plan.md

  - 内容为本计划（略去对话内容，保留可执行规格、API、文件清单、测试清单）

  ## Assumptions / Defaults

  - 默认 host：127.0.0.1
  - 默认端口起点：4200，自动递增找空闲端口
  - 默认自动打开浏览器（macOS 用 open，Linux 用 xdg-open，Windows 用 cmd /c start；实现时按平台分支）
  - 不引入前端构建工具（Vite/Webpack），保持启动轻量