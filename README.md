[中文文档](README_CN.md)

# claude-code-env (cce) - Claude Configuration Switcher

A CLI tool for managing multiple Claude API configurations via a Provider-Profile architecture, configuring both Claude Code and OpenCode simultaneously.

## Features

- 🚀 Quickly switch between API configurations (updates both Claude Code and OpenCode)
- 🔒 Secure API key management (file permissions 0o600/0o700)
- 🎯 Interactive command-line interface
- 🌐 WebUI management dashboard
- 🧪 Built-in configuration diagnostics

## Installation

```bash
npm install -g claude-code-env
```

## Quick Start

### 1. Initialize

```bash
cce init
```

### 2. Add a Provider

```bash
# Add a Volcano Engine provider
cce provider add volcano
```

### 3. Create a Profile

```bash
# Create a profile (interactively select a provider)
cce create work
```

### 4. Activate a Profile

```bash
cce use work
```

## Command Reference

### Core Commands

| Command | Description |
|---------|-------------|
| `cce init` | Initialize the configuration directory |
| `cce create <name>` | Create a new profile (interactively select a provider) |
| `cce use [name]` | Activate a profile (interactive selection if name is omitted) |
| `cce list` | List all profiles |
| `cce current` | Show the currently active profile |
| `cce ui` | Launch the WebUI management dashboard |

### Provider Commands

| Command | Description |
|---------|-------------|
| `cce provider add <type>` | Add a new provider (volcano, bailian, deepseek, openai-compatible, claude-native, custom) |
| `cce provider list` | List all providers |
| `cce provider show <name>` | Show provider details |
| `cce provider edit <name>` | Edit a provider |
| `cce provider remove <name>` | Remove a provider |

### Management Commands

| Command | Description |
|---------|-------------|
| `cce show <name>` | Show profile details |
| `cce edit <name>` | Edit a profile |
| `cce remove <name>` | Remove a profile |
| `cce doctor` | Check configuration for issues |

## Configuration Format

### Provider Configuration (`~/.config/cce/providers/`)

```json
{
  "name": "volcano-prod",
  "displayName": "Volcano Engine Production",
  "type": "openai-compatible",
  "baseURL": "https://ark.cn-beijing.volces.com/api/v3",
  "apiKey": "your-api-key",
  "models": ["ep-20250101-xxxx", "ep-20250201-yyyy"],
  "defaultModel": "ep-20250201-yyyy"
}
```

### Profile Configuration (`~/.config/cce/profiles/`)

```json
{
  "name": "work",
  "description": "Work environment",
  "provider": "volcano-prod",
  "model": "ep-20250101-xxxx",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Directory Structure

```
~/.config/cce/
├── providers/          # Provider configurations
│   └── volcano-prod.json
├── profiles/           # Profile configurations
│   └── work.json
└── active              # Name of the currently active profile
```

## FAQ

### Q: What does `cce use` do?

A: It updates both the Claude Code configuration (`~/.claude/settings.json`) and the OpenCode configuration (`~/.config/opencode/opencode.json`) simultaneously.

### Q: How do I check the currently active configuration?

A: Run `cce current` to see the currently active profile.

### Q: What are the file permissions?

A: The configuration directory is set to `700`, and configuration files are set to `600` (owner read/write only).

## License

MIT
