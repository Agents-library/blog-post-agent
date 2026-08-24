# Architecture Context

## Stack

| Layer            | Technology                          | Role                                              |
| ----------------- | ------------------------------------ | -------------------------------------------------- |
| Runtime           | Node.js + TypeScript                 | CLI execution                                     |
| CLI Framework      | Commander.js                         | Argument parsing, command routing                 |
| AI Provider        | Anthropic, OpenAI, Gemini, OpenRouter | Blog post generation (user-selected)            |
| Markdown Parsing  | gray-matter + remark                 | Parse frontmatter and content from context files  |
| CLI Output         | chalk + ora                          | Terminal color output, spinners                   |
| Packaging          | npm (global install)                 | Distribution                                      |

## System Boundaries

- `src/cli/` — command definitions and argument parsing only
  (`init`, `generate`, `setup`)
- `src/core/` — file scanning and MD reading/parsing logic, no
  AI calls
- `src/generator/` — prompt construction and provider API
  calls, no file I/O
- `src/config/` — loading/merging `blogify.config.json` plus
  machine-level API key load/save (`credentials.ts`)
- `src/output/` — writing the final MD file and generating
  frontmatter

## Storage Model

- **Local filesystem (input)**: `context/*.md` — read-only
  source of truth for project content
- **Local filesystem (output)**: `output/blog-post.md` —
  generated file, overwritten on each run
- **Config**: optional `blogify.config.json` in the project
  root — folder paths, output naming
- **Credentials**: `~/.blogify/credentials.json` plus user
  environment variables — API keys, never stored in the project
- No database, no remote storage — the tool is stateless between
  runs besides the saved machine-level API key

## Auth and Access Model

- No user accounts. Auth is a machine-level API key for one of:
  Anthropic, OpenAI, Gemini, or OpenRouter.
- On first interactive `blogify generate` or `blogify setup`, if
  no key is stored, Blogify asks the user to choose a provider
  and enter a key. Pasting a key auto-detects the provider from
  the key prefix (`sk-ant-`, `sk-`, `AIza`, `sk-or-`).
- Keys are saved for the current user: user environment
  variables on Windows, plus `~/.blogify/credentials.json`
  (mode `0600`) on every platform. Project folders never store
  keys.
- Subsequent runs auto-select a provider: last saved provider
  if its key is present, otherwise the only stored key, otherwise
  the first available in Anthropic → OpenAI → Gemini → OpenRouter
  order.
- No network calls are made except to the selected provider API.

## Invariants

1. Blogify never writes outside the resolved `output` path — no
   unrelated file writes
2. Blogify never invents quantitative claims (metrics,
   percentages, numbers) not present in the source `context/`
   files
3. `blogify generate` must run to completion without needing any
   project-specific config — config is optional, not required
4. File scanning is read-only — `context/` is never modified or
   deleted by the tool
