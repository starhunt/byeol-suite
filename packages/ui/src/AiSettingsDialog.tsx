import { useId, useMemo, useState } from 'react'
import type { AiProviderId, AiProviderMeta, AiSettings } from '@byeol/ai-provider'
import './AiSettingsDialog.css'

interface AiSettingsDialogProps {
  settings: AiSettings
  providers: readonly AiProviderMeta[]
  locale?: string
  onSave: (settings: AiSettings) => void | Promise<void>
  onClose: () => void
}

function cloneSettings(settings: AiSettings): AiSettings {
  return {
    provider: settings.provider,
    providers: Object.fromEntries(
      Object.entries(settings.providers).map(([id, value]) => [id, { ...value }]),
    ) as AiSettings['providers'],
  }
}

export function AiSettingsDialog({
  settings,
  providers,
  locale = 'en',
  onSave,
  onClose,
}: AiSettingsDialogProps) {
  const [draft, setDraft] = useState(() => cloneSettings(settings))
  const [saving, setSaving] = useState(false)
  const modelListId = useId()
  const ko = locale.toLowerCase().startsWith('ko')
  const copy = ko
    ? {
        title: 'AI 프로바이더 설정',
        provider: '프로바이더',
        model: '모델',
        apiKey: 'API 키',
        baseUrl: 'Base URL',
        cancel: '취소',
        save: '저장',
        saving: '저장 중…',
        endpointHelp: 'StarProxy 같은 OpenAI 호환 서버를 쓰려면 서버의 /v1 주소를 입력하세요.',
        modelHelp:
          '목록에 없는 모델이나 프록시 별칭도 직접 입력할 수 있습니다. 예: codex-tools, claude-tools',
        gensparkHelp:
          'Genspark는 선택 사항입니다. 이 프로바이더를 선택한 경우에만 Genspark 로그인이 사용됩니다.',
      }
    : {
        title: 'AI provider settings',
        provider: 'Provider',
        model: 'Model',
        apiKey: 'API key',
        baseUrl: 'Base URL',
        cancel: 'Cancel',
        save: 'Save',
        saving: 'Saving…',
        endpointHelp:
          'Enter the /v1 endpoint when using an OpenAI-compatible server such as StarProxy.',
        modelHelp:
          'You can type a model or proxy alias that is not in the list, such as codex-tools or claude-tools.',
        gensparkHelp:
          'Genspark is optional. Its account sign-in is used only when this provider is selected.',
      }
  const visibleProviders = useMemo(
    () => providers.filter((provider) => provider.id !== 'custom' || draft.provider === 'custom'),
    [draft.provider, providers],
  )
  const activeMeta =
    providers.find((provider) => provider.id === draft.provider) ?? visibleProviders[0]
  if (!activeMeta) return null
  const active = draft.providers[draft.provider]

  const updateActive = (patch: Partial<(typeof draft.providers)[AiProviderId]>) => {
    setDraft((current) => ({
      ...current,
      providers: {
        ...current.providers,
        [current.provider]: { ...current.providers[current.provider], ...patch },
      },
    }))
  }

  return (
    <div
      className="ai-settings-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="ai-settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={copy.title}
      >
        <header className="ai-settings-header">
          <h2>{copy.title}</h2>
          <button className="ai-settings-close" onClick={onClose} aria-label={copy.cancel}>
            ×
          </button>
        </header>

        <label className="ai-settings-label">{copy.provider}</label>
        <div className="ai-settings-providers" role="tablist">
          {visibleProviders.map((provider) => (
            <button
              key={provider.id}
              className={provider.id === draft.provider ? 'active' : ''}
              role="tab"
              aria-selected={provider.id === draft.provider}
              onClick={() => setDraft((current) => ({ ...current, provider: provider.id }))}
            >
              {provider.label}
            </button>
          ))}
        </div>

        <label className="ai-settings-field">
          <span>{copy.model}</span>
          <input
            list={modelListId}
            value={active.model}
            placeholder={activeMeta.defaultModel}
            onChange={(event) => updateActive({ model: event.target.value })}
          />
          <datalist id={modelListId}>
            {activeMeta.models.map((model) => (
              <option key={model} value={model} />
            ))}
          </datalist>
          <small>{copy.modelHelp}</small>
        </label>

        {activeMeta.needsBaseUrl && (
          <label className="ai-settings-field">
            <span>{copy.baseUrl}</span>
            <input
              value={active.baseUrl ?? ''}
              placeholder={activeMeta.defaultBaseUrl ?? 'http://127.0.0.1:8300/v1'}
              onChange={(event) => updateActive({ baseUrl: event.target.value })}
            />
            <small>{copy.endpointHelp}</small>
          </label>
        )}

        {draft.provider === 'genspark' ? (
          <p className="ai-settings-note">{copy.gensparkHelp}</p>
        ) : (
          <label className="ai-settings-field">
            <span>{copy.apiKey}</span>
            <input
              type="password"
              autoComplete="off"
              value={active.apiKey}
              placeholder={activeMeta.keyPlaceholder}
              onChange={(event) => updateActive({ apiKey: event.target.value })}
            />
          </label>
        )}

        <footer className="ai-settings-actions">
          <button onClick={onClose}>{copy.cancel}</button>
          <button
            className="primary"
            disabled={saving || !active.model.trim()}
            onClick={() => {
              setSaving(true)
              void Promise.resolve(onSave(draft)).finally(() => setSaving(false))
            }}
          >
            {saving ? copy.saving : copy.save}
          </button>
        </footer>
      </section>
    </div>
  )
}
