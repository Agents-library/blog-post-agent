# Architecture Context

## Stack

| Layer            | Technology                          | Role                                              |
| ----------------- | ------------------------------------ | -------------------------------------------------- |
| Runtime           | Node.js + TypeScript                 | CLI execution                                     |
| CLI Framework      | Commander.js                         | Argument parsing, command routing                 |
| AI Provider        | Anthropic SDK (`@anthropic-ai/sdk`)  | Blog post generation                              |
| Markdown Parsing  | gray-matter + remark                 | Parse frontmatter and content from context files  |
| CLI Output         | chalk + ora                          | Terminal color output, spinners                   |
| Packaging          | npm (global install)                 | Distribution                                      |

## System Boundaries

- `src/cli/` — command definitions and argument parsing only
  (`init`, `generate`)
- `src/core/` — file scanning and MD reading/parsing logic, no
  AI calls
- `src/generator/` — prompt construction and Anthropic API
  calls, no file I/O
- `src/config/` — loading and merging default config with
  `blogify.config.json`
- `src/output/` — writing the final MD file and generating
  frontmatter

## Storage Model

- **Local filesystem (input)**: `context/*.md` — read-only
  source of truth for project content
- **Local filesystem (output)**: `output/blog-post.md` —
  generated file, overwritten on each run
- **Config**: optional `blogify.config.json` in the project
  root — folder paths, output naming
- No database, no remote storage — the tool is stateless between
  runs

## Auth and Access Model

- No user accounts. Auth is a single `ANTHROPIC_API_KEY`
  environment variable, set once globally on the machine.
- The API key is never persisted to disk — read from
  `process.env` at runtime only.
- No network calls are made except to the Anthropic API.

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
