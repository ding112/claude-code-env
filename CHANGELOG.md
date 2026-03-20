# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-03-20

### Added

- Vitest 测试框架配置和 validation.ts 测试用例

### Changed

- Provider 类型从 `claude-native` 重命名为 `anthropic-compatible`
- Provider 显示名称改为可选，默认使用配置名称
- 配置名称验证放宽，仅禁止路径遍历字符
- Provider 类型选择改为交互式下拉列表
- WebUI 同步更新类型名称和验证逻辑

### Fixed

- 文档中过时的类型名称引用已更新

## [1.0.1] - 2026-03-13

### Changed

- Unified app name from CCL to CCE across CLI commands, code references, and documentation
- Updated package name to `@mengzai1/cce` with improved metadata configuration
- Bumped version to 1.0.1

### Fixed

- Resolved stale `ccc`/`ccl` references throughout the project to consistently use `cce`

## [0.1.0] - 2026-02-16

### Added

- **Provider System**: Introduced Provider-Profile architecture, separating API endpoint configuration from user Profiles
- **Provider Management Commands**: Full CRUD via `cce provider add/list/show/edit/remove`
- **WebUI Dashboard**: Local web management interface launched via `cce ui`, powered by Express
- MIT open-source license
- Chinese language documentation
- Claude Code automation setup (Hooks, Skills, Subagents)

### Changed

- Restructured Provider command hierarchy for better usability
- Renamed CLI command from `ccc` to `cce`
- Migrated config directory from `~/.config/ccc` to `~/.config/cce`

### Fixed

- Added missing `express` dependency and refactored webuiServer module

### Security

- Fixed path traversal vulnerability preventing unauthorized file access

## [0.0.1] - 2026-02-16

Initial release.

### Added

- **CLI Framework**: TypeScript + Commander-based CLI tool for managing Claude API configurations
- **Profile Management**: `create/use/list/show/edit/remove/current` commands for managing API profiles
- **Config Generation**: Auto-generates Claude Code (`~/.claude/settings.json`) and OpenCode (`~/.config/opencode/opencode.json`) configuration files
- **OpenCode Model Support**: Interactive model selection and configuration for OpenCode
- **Interactive Selection**: Profile switching with interactive prompt when no profile name is specified
- `doctor` command to validate configuration health
- `init` command to bootstrap the config directory

### Changed

- Renamed `switch` command to `use` for a more intuitive CLI experience
- Restructured project to standard npm package layout
- Removed hook commands and shell integration logic in favor of a simpler architecture

[Unreleased]: https://github.com/ding112/claude-code-env/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/ding112/claude-code-env/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/ding112/claude-code-env/compare/0.1.0...v1.0.1
[0.1.0]: https://github.com/ding112/claude-code-env/compare/0.0.1...0.1.0
[0.0.1]: https://github.com/ding112/claude-code-env/releases/tag/0.0.1
