import { describe, expect, it } from 'vitest'
import {
  AI_PROVIDERS,
  applyAiEnvironmentOverrides,
  defaultAiSettings,
  resolveAiSettings,
} from '../src/providers'

describe('defaultAiSettings', () => {
  it('gives every provider its default model and an empty key by default', () => {
    const settings = defaultAiSettings()
    expect(settings.provider).toBe('openai')
    for (const meta of AI_PROVIDERS) {
      expect(settings.providers[meta.id].apiKey).toBe('')
      expect(settings.providers[meta.id].model).toBe(meta.defaultModel)
    }
    expect(settings.providers.openai.baseUrl).toBe('https://api.openai.com/v1')
    expect(settings.providers.custom.baseUrl).toBe('')
    expect(settings.providers.anthropic.baseUrl).toBeUndefined()
  })

  it('applies caller-supplied default keys only to the listed providers', () => {
    const settings = defaultAiSettings({ anthropic: 'sk-ant-preset' })
    expect(settings.providers.anthropic.apiKey).toBe('sk-ant-preset')
    expect(settings.providers.gemini.apiKey).toBe('')
  })
})

describe('resolveAiSettings', () => {
  it('returns fresh defaults when nothing is stored', () => {
    const defaults = defaultAiSettings({ anthropic: 'sk-ant-preset' })
    expect(resolveAiSettings({}, defaults)).toEqual(defaults)
  })

  it('migrates the pre-provider single-endpoint shape into the custom provider', () => {
    const defaults = defaultAiSettings()
    const resolved = resolveAiSettings(
      { apiKey: 'legacy-key', model: 'legacy-model', baseUrl: 'https://legacy.example.com/v1' },
      defaults,
    )
    expect(resolved.providers.custom).toEqual({
      apiKey: 'legacy-key',
      model: 'legacy-model',
      baseUrl: 'https://legacy.example.com/v1',
    })
    // untouched providers keep their defaults
    expect(resolved.providers.anthropic).toEqual(defaults.providers.anthropic)
  })

  it('defaults the legacy base URL to the OpenAI endpoint when omitted', () => {
    const resolved = resolveAiSettings({ apiKey: 'legacy-key' }, defaultAiSettings())
    expect(resolved.providers.custom.baseUrl).toBe('https://api.openai.com/v1')
  })

  it('merges stored multi-provider settings over the defaults, provider by provider', () => {
    const defaults = defaultAiSettings({ anthropic: 'preset-key' })
    const resolved = resolveAiSettings(
      {
        provider: 'gemini',
        providers: {
          gemini: { apiKey: 'stored-gemini-key', model: 'gemini-2.5-pro' },
        } as never,
      },
      defaults,
    )
    expect(resolved.provider).toBe('gemini')
    expect(resolved.providers.gemini).toEqual({
      apiKey: 'stored-gemini-key',
      model: 'gemini-2.5-pro',
      baseUrl: undefined,
    })
    // provider not mentioned in stored.providers keeps the computed default
    expect(resolved.providers.anthropic.apiKey).toBe('preset-key')
  })

  it('preserves new default fields when an older stored provider config omits them', () => {
    const resolved = resolveAiSettings(
      {
        provider: 'openai',
        providers: {
          openai: { apiKey: 'proxy-key', model: 'codex-tools' },
        } as never,
      },
      defaultAiSettings(),
    )

    expect(resolved.provider).toBe('openai')
    expect(resolved.providers.openai).toEqual({
      apiKey: 'proxy-key',
      model: 'codex-tools',
      baseUrl: 'https://api.openai.com/v1',
    })
  })
})

describe('applyAiEnvironmentOverrides', () => {
  it('leaves settings unchanged when no Byeol AI variables are set', () => {
    const settings = defaultAiSettings()
    expect(applyAiEnvironmentOverrides(settings, {})).toBe(settings)
  })

  it('selects the OpenAI transport and overlays a StarProxy tool alias', () => {
    const settings = defaultAiSettings()
    const overridden = applyAiEnvironmentOverrides(settings, {
      BYEOL_AI_BASE_URL: ' http://127.0.0.1:8300/v1 ',
      BYEOL_AI_API_KEY: ' proxy-key ',
      BYEOL_AI_MODEL: ' codex-tools ',
    })

    expect(overridden.provider).toBe('openai')
    expect(overridden.providers.openai).toEqual({
      apiKey: 'proxy-key',
      model: 'codex-tools',
      baseUrl: 'http://127.0.0.1:8300/v1',
    })
    expect(settings.provider).toBe('openai')
  })
})
