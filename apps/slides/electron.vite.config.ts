import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'

const here = dirname(fileURLToPath(import.meta.url))

// Pin resolution to this repo's workspace sources (matches tsconfig paths;
// avoids bundling stale implementations when node_modules links point elsewhere)
const workspaceAlias = {
  // Subpath before the bare name: string aliases are prefix replacements
  '@byeol/pptx-engine/table-grid': resolve(here, '../../packages/pptx-engine/src/table-grid.ts'),
  '@byeol/pptx-engine/background-promote': resolve(
    here,
    '../../packages/pptx-engine/src/background-promote.ts',
  ),
  '@byeol/pptx-engine': resolve(here, '../../packages/pptx-engine/src/index.ts'),
  '@byeol/pptx-render': resolve(here, '../../packages/pptx-render/src/index.ts'),
}

export default defineConfig({
  // Main process/preload must bundle @byeol/* sources (they are pulled in as TS
  // source with extensionless relative imports; externalizing them under Node
  // yields ERR_MODULE_NOT_FOUND).
  main: {
    resolve: { alias: workspaceAlias },
    // Bundle opentype.js too (the packaged app ships only out/**, so external deps are unresolvable at runtime)
    plugins: [
      externalizeDepsPlugin({
        exclude: [
          '@byeol/pptx-engine',
          '@byeol/pptx-render',
          '@byeol/ai-search',
          '@byeol/file-parse',
          '@byeol/electron-utils',
          'opentype.js',
        ],
      }),
    ],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: { alias: workspaceAlias },
    plugins: [react()],
    server: {
      port: Number(process.env.SLIDES_DEV_PORT) || 5175,
      strictPort: Boolean(process.env.SLIDES_DEV_PORT),
    },
  },
})
