import { expect, test } from '@playwright/test'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { closeAndSaveVideo, launchShell, waitForPageWithUrl } from './helpers'

test('process-local OpenAI-compatible settings reach an editor', async () => {
  const documentsDir = await mkdtemp(join(tmpdir(), 'byeol-suite-ai-settings-'))
  const launched = await launchShell({
    onboardingSeen: true,
    videoDir: 'ai-provider-settings',
    environment: {
      BYEOL_AI_BASE_URL: 'http://127.0.0.1:8300/v1',
      BYEOL_AI_API_KEY: 'e2e-placeholder-key',
      BYEOL_AI_MODEL: 'codex-tools',
    },
  })
  try {
    await launched.app.evaluate(
      ({ app: electronApp }, dir) => electronApp.setPath('documents', dir),
      documentsDir,
    )
    await launched.page.locator('.account-btn').click()
    await launched.page.getByRole('menuitem', { name: 'AI provider settings' }).click()
    await expect(launched.page.getByRole('dialog', { name: 'AI provider settings' })).toBeVisible()
    await launched.page.locator('.ai-settings-actions').getByText('Cancel', { exact: true }).click()
    await launched.page.locator('.quick-card').nth(1).click()

    const sheets = await waitForPageWithUrl(launched.app, 'sheets/out')
    const settings = await sheets.evaluate(() => {
      const api = (
        window as unknown as {
          desktopApi: {
            getAiSettings(): Promise<{
              provider: string
              providers: Record<string, { apiKey: string; model: string; baseUrl?: string }>
            }>
          }
        }
      ).desktopApi
      return api.getAiSettings()
    })

    expect(settings.provider).toBe('openai')
    expect(settings.providers.openai).toEqual({
      apiKey: 'e2e-placeholder-key',
      model: 'codex-tools',
      baseUrl: 'http://127.0.0.1:8300/v1',
    })

    const panelBox = await sheets.locator('.copilot').boundingBox()
    const workbookBox = await sheets.locator('.sheet-main').boundingBox()
    expect(panelBox).not.toBeNull()
    expect(workbookBox).not.toBeNull()
    expect(panelBox!.x).toBeGreaterThan(workbookBox!.x)
    expect(Math.abs(panelBox!.y - workbookBox!.y)).toBeLessThanOrEqual(1)
    expect(Math.abs(panelBox!.height - workbookBox!.height)).toBeLessThanOrEqual(1)
    expect(workbookBox!.height).toBeGreaterThan(400)
    const nameBox = await sheets.locator('.name-box-bar').boundingBox()
    expect(nameBox).not.toBeNull()
    expect(nameBox!.y - workbookBox!.y).toBeLessThan(60)

    await sheets.getByTitle('AI settings').click()
    await expect(sheets.getByRole('dialog', { name: 'AI provider settings' })).toBeVisible()
    await expect(sheets.getByRole('tab', { name: 'OpenAI compatible' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await sheets.screenshot({
      path: join(process.cwd(), 'e2e/artifacts/screenshots/ai-provider-settings-right.png'),
    })
    const modelInput = sheets
      .locator('.ai-settings-field')
      .filter({ hasText: 'Model' })
      .locator('input')
    await expect(modelInput).toHaveValue('codex-tools')
    await modelInput.fill('claude-tools')
    await sheets.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(sheets.getByRole('dialog', { name: 'AI provider settings' })).toBeHidden()

    const changedSettings = await sheets.evaluate(() =>
      (
        window as unknown as {
          desktopApi: {
            getAiSettings(): Promise<{
              provider: string
              providers: Record<string, { apiKey: string; model: string; baseUrl?: string }>
            }>
          }
        }
      ).desktopApi.getAiSettings(),
    )
    expect(changedSettings.providers.openai.model).toBe('claude-tools')

    const saved = await expect
      .poll(async () => {
        try {
          return JSON.parse(await readFile(join(launched.userDataDir, 'ai-settings.json'), 'utf8'))
        } catch {
          return null
        }
      })
      .toMatchObject({ provider: 'openai', providers: { openai: { model: 'claude-tools' } } })
    void saved
  } finally {
    await closeAndSaveVideo(launched, 'ai-provider-settings')
  }
})
