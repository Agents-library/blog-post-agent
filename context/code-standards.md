# Code Standards

## General

- Keep modules small and single-purpose — no file should both
  read files and call the AI API
- Fix root causes, do not layer workarounds — e.g. if MD parsing
  fails on a file, fix the parser, don't silently skip it
- Do not mix unrelated concerns in one module — scanning,
  generation, and writing stay in separate layers

## TypeScript

- Strict mode is required throughout (`strict: true` in
  tsconfig)
- Avoid `any` — use explicit interfaces for file metadata,
  config, and generation results
- Validate all external input (CLI args, config file contents)
  at the boundary before use

## CLI (Commander)

- Each command (`init`, `generate`, `setup`) lives in its own file
  under `src/cli/`
- Commands only parse args and call into `src/core` /
  `src/generator` — no business logic inside command handlers
- Every command supports `--help` with clear usage text

## CLI Output

- Use `chalk` for status coloring only — success = green, error
  = red, info = cyan, warning = yellow — no unrelated color usage
- Use `ora` spinners for any operation over ~1 second (file
  scanning, API calls)
- Errors print a human-readable message, not a raw stack trace,
  unless `--verbose` is passed

## LLM API Usage

- All prompt construction lives in `src/generator/` — no inline
  prompts elsewhere
- Provider selection and key persistence live in `src/config/`
  (`credentials.ts`); interactive prompting lives in `src/cli/`
- Validate the API response shape before writing output; fail
  with a clear error if the response is empty or malformed
- Never retry silently more than once — a failed generation is
  reported to the user, not looped indefinitely
- Never print or log API key values

## Data and Storage

- Context files are read but never mutated
- Generated content is only ever written to the resolved output
  path — context files are never overwritten
- Config values are merged (defaults + `blogify.config.json`) in
  `src/config/` only, not scattered across the codebase

## File Organization

- `src/cli/` — command definitions (`init.ts`, `generate.ts`,
  `setup.ts`)
- `src/core/` — file scanning + MD parsing
- `src/generator/` — prompt building + provider API calls
- `src/config/credentials.ts` — machine-level API key load/save
- `src/output/` — output file writing + frontmatter generation
- `src/config/` — config loading and merging
