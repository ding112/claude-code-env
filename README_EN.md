[中文文档](README.md)

# claude-code-env (cce)

A CLI tool for managing multiple Claude API configurations via a Provider-Profile architecture, configuring [Claude Code](https://docs.anthropic.com/en/docs/claude-code).

## Features

- Provider-Profile architecture: separate API endpoint definitions from user configurations
- **Source Template system**: built-in templates for DeepSeek, Volcengine, Tencent, Alibaba, OpenAI, Anthropic — auto-fills default values
- Switch profiles to update Claude Code config at once
- Secure API key management with strict file permissions (0o600/0o700)
- Interactive CLI with [Inquirer.js](https://github.com/SBoudrias/Inquirer.js)
- WebUI management dashboard with dynamic source template selection
- Built-in configuration diagnostics (`cce doctor`)
- Profile-level Claude Code advanced settings (model overrides, effort level)

## Installation

```bash
npm install -g @mengzai1/cce
```

Requires Node.js >= 16.0.0.

## Quick Start

```bash
# 1. Initialize config directory (~/.config/cce)
cce init

# 2. Add a provider (select a source for auto-filled defaults)
cce provider add

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
| `cce provider add` | Add a new provider (select a Source template first for auto-filled defaults) |
| `cce provider list` | List all providers |
| `cce provider show <name>` | Show provider details |
| `cce provider edit <name>` | Edit a provider |
| `cce provider remove <name>` | Remove a provider |

Supported provider types: `openai-compatible`, `anthropic-compatible`, `custom`

Supported sources (templates): `deepseek`, `volcengine`, `tencent`, `alibaba`, `openai`, `anthropic`, `custom`

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
Source Template (built-in JSON) -> Provider (resolves) -> Profile (references) -> EffectiveConfig (generates) -> Config Files
```

When you run `cce provider add`, you first select a **Source** — the built-in template auto-fills the baseURL, available models, and default model. You can then customize or override any value.

When you run `cce use <profile>`:

1. Loads the profile and resolves the referenced provider
2. Merges into an `EffectiveConfig` (baseURL, apiKey, model)
3. Writes Claude Code config (`~/.claude/settings.json`)

## Configuration

### Directory Layout

```
~/.config/cce/
├── providers/          # Provider definitions
│   └── volcano-prod.json
├── profiles/           # User profiles
│   └── work.json
├── sources.json        # (Optional) User source template overrides
└── active              # Currently active profile name
```

### Provider Example

```json
{
  "name": "volcano-prod",
  "displayName": "Volcano Engine Production",
  "type": "openai-compatible",
  "source": "volcengine",
  "baseURL": "https://ark.cn-beijing.volces.com/api/v3",
  "apiKey": "your-api-key",
  "models": ["ep-20250101-xxxx", "ep-20250201-yyyy"],
  "defaultModel": "ep-20250201-yyyy"
}
```

### Source Template Example

Built-in source templates are defined in `src/core/sources.json`. You can override them by creating `~/.config/cce/sources.json`:

```json
{
  "deepseek": {
    "source": "deepseek",
    "displayName": "DeepSeek",
    "type": "anthropic-compatible",
    "baseURL": "https://api.deepseek.com/anthropic",
    "models": ["deepseek-v4-flash", "deepseek-v4-pro"],
    "defaultModel": "deepseek-v4-flash",
    "description": "DeepSeek API — compatible with anthropic protocol"
  }
}
```

### Profile Example

```json
{
  "name": "work",
  "description": "Work environment",
  "provider": "volcano-prod",
  "model": "ep-20250101-xxxx",
  "claudeCodeSettings": {
    "defaultSonnetModel": "claude-sonnet-4-20250514",
    "defaultHaikuModel": "claude-haiku-4-20250514",
    "effortLevel": "high"
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

Profile-level `claudeCodeSettings` (optional) allows overriding Claude Code model settings per profile:
- `defaultOpusModel`, `defaultSonnetModel`, `defaultHaikuModel` — override default model per tier
- `subagentModel` — subagent model override
- `effortLevel` — `low`, `medium`, `high`, or `max`

## FAQ

**Q: What does `cce use` actually modify?**
A: It writes to `~/.claude/settings.json` (Claude Code).

**Q: How are API keys secured?**
A: The `~/.config/cce` directory is set to `700`, config files to `600` (owner read/write only).

**Q: Can I override the model in a profile?**
A: Yes. A profile can specify a `model` field to override the provider's `defaultModel`.

**Q: What is a Source template?**
A: A Source template provides pre-filled defaults (baseURL, models, defaultModel) when adding a new provider. Built-in sources include DeepSeek, Volcengine, Tencent, Alibaba, OpenAI, and Anthropic.

**Q: Can I customize the built-in source templates?**
A: Yes. Create `~/.config/cce/sources.json` with your overrides. It follows the same format as `src/core/sources.json` and takes precedence over built-in templates.

**Q: What is the `source` field on a Provider?**
A: It records which template was used to create this provider, serving as a configuration origin tag. It does not affect runtime behavior.

## License

MIT
