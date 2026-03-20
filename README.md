[中文文档](README_CN.md)

# claude-code-env (cce)

A CLI tool for managing multiple Claude API configurations via a Provider-Profile architecture, configuring both [Claude Code](https://docs.anthropic.com/en/docs/claude-code) and [OpenCode](https://github.com/opencode-ai/opencode) simultaneously.

## Features

- Provider-Profile architecture: separate API endpoint definitions from user configurations
- Switch profiles to update Claude Code and OpenCode configs at once
- Secure API key management with strict file permissions (0o600/0o700)
- Interactive CLI with [Inquirer.js](https://github.com/SBoudrias/Inquirer.js)
- WebUI management dashboard
- Built-in configuration diagnostics (`cce doctor`)

## Installation

```bash
npm install -g @mengzai1/cce
```

Requires Node.js >= 16.0.0.

## Quick Start

```bash
# 1. Initialize config directory (~/.config/cce)
cce init

# 2. Add a provider (e.g. Volcano Engine)
cce provider add volcano

# 3. Create a profile referencing the provider
cce create work

# 4. Activate the profile
cce use work
```

## Commands

### Profile Management

| Command | Alias | Description |
|---------|-------|-------------|
| `cce init` | | Initialize the configuration directory |
| `cce create <name>` | | Create a new profile (interactively select a provider) |
| `cce use [name]` | | Activate a profile (interactive selection if name is omitted) |
| `cce list` | `ls` | List all profiles |
| `cce current` | `c` | Show the currently active profile |
| `cce show <name>` | | Show profile details |
| `cce edit <name>` | | Edit a profile |
| `cce remove <name>` | `rm` | Remove a profile |

### Provider Management

| Command | Description |
|---------|-------------|
| `cce provider add <type>` | Add a new provider |
| `cce provider list` | List all providers |
| `cce provider show <name>` | Show provider details |
| `cce provider edit <name>` | Edit a provider |
| `cce provider remove <name>` | Remove a provider |

Supported provider types: `openai-compatible`, `anthropic-compatible`, `custom`

### Other Commands

| Command | Description |
|---------|-------------|
| `cce doctor` | Check configuration for issues |
| `cce ui` | Launch the WebUI dashboard |

`cce ui` options:
- `-p, --port <port>` — specify a port
- `--no-open` — don't auto-open the browser

## How It Works

```
Profile (references) -> Provider (resolves) -> EffectiveConfig (generates) -> Config Files
```

When you run `cce use <profile>`:

1. Loads the profile and resolves the referenced provider
2. Merges into an `EffectiveConfig` (baseURL, apiKey, model)
3. Writes Claude Code config (`~/.claude/settings.json`) and OpenCode config (`~/.config/opencode/opencode.json`)

## Configuration

### Directory Layout

```
~/.config/cce/
├── providers/          # Provider definitions
│   └── volcano-prod.json
├── profiles/           # User profiles
│   └── work.json
└── active              # Currently active profile name
```

### Provider Example

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

### Profile Example

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

## FAQ

**Q: What does `cce use` actually modify?**
A: It writes to `~/.claude/settings.json` (Claude Code) and `~/.config/opencode/opencode.json` (OpenCode).

**Q: How are API keys secured?**
A: The `~/.config/cce` directory is set to `700`, config files to `600` (owner read/write only).

**Q: Can I override the model in a profile?**
A: Yes. A profile can specify a `model` field to override the provider's `defaultModel`.

## License

MIT
