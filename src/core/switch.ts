import { getActiveProfile, setActiveProfile, getProfile } from './profile.js';
import { getProvider } from './provider.js';
import { generateAllConfigs } from './configGenerator.js';
import type { Profile, Provider, EffectiveConfig } from '../types/index.js';

export interface SwitchResult {
  success: boolean;
  profileName: string;
  providerName: string;
  model: string;
  configsApplied: {
    claude: boolean;
    opencode: boolean;
  };
  errors: string[];
}

export interface SwitchOptions {
  quiet?: boolean;
}

export async function switchProfile(
  profileName: string,
  opts: SwitchOptions = {}
): Promise<SwitchResult> {
  const result: SwitchResult = {
    success: false,
    profileName,
    providerName: '',
    model: '',
    configsApplied: {
      claude: false,
      opencode: false,
    },
    errors: [],
  };

  try {
    const profile = await getProfile(profileName);
    if (!profile) {
      result.errors.push(`Profile '${profileName}' 不存在`);
      return result;
    }

    const provider = await getProvider(profile.provider);
    if (!provider) {
      result.errors.push(`Profile 引用的 Provider '${profile.provider}' 不存在`);
      return result;
    }

    const config = resolveConfig(profile, provider);
    result.providerName = provider.name;
    result.model = config.model;

    if (!opts.quiet) {
      console.log();
      console.log(`激活 Profile: ${profileName}`);
      console.log(`  Provider: ${provider.displayName} (${provider.name})`);
      console.log(`  模型: ${config.model}${config.isModelOverridden ? ' (覆盖)' : ' (默认)'}`);
    }

    const configResults = await generateAllConfigs(config);
    result.configsApplied = configResults;

    if (!opts.quiet) {
      if (configResults.claude) {
        console.log(`  ✓ Claude Code 已配置`);
      } else {
        console.log(`  ✗ Claude Code 配置失败`);
      }
      if (configResults.opencode) {
        console.log(`  ✓ OpenCode 已配置`);
      } else {
        console.log(`  ✗ OpenCode 配置失败`);
      }
    }

    await setActiveProfile(profileName);
    result.success = configResults.claude && configResults.opencode;

    if (!opts.quiet && result.success) {
      console.log();
      console.log(`✓ Profile '${profileName}' 已激活`);
    }

    return result;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    result.errors.push(errorMessage);
    return result;
  }
}

function resolveConfig(profile: Profile, provider: Provider): EffectiveConfig {
  const model = profile.model || provider.defaultModel;

  return {
    baseURL: provider.baseURL,
    apiKey: provider.apiKey,
    model,
    providerName: provider.name,
    providerDisplayName: provider.displayName,
    isModelOverridden: !!profile.model,
  };
}
