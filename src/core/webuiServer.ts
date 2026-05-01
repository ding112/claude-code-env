import path from 'path';
import express from 'express';
import { logger } from '../utils/logger.js';
import { listProfiles, getProfile, saveProfile, deleteProfile, getActiveProfile } from './profile.js';
import { listProviders, getProvider, saveProvider, deleteProvider, isProviderInUse, getProviderUsage } from './provider.js';
import { switchProfile } from './switch.js';
import { getTemplate, getAllTemplates } from './sourceTemplates.js';
import type { Profile, Provider, ProviderType, SourceType, ProfileClaudeCodeSettings } from '../types/index.js';
import { validSources } from '../types/index.js';

// WebUI 静态文件目录
const WEBUI_DIR = path.resolve(__dirname, '..', '..', 'webui');


/**
 * 清理并验证 Claude Code 高级设置输入
 */
function sanitizeClaudeCodeSettingsInput(input: unknown): ProfileClaudeCodeSettings | undefined {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return undefined;
  const source = input as Record<string, unknown>;
  const cleaned: ProfileClaudeCodeSettings = {
    ...(typeof source.defaultOpusModel === 'string' && source.defaultOpusModel.trim()
      ? { defaultOpusModel: source.defaultOpusModel.trim() } : {}),
    ...(typeof source.defaultSonnetModel === 'string' && source.defaultSonnetModel.trim()
      ? { defaultSonnetModel: source.defaultSonnetModel.trim() } : {}),
    ...(typeof source.defaultHaikuModel === 'string' && source.defaultHaikuModel.trim()
      ? { defaultHaikuModel: source.defaultHaikuModel.trim() } : {}),
    ...(typeof source.subagentModel === 'string' && source.subagentModel.trim()
      ? { subagentModel: source.subagentModel.trim() } : {}),
    ...(source.effortLevel === 'low' || source.effortLevel === 'medium'
      || source.effortLevel === 'high' || source.effortLevel === 'max'
      ? { effortLevel: source.effortLevel } : {}),
  };
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

/**
 * 过滤 Provider 敏感字段，返回安全的 Provider 信息
 */
function sanitizeProvider(provider: Provider) {
  return {
    name: provider.name,
    displayName: provider.displayName,
    type: provider.type,
    source: provider.source,
    baseURL: provider.baseURL,
    models: provider.models,
    defaultModel: provider.defaultModel,
    createdAt: provider.createdAt,
    updatedAt: provider.updatedAt,
  };
}

export interface WebUIServerOptions {
  port?: number;
  open?: boolean;
}

export async function startWebUI(options: WebUIServerOptions = {}): Promise<void> {
  const port = options.port || 3456;
  const app = express();

  // 中间件
  app.use(express.json());
  app.use(express.static(WEBUI_DIR));

  // ============================================================================
  // API Routes
  // ============================================================================

  // 获取所有 profiles
  app.get('/api/profiles', async (req, res) => {
    try {
      const profiles = await listProfiles();
      const activeName = await getActiveProfile();
      const providers = await listProviders();

      // 为每个 profile 添加详细信息
      const enrichedProfiles = await Promise.all(
        profiles.map(async (profile) => {
          const provider = providers.find(p => p.name === profile.provider);
          const isActive = profile.name === activeName;

          return {
            ...profile,
            isActive,
            providerDisplayName: provider?.displayName || profile.provider,
            providerType: provider?.type || 'unknown',
            defaultModel: provider?.defaultModel,
            availableModels: provider?.models || [],
          };
        })
      );

      res.json({ profiles: enrichedProfiles });
    } catch (error) {
      logger.error('获取 profiles 失败', error);
      res.status(500).json({ error: '获取配置列表失败' });
    }
  });

  // 获取当前激活的 profile
  app.get('/api/current', async (req, res) => {
    try {
      const activeName = await getActiveProfile();

      if (!activeName) {
        res.json({ active: null, profile: null });
        return;
      }

      const profile = await getProfile(activeName);

      if (!profile) {
        res.json({ active: activeName, profile: null });
        return;
      }

      const provider = await getProvider(profile.provider);
      const model = profile.model || provider?.defaultModel || '';

      res.json({
        active: activeName,
        profile: {
          ...profile,
          providerDisplayName: provider?.displayName || profile.provider,
          model,
        },
      });
    } catch (error) {
      logger.error('获取当前配置失败', error);
      res.status(500).json({ error: '获取当前配置失败' });
    }
  });

  // 获取单个 profile 详情
  app.get('/api/profiles/:name', async (req, res) => {
    try {
      const profile = await getProfile(req.params.name);

      if (!profile) {
        res.status(404).json({ error: `Profile '${req.params.name}' 不存在` });
        return;
      }

      const provider = await getProvider(profile.provider);

      res.json({
        ...profile,
        providerDisplayName: provider?.displayName || profile.provider,
        providerType: provider?.type || 'unknown',
        defaultModel: provider?.defaultModel,
        availableModels: provider?.models || [],
      });
    } catch (error) {
      logger.error('获取 profile 详情失败', error);
      res.status(500).json({ error: '获取配置详情失败' });
    }
  });

  // 创建 profile
  app.post('/api/profiles', async (req, res) => {
    try {
      const { name, description, provider, model, useNow, claudeCodeSettings } = req.body;

      if (!name || !provider) {
        res.status(400).json({ error: 'name 和 provider 为必填项' });
        return;
      }

      // 验证名称格式，防止路径遍历攻击
      if (name.includes('..') || name.includes('/') || name.includes('\\')) {
        res.status(400).json({ error: '名称包含非法字符' });
        return;
      }

      // 验证名称长度
      if (name.length > 64) {
        res.status(400).json({ error: '名称长度不能超过64个字符' });
        return;
      }

      // 验证描述长度
      if (description && description.length > 256) {
        res.status(400).json({ error: '描述长度不能超过256个字符' });
        return;
      }

      // 验证模型名称长度
      if (model && model.length > 128) {
        res.status(400).json({ error: '模型名称长度不能超过128个字符' });
        return;
      }

      // 检查是否已存在
      const existing = await getProfile(name);
      if (existing) {
        res.status(400).json({ error: `Profile '${name}' 已存在` });
        return;
      }

      // 验证 provider 是否存在
      const providerData = await getProvider(provider);
      if (!providerData) {
        res.status(400).json({ error: `Provider '${provider}' 不存在` });
        return;
      }

      // 清理并验证 claudeCodeSettings
      const sanitizedClaudeCodeSettings = sanitizeClaudeCodeSettingsInput(claudeCodeSettings);

      const now = new Date().toISOString();
      const profile: Profile = {
        name,
        description,
        provider,
        model: model || undefined,
        claudeCodeSettings: sanitizedClaudeCodeSettings,
        createdAt: now,
        updatedAt: now,
      };

      await saveProfile(profile);

      // 如果需要立即启用
      if (useNow) {
        await switchProfile(name, { quiet: true });
      }

      res.json({ created: name, used: useNow });
    } catch (error) {
      logger.error('创建 profile 失败', error);
      const message = error instanceof Error ? error.message : '创建失败';
      res.status(500).json({ error: message });
    }
  });

  // 更新 profile
  app.put('/api/profiles/:name', async (req, res) => {
    try {
      const oldName = req.params.name;
      const { name, description, provider, model, claudeCodeSettings } = req.body;

      const existing = await getProfile(oldName);
      if (!existing) {
        res.status(404).json({ error: `Profile '${oldName}' 不存在` });
        return;
      }

      // 如果更改了 provider，验证新 provider 是否存在
      if (provider && provider !== existing.provider) {
        const providerData = await getProvider(provider);
        if (!providerData) {
          res.status(400).json({ error: `Provider '${provider}' 不存在` });
          return;
        }
      }

      // 如果更改了名称，需要删除旧文件
      if (name && name !== oldName) {
        const newNameExists = await getProfile(name);
        if (newNameExists) {
          res.status(400).json({ error: `Profile '${name}' 已存在` });
          return;
        }
        await deleteProfile(oldName);
      }

      // 清理并验证 claudeCodeSettings
      const sanitizedClaudeCodeSettings = claudeCodeSettings !== undefined
        ? sanitizeClaudeCodeSettingsInput(claudeCodeSettings)
        : existing.claudeCodeSettings;

      const updatedProfile: Profile = {
        name: name || oldName,
        description: description ?? existing.description,
        provider: provider || existing.provider,
        model: model ?? existing.model,
        claudeCodeSettings: sanitizedClaudeCodeSettings,
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString(),
      };

      await saveProfile(updatedProfile);

      // 如果更改了名称且是当前激活的 profile，更新 active 文件
      const activeName = await getActiveProfile();
      if (activeName === oldName && name && name !== oldName) {
        const { setActiveProfile } = await import('./profile.js');
        await setActiveProfile(name);
      }

      res.json({ updated: updatedProfile.name });
    } catch (error) {
      logger.error('更新 profile 失败', error);
      const message = error instanceof Error ? error.message : '更新失败';
      res.status(500).json({ error: message });
    }
  });

  // 删除 profile
  app.delete('/api/profiles/:name', async (req, res) => {
    try {
      const name = req.params.name;

      const existing = await getProfile(name);
      if (!existing) {
        res.status(404).json({ error: `Profile '${name}' 不存在` });
        return;
      }

      // 检查是否是当前激活的 profile
      const activeName = await getActiveProfile();
      if (activeName === name) {
        const { clearActiveProfile } = await import('./profile.js');
        await clearActiveProfile();
      }

      await deleteProfile(name);
      res.json({ deleted: name });
    } catch (error) {
      logger.error('删除 profile 失败', error);
      const message = error instanceof Error ? error.message : '删除失败';
      res.status(500).json({ error: message });
    }
  });

  // 启用 profile
  app.post('/api/use', async (req, res) => {
    try {
      const { name } = req.body;

      if (!name) {
        res.status(400).json({ error: 'name 为必填项' });
        return;
      }

      const result = await switchProfile(name, { quiet: true });

      if (!result.success) {
        res.status(400).json({ error: result.errors.join('; ') });
        return;
      }

      res.json({ used: name, ...result });
    } catch (error) {
      logger.error('启用 profile 失败', error);
      const message = error instanceof Error ? error.message : '启用失败';
      res.status(500).json({ error: message });
    }
  });

  // 获取所有 providers
  app.get('/api/providers', async (req, res) => {
    try {
      const providers = await listProviders();
      const safeProviders = providers.map(sanitizeProvider);
      res.json({ providers: safeProviders });
    } catch (error) {
      logger.error('获取 providers 失败', error);
      res.status(500).json({ error: '获取 Provider 列表失败' });
    }
  });

  // 获取单个 provider 详情
  app.get('/api/providers/:name', async (req, res) => {
    try {
      const provider = await getProvider(req.params.name);

      if (!provider) {
        res.status(404).json({ error: `Provider '${req.params.name}' 不存在` });
        return;
      }

      res.json(sanitizeProvider(provider));
    } catch (error) {
      logger.error('获取 provider 详情失败', error);
      res.status(500).json({ error: '获取 Provider 详情失败' });
    }
  });

  // 创建 provider
  app.post('/api/providers', async (req, res) => {
    try {
      const { name, displayName, type, vendor, source, baseURL, apiKey, models, defaultModel } = req.body;

      // source 优先，兼容旧 vendor 字段
      const finalSource = source || vendor;

      // 验证必填字段 (displayName 可选)
      if (!name || !type || !baseURL || !apiKey || !models || !defaultModel) {
        res.status(400).json({ error: 'name, type, baseURL, apiKey, models, defaultModel 为必填项' });
        return;
      }

      // 验证 type
      const validTypes: ProviderType[] = ['openai-compatible', 'anthropic-compatible', 'custom'];
      if (!validTypes.includes(type)) {
        res.status(400).json({ error: `类型必须是: ${validTypes.join(', ')}` });
        return;
      }

      // 验证 source 为必填
      if (!finalSource) {
        res.status(400).json({ error: 'source 为必填项' });
        return;
      }

      // 验证名称格式，防止路径遍历攻击
      if (name.includes('..') || name.includes('/') || name.includes('\\')) {
        res.status(400).json({ error: '名称包含非法字符' });
        return;
      }

      // 验证名称长度
      if (name.length > 64) {
        res.status(400).json({ error: '名称长度不能超过64个字符' });
        return;
      }

      // 验证 baseURL 格式
      try {
        const url = new URL(baseURL);
        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new Error('只支持 http 和 https 协议');
        }
      } catch {
        res.status(400).json({ error: 'Base URL 格式无效，必须是有效的 http/https URL' });
        return;
      }

      // 验证 models 数组
      if (!Array.isArray(models) || models.length === 0) {
        res.status(400).json({ error: '可用模型列表不能为空' });
        return;
      }

      // 过滤并验证模型名称
      const cleanedModels = models.map(m => m.trim()).filter(m => m);
      if (cleanedModels.length === 0) {
        res.status(400).json({ error: '可用模型列表不能为空' });
        return;
      }

      // 验证 defaultModel 在 models 中
      if (!cleanedModels.includes(defaultModel.trim())) {
        res.status(400).json({ error: '默认模型必须在可用模型列表中' });
        return;
      }

      // 检查是否已存在
      const existing = await getProvider(name);
      if (existing) {
        res.status(400).json({ error: `Provider '${name}' 已存在` });
        return;
      }

      const now = new Date().toISOString();
      const provider: Provider = {
        name,
        displayName: displayName?.trim() || name, // displayName 可选，默认使用 name
        type,
        source: finalSource,
        baseURL: baseURL.trim().replace(/\/+$/, ''), // 移除末尾斜杠
        apiKey: apiKey.trim(),
        models: cleanedModels,
        defaultModel: defaultModel.trim(),
        createdAt: now,
        updatedAt: now,
      };

      await saveProvider(provider);
      res.json({ created: name });
    } catch (error) {
      logger.error('创建 provider 失败', error);
      const message = error instanceof Error ? error.message : '创建失败';
      res.status(500).json({ error: message });
    }
  });

  // 更新 provider
  app.put('/api/providers/:name', async (req, res) => {
    try {
      const name = req.params.name;
      const { displayName, type, vendor, source, baseURL, apiKey, models, defaultModel } = req.body;

      const existing = await getProvider(name);
      if (!existing) {
        res.status(404).json({ error: `Provider '${name}' 不存在` });
        return;
      }

      // 确定最终的 type
      const finalType: ProviderType = (type as ProviderType) ?? existing.type;

      // 验证 type
      if (type) {
        const validTypes: ProviderType[] = ['openai-compatible', 'anthropic-compatible', 'custom'];
        if (!validTypes.includes(type as ProviderType)) {
          res.status(400).json({ error: `类型必须是: ${validTypes.join(', ')}` });
          return;
        }
      }

      // source 优先，兼容旧 vendor 字段
      const finalSource = (source || vendor) !== undefined
        ? ((source || vendor) as SourceType)
        : existing.source;
      if (!finalSource) {
        res.status(400).json({ error: 'source 为必填项，请补选 source' });
        return;
      }

      // 验证 baseURL 格式
      if (baseURL) {
        try {
          const url = new URL(baseURL);
          if (!['http:', 'https:'].includes(url.protocol)) {
            throw new Error('只支持 http 和 https 协议');
          }
        } catch {
          res.status(400).json({ error: 'Base URL 格式无效，必须是有效的 http/https URL' });
          return;
        }
      }

      // 验证 models 数组
      let cleanedModels = existing.models;
      if (models !== undefined) {
        if (!Array.isArray(models) || models.length === 0) {
          res.status(400).json({ error: '可用模型列表不能为空' });
          return;
        }
        cleanedModels = models.map((m: string) => m.trim()).filter((m: string) => m);
        if (cleanedModels.length === 0) {
          res.status(400).json({ error: '可用模型列表不能为空' });
          return;
        }
      }

      // 验证 defaultModel 在 models 中
      const finalDefaultModel = defaultModel !== undefined ? defaultModel.trim() : existing.defaultModel;
      if (!cleanedModels.includes(finalDefaultModel)) {
        res.status(400).json({ error: '默认模型必须在可用模型列表中' });
        return;
      }

      const updatedProvider: Provider = {
        name,
        displayName: displayName?.trim() ?? existing.displayName,
        type: finalType,
        source: finalSource,
        baseURL: baseURL ? baseURL.trim().replace(/\/+$/, '') : existing.baseURL,
        apiKey: apiKey?.trim() ?? existing.apiKey,
        models: cleanedModels,
        defaultModel: finalDefaultModel,
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString(),
      };

      await saveProvider(updatedProvider);
      res.json({ updated: name });
    } catch (error) {
      logger.error('更新 provider 失败', error);
      const message = error instanceof Error ? error.message : '更新失败';
      res.status(500).json({ error: message });
    }
  });

  // 删除 provider
  app.delete('/api/providers/:name', async (req, res) => {
    try {
      const name = req.params.name;

      const existing = await getProvider(name);
      if (!existing) {
        res.status(404).json({ error: `Provider '${name}' 不存在` });
        return;
      }

      // 检查是否被 Profile 使用
      const inUse = await isProviderInUse(name);
      if (inUse) {
        const usingProfiles = await getProviderUsage(name);
        res.status(400).json({
          error: `Provider '${name}' 正在被以下配置使用: ${usingProfiles.join(', ')}，请先删除或修改这些配置`,
        });
        return;
      }

      await deleteProvider(name);
      res.json({ deleted: name });
    } catch (error) {
      logger.error('删除 provider 失败', error);
      const message = error instanceof Error ? error.message : '删除失败';
      res.status(500).json({ error: message });
    }
  });

  // 获取所有 Source 模板
  app.get('/api/source-templates', async (req, res) => {
    try {
      const templates = getAllTemplates().map(([source, tmpl]) => ({
        source: tmpl.source,
        displayName: tmpl.displayName,
        type: tmpl.type,
        baseURL: tmpl.baseURL,
        models: tmpl.models,
        defaultModel: tmpl.defaultModel,
        description: tmpl.description,
      }));
      res.json({ templates });
    } catch (error) {
      logger.error('获取 Source 模板失败', error);
      res.status(500).json({ error: '获取 Source 模板失败' });
    }
  });

  // 启动服务器
  // 注意：Promise 保持 pending 状态，防止 Node.js 进程退出导致服务停止
  return new Promise<void>((resolve, reject) => {
    // 绑定到 localhost，防止局域网访问
    const server = app.listen(port, '127.0.0.1', () => {
      console.log(`\n  WebUI 服务已启动: http://127.0.0.1:${port}\n`);

      if (options.open !== false) {
        import('open').then((open) => {
          open.default(`http://localhost:${port}`).catch((err) => {
            logger.warn('无法自动打开浏览器', err);
          });
        }).catch(() => {
          logger.warn('无法自动打开浏览器');
        });
      }

      // 不调用 resolve()，让 Promise 保持 pending，服务持续运行
    });

    server.on('error', (err) => {
      reject(err);
    });
  });
}