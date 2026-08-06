# Byeol Suite Modifications

Byeol Suite is an independently branded derivative of
[GenOffice](https://github.com/genspark-ai/genoffice). The upstream copyright,
Apache License 2.0 text, and NOTICE attribution are retained in this
repository.

Relative to the upstream project, this fork includes substantial changes in
the following areas:

- independent Byeol Suite product names, application identifiers, icons, and
  user-facing branding;
- configurable AI providers shared by Docs, Sheets, Slides, and PDF;
- OpenAI-compatible endpoint and model configuration, including StarProxy
  `claude-tools` and `codex-tools` aliases;
- a shared provider-settings interface and right-docked AI panels;
- renderer, IPC, localization, test, build, and packaging updates required by
  the independent branding and provider configuration;
- additional integration and end-to-end coverage for provider selection and
  tool-calling spreadsheet workflows.

Files changed by this fork are tracked in its Git history. The `ee/` directory
is not part of the Apache-2.0 grant and remains governed solely by its original
GenOffice Enterprise License. Byeol Suite does not claim ownership of, or
relicense, that directory.
