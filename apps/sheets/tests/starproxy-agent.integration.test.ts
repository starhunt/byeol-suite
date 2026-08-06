import { describe, expect, it } from 'vitest'
import {
  AgentLoop,
  type AgentRunResult,
  type AgentTransport,
  type AgentToolCall,
} from '@byeol/agent-core'
import { streamForProvider } from '@byeol/ai-provider'
import { createWorkbookSkill } from '../src/renderer/ai/workbook-skill'
import type { SheetsSkillDeps } from '../src/renderer/ai/tools'

const baseUrl = process.env.BYEOL_STARPROXY_BASE_URL
const apiKey = process.env.BYEOL_STARPROXY_API_KEY
const describeWithStarProxy = baseUrl && apiKey ? describe : describe.skip

function starProxyTransport(model: string): AgentTransport {
  return {
    stream(request, callbacks) {
      const controller = new AbortController()
      void streamForProvider(
        'openai',
        { apiKey: apiKey!, model, baseUrl: baseUrl! },
        request.system,
        request.messages,
        request.tools,
        4_096,
        {
          signal: controller.signal,
          onDelta: callbacks.onDelta,
          onToolCall: callbacks.onToolCall,
          ...(callbacks.onStopReason ? { onStopReason: callbacks.onStopReason } : {}),
        },
      )
        .then(() => callbacks.onDone())
        .catch((error: unknown) => {
          if (controller.signal.aborted) callbacks.onDone()
          else callbacks.onError(error instanceof Error ? error.message : String(error))
        })
      return { cancel: () => controller.abort() }
    },
  }
}

function workbookDeps(reads: string[][]): SheetsSkillDeps {
  const cells: ReturnType<SheetsSkillDeps['readCells']> = {
    A1: { value: 41 },
    A2: { value: 1 },
  }
  return {
    getActiveSheetInfo: () => ({
      mode: 'demo',
      sheetId: 'sheet-1',
      sheetName: 'Sheet1',
      revision: 0,
      knownAddresses: ['A1', 'A2'],
      sheets: [{ id: 'sheet-1', name: 'Sheet1', rows: 2, columns: 1 }],
      selection: 'A1:A2',
    }),
    readCells: (addresses) => {
      reads.push([...addresses])
      return Object.fromEntries(
        addresses.flatMap((address) => (cells[address] ? [[address, cells[address]]] : [])),
      )
    },
    readFormats: () => ({}),
    readSheetFeatures: () => 'No special sheet features.',
    proposeOperations: () => ({ ok: false, error: 'This integration check is read-only.' }),
  }
}

function runWorkbookAgent(model: string): Promise<{
  result: AgentRunResult
  executed: AgentToolCall[]
  reads: string[][]
}> {
  const executed: AgentToolCall[] = []
  const reads: string[][] = []
  return new Promise((resolve, reject) => {
    const loop = new AgentLoop({
      transport: starProxyTransport(model),
      skill: createWorkbookSkill(workbookDeps(reads)),
      maxTurns: 4,
      compaction: false,
      events: {
        onToolExecuted: ({ call }) => executed.push(call),
        onDone: (result) => resolve({ result, executed, reads }),
        onError: (error) => reject(new Error(error)),
      },
    })
    loop.run(
      'Use the read_range tool to read A1:A2. Then calculate their sum and answer with the number. Do not guess before using the tool.',
    )
  })
}

describeWithStarProxy('Byeol Sheets agent through StarProxy Tool Bridge', () => {
  for (const model of ['codex-tools', 'claude-tools']) {
    it(
      `${model} executes a real workbook tool and completes the follow-up turn`,
      { timeout: 180_000 },
      async () => {
        const { result, executed, reads } = await runWorkbookAgent(model)

        expect(executed.some((call) => call.name === 'read_range')).toBe(true)
        expect(reads).toContainEqual(['A1', 'A2'])
        expect(result.cancelled).toBe(false)
        expect(result.turnLimit).toBe(false)
        expect(result.text).toMatch(/42/)
      },
    )
  }
})
