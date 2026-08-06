# Byeol Suite

An AI-native office suite for macOS and Windows: word processor, spreadsheet,
presentations, and PDF — five Electron apps sharing one engine layer, built
around AI editing as a first-class workflow rather than a bolted-on chat box.

Byeol Suite is an independently branded fork of
[GenOffice](https://github.com/genspark-ai/genoffice). It is not affiliated
with or endorsed by Mainfunc, Inc. or Genspark.

## Apps

| App           | Product          | What it is                                                                                                                                                                                                                                                                                                                                                 |
| ------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/docs`   | **Byeol Docs**   | `.docx` word processor. Byte-preserving round trip: only dirty paragraphs are regenerated (paragraph patch), everything else in the original file is kept byte-for-byte, so opening and saving never breaks layout in Word. Paginated view whose line metrics reproduce the original document's layout, tracked changes, comments, styles, equations, ink. |
| `apps/sheets` | **Byeol Sheets** | `.xlsx` spreadsheet. UI built on the open-source [Univer](https://github.com/dream-num/univer) core (Apache-2.0) with a large layer of in-house extensions; xlsx import/export runs through an in-house Rust sidecar (calamine + IronCalc), charts are rendered in-house (Konva), plus pivot tables, slicers, conditional formatting, and formula tracing. |
| `apps/slides` | **Byeol Slides** | `.pptx` presentations. In-house pptx parse/render/edit engine with masters, charts, cropping, ink, and text shaping (HarfBuzz metrics).                                                                                                                                                                                                                    |
| `apps/pdf`    | **Byeol PDF**    | PDF viewer/editor on pdf.js + pdf-lib: annotations, forms, outlines, stamps, signatures, page operations, print.                                                                                                                                                                                                                                           |
| `apps/shell`  | **Byeol Suite**  | The suite shell: home screen, tabbed hosting of the four editors, auto-update.                                                                                                                                                                                                                                                                             |

Every app embeds the same AI panel: block-granular AI editing with version
snapshots and diffs in docs, a tool-calling agent over workbook/slide/PDF
state in the others.

**AI providers.** The apps can use Genspark, direct vendor APIs, or an
OpenAI-compatible endpoint. A proxy remains the OpenAI transport; choosing a
model alias such as `codex-tools` or `claude-tools` tells a compatible proxy
to add its tool-call bridge. This keeps ordinary proxy clients on their
existing models and enables tool calling only for clients that opt in.

## Engine packages

All pure TypeScript, no Electron dependency, unit-tested (except the UI kit):

- `packages/docx-engine` — docx parsing → block tree (with `docxIndex`
  anchors and passthrough), OOXML fragment generation, byte-level paragraph
  patching.
- `packages/pptx-engine` / `packages/pptx-render` — pptx model and rendering.
- `packages/file-parse` — text extraction for AI attachments (office formats,
  text formats).
- `packages/agent-core` — the AI agent loop and skill composition shared by
  every app.
- `packages/ai-provider` — provider abstraction and streaming for the model
  backends.
- `packages/ai-search` — Genspark auth + web/image search tools.
- `packages/i18n`, `packages/ui`, `packages/project-store`,
  `packages/electron-utils` — shared i18n core, React UI kit, recent-files
  store, and Electron main-process helpers.

## Development

```bash
npm install
npm run fixtures     # generate test .docx fixtures
npm test             # engine + app unit tests (docs/sheets/slides need no display)
npm run typecheck    # tsc --noEmit across every workspace
npm run dev          # all four editors + shell against Vite dev servers
npm run dev:docs     # a single app (same pattern works per workspace)
npm run dist:mac     # package macOS dmg (regenerates third-party notices)
npm run dist:win     # package Windows nsis installer
```

The integrated dev command uses ports `15173`–`15176` so it can coexist with
other projects that use Vite's common `5173` range.

### Run locally with StarProxy

Start the StarProxy instance that exposes its OpenAI-compatible API, then run
the suite with endpoint overrides. The values apply only to this process and
do not overwrite the saved AI settings:

```bash
BYEOL_AI_BASE_URL=http://127.0.0.1:8300/v1 \
BYEOL_AI_API_KEY=your-starproxy-api-key \
BYEOL_AI_MODEL=codex-tools \
npm run dev
```

Use `BYEOL_AI_MODEL=claude-tools` to opt into the Claude bridge. Use an
ordinary model name when no bridge is wanted. In other words, the endpoint
selects StarProxy, while the `*-tools` alias selects StarProxy's tool-calling
behavior for that request. The same variables configure Docs, Sheets, Slides,
and PDF when they run inside the suite shell.

Provider keys saved through the settings dialog are stored unencrypted in the
current user's Electron app-data directory. Prefer a scoped proxy credential
over a broad vendor key, especially on a shared machine. Process-level
`BYEOL_AI_*` overrides are not written to that settings file.

The sheets app additionally needs a Rust toolchain for its xlsx sidecar
(`cargo` on PATH); `npm run build -w @byeol/sheets` compiles it
automatically.

Local UI/e2e driver scripts (Playwright + Electron, for local acceptance, not
committed by default) live in [`scripts/drivers/`](scripts/drivers/README.md).

## Architecture notes (docx round trip)

```
open docx ─► archive original by hash (never touched)
          ─► docx-engine parses word/document.xml top-level elements (w:p / w:tbl / …)
          ─► Block tree, each block anchored by docxIndex + original XML slice
          ─► TipTap streaming editor (manual + AI editing, dirty tracking)
save      ─► dirty blocks → OOXML fragments (referencing existing styles only)
          ─► splice into original document.xml (untouched blocks keep original bytes)
          ─► repack zip; all other entries copied byte-for-byte
```

The same philosophy holds in sheets and slides: the original file is the
source of truth, edits are applied as narrow patches, and everything the
editor didn't touch survives the round trip untouched.

## Security

See [SECURITY.md](SECURITY.md) for the process security posture (renderer
sandboxing, IPC validation, external-link gating) and the threat models for
AI-generated content.

## Third-party notices

`npm run notices` regenerates the bundled third-party license summary
(`tools/gen-third-party-notices.mjs`); all runtime dependencies are
MIT/Apache-2.0/OFL, and the bundled fonts (Liberation, Carlito, Caladea, Noto
CJK subsets) are OFL/Apache.

## License

The Apache-licensed source inherited from GenOffice remains covered by the
[Apache License 2.0](LICENSE), including its original copyright and
[NOTICE](NOTICE) attribution. The `ee/` directory is excluded from that grant
and remains covered by the original [GenOffice Enterprise License](ee/LICENSE).
The principal changes made by this fork are summarized in
[MODIFICATIONS.md](MODIFICATIONS.md).

`Byeol Suite`, `Byeol Docs`, `Byeol Sheets`, `Byeol Slides`, and `Byeol PDF`
are this fork's branding. GenOffice and Genspark are referenced only to
identify the upstream project and optional service provider; their names and
logos are not used as this fork's product identity.
