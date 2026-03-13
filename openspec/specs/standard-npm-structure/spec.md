## ADDED Requirements

### Requirement: 项目使用标准 npm 目录结构
项目 MUST 使用标准的 npm 项目目录结构，所有源代码 MUST 位于根目录的 `src/` 下，不得有多个源代码目录。

#### Scenario: 验证标准目录结构
- **WHEN** 检查项目根目录
- **THEN** 应该只有一个源代码目录 `src/`
- **THEN** 不应该存在 `cce/` 作为源代码目录
- **THEN** `package.json` 中的所有路径引用 MUST 指向 `src/` 目录

### Requirement: 源代码统一迁移
所有从 `cce/` 目录下的源代码 MUST 迁移到根目录的 `src/` 目录中，保持原有的内部模块结构不变。

#### Scenario: 迁移 cce/src 到 src
- **WHEN** 执行目录迁移
- **THEN** `cce/src/` 下的所有文件 MUST 复制到 `src/`
- **THEN** 如果 `src/` 已存在文件，必须确保不冲突
- **THEN** 原有的 `cce/` 目录结构应该被移除或重构

### Requirement: 构建配置更新
项目的构建配置和脚本 MUST 更新以反映新的目录结构，确保开发命令和生产构建都能正常工作。

#### Scenario: package.json �配置更新
- **WHEN** 查看 `package.json`
- **THEN** `main` 字段应该指向正确的编译输出路径
- **THEN** `bin` 字段中的可执行文件路径应该正确
- **THEN** `scripts` 中的构建和开发命令应该使用正确的源代码路径

### Requirement: 清理冗余目录
不再需要的空目录或冗余目录 MUST 被移除，保持项目结构的整洁。

#### Scenario: 移除空目录
- **WHEN** 检查根目录
- **THEN** 空的 `bin/` 目录应该被移除
- **THEN** `cce/` 目录应该被移除（如果其内容已迁移）
- **THEN** 只保留必要的项目目录