import type { AiProviderId, AiProviderMeta, AiSettings, LegacyAiSettings } from './types'

/**
 * Genspark server-side LLM proxy endpoints. All three protocols share the
 * api_key from the gsk login; model ids follow the proxy's own naming scheme,
 * which differs from the official vendor ids.
 */
export const GENSPARK_LLM_BASE_URLS = {
  anthropic: 'https://www.genspark.ai/api/anthropic',
  gemini: 'https://www.genspark.ai/api/llm_proxy/gemini/v1beta',
  openai: 'https://www.genspark.ai/api/llm_proxy/v1',
} as const

/**
 * Upstream Genspark compatibility identifier. The service attributes gsk-key
 * traffic by X-Agent-Type, so this protocol value must remain `genoffice`
 * even though the fork's public product name is Byeol Suite. It is never sent
 * to direct vendor APIs.
 */
export const GENSPARK_AGENT_TYPE = 'genoffice'

export function gensparkAttributionHeaders(baseUrl?: string): Record<string, string> {
  return baseUrl?.startsWith('https://www.genspark.ai')
    ? { 'X-Agent-Type': GENSPARK_AGENT_TYPE }
    : {}
}

export const AI_PROVIDERS: AiProviderMeta[] = [
  {
    id: 'openai',
    label: 'OpenAI compatible',
    models: [
      'codex-tools',
      'claude-tools',
      'gpt-5.2',
      'gpt-4.1',
      'gpt-4.1-mini',
      'gpt-4o',
      'gpt-4o-mini',
    ],
    defaultModel: 'gpt-4.1-mini',
    keyPlaceholder: 'sk-...',
    needsBaseUrl: true,
    defaultBaseUrl: 'https://api.openai.com/v1',
  },
  {
    id: 'anthropic',
    label: 'Claude',
    models: [
      'claude-sonnet-5',
      'claude-opus-4-8',
      'claude-opus-4-7',
      'claude-sonnet-4-6',
      'claude-opus-4-6',
      'claude-opus-4-5-20251101',
      'claude-haiku-4-5-20251001',
      'claude-sonnet-4-5-20250929',
    ],
    defaultModel: 'claude-opus-4-7',
    keyPlaceholder: 'sk-ant-api03-...',
  },
  {
    id: 'gemini',
    label: 'Gemini',
    models: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'],
    defaultModel: 'gemini-2.5-flash',
    keyPlaceholder: 'AIza...',
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    defaultModel: 'deepseek-chat',
    keyPlaceholder: 'sk-...',
  },
  {
    id: 'custom',
    label: 'Legacy custom',
    models: [],
    defaultModel: '',
    keyPlaceholder: 'API Key',
    needsBaseUrl: true,
  },
  {
    id: 'genspark',
    label: 'Genspark (optional)',
    models: [
      'claude-opus-4-7',
      'claude-opus-4-8',
      'claude-sonnet-4-6',
      'claude-haiku-4-5',
      'gpt-5.2',
      'gemini-3.1-pro-preview',
      'gemini-3-flash-preview',
    ],
    defaultModel: 'claude-opus-4-7',
    keyPlaceholder: 'Not required - sign in to Genspark',
  },
]

/**
 * Fresh settings with every provider's default model and an empty key,
 * except providers listed in `defaultApiKeys` (e.g. an app-specific
 * preconfigured Anthropic key). Callers own that policy; this package
 * has no hardcoded keys.
 */
export function defaultAiSettings(
  defaultApiKeys?: Partial<Record<AiProviderId, string>>,
): AiSettings {
  const providers = {} as AiSettings['providers']
  for (const meta of AI_PROVIDERS) {
    providers[meta.id] = {
      apiKey: defaultApiKeys?.[meta.id] ?? '',
      model: meta.defaultModel,
      baseUrl: meta.needsBaseUrl ? (meta.defaultBaseUrl ?? '') : undefined,
    }
  }
  return { provider: 'openai', providers }
}

/**
 * Merge on-disk settings over freshly computed defaults, migrating the
 * pre-provider shape (a single OpenAI-compatible endpoint) into the
 * "custom" provider slot. `stored` is whatever the caller read from its
 * settings file (already JSON-parsed); this function does no file I/O.
 */
export function resolveAiSettings(
  stored: Partial<AiSettings> & LegacyAiSettings,
  defaults: AiSettings,
): AiSettings {
  if (!stored.providers) {
    if (stored.apiKey) {
      defaults.providers.custom = {
        apiKey: stored.apiKey,
        model: stored.model ?? '',
        baseUrl: stored.baseUrl ?? 'https://api.openai.com/v1',
      }
    }
    return defaults
  }
  return {
    provider: stored.provider ?? defaults.provider,
    providers: Object.fromEntries(
      Object.entries(defaults.providers).map(([provider, config]) => [
        provider,
        { ...config, ...stored.providers?.[provider as AiProviderId] },
      ]),
    ) as AiSettings['providers'],
  }
}

export interface AiEnvironmentOverrides {
  BYEOL_AI_BASE_URL?: string
  BYEOL_AI_API_KEY?: string
  BYEOL_AI_MODEL?: string
}

/**
 * Select an OpenAI-compatible endpoint for a local run without modifying the
 * persisted settings file. This is primarily useful for shared gateways such
 * as StarProxy: the normal OpenAI provider remains the transport, while a
 * `*-tools` model alias opts a request into the gateway's tool-call bridge.
 */
export function applyAiEnvironmentOverrides(
  settings: AiSettings,
  environment: AiEnvironmentOverrides,
): AiSettings {
  const baseUrl = environment.BYEOL_AI_BASE_URL?.trim()
  const apiKey = environment.BYEOL_AI_API_KEY?.trim()
  const model = environment.BYEOL_AI_MODEL?.trim()
  if (!baseUrl && !apiKey && !model) return settings

  return {
    provider: 'openai',
    providers: {
      ...settings.providers,
      openai: {
        ...settings.providers.openai,
        ...(baseUrl ? { baseUrl } : {}),
        ...(apiKey ? { apiKey } : {}),
        ...(model ? { model } : {}),
      },
    },
  }
}
