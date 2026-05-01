import path from 'path';
import os from 'os';
import type { CliConfig } from '../types/index.js';

export const CONFIG_DIR = path.join(os.homedir(), '.config', 'cce');
export const PROFILES_DIR = path.join(CONFIG_DIR, 'profiles');
export const PROVIDERS_DIR = path.join(CONFIG_DIR, 'providers');
export const ACTIVE_FILE = path.join(CONFIG_DIR, 'active');
export const SOURCES_USER_FILE = path.join(CONFIG_DIR, 'sources.json');

export function getConfig(): CliConfig {
  return {
    configDir: CONFIG_DIR,
    profilesDir: PROFILES_DIR,
    providersDir: PROVIDERS_DIR,
    activeFile: ACTIVE_FILE,
    sourcesFile: SOURCES_USER_FILE,
  };
}
