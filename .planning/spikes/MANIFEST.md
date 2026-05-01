# Spike Manifest

## Idea

为 `cce provider add` 命令增加 source 模板功能。当用户选择某个已知 source（如 DeepSeek, OpenAI, Anthropic）时，自动填充 baseURL、常用模型列表和默认模型等默认值，减少手动输入负担。

## Requirements

- 模板数据结构需与现有 `Provider` 接口兼容
- 模板仅用于表单预填，不污染最终保存的数据
- Custom source 不留任何默认值，强制用户手动填写
- 每个字段均可独立覆盖/修改
- 无需引入新依赖
- API Key 始终强制用户输入（模板不预设）

## Spikes

| # | Name | Type | Validates | Verdict | Tags |
|---|------|------|-----------|---------|------|
| 001 | source-template-data-model | standard | 每个已知 source 都能提供有意义的默认值（baseURL + 常用模型列表），且用户可覆盖 | ✓ VALIDATED | provider, template, data-model |
| 002 | template-integration-ux | standard | 模板数据能集成到 provider add 命令的 inquirer 表单中，字段自动预填 | ✓ VALIDATED | provider, template, ux, form-integration |
| 003 | template-override-custom | standard | 模板仅用于预填，不污染最终保存的 provider 数据 | ✓ VALIDATED | provider, template, isolation |
