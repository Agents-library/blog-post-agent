# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Phase 6 — Output module (next)

## Current Goal

- Define and scaffold Blogify v1: `init` + `generate` commands,
  Technical PM/Consultant blog template

## Completed

- **Phase 1 — Project scaffolding** (2026-08-21): TypeScript CLI
  skeleton with Commander.js, `init`/`generate` command stubs,
  folder structure (`src/cli/`, `src/core/`, `src/generator/`,
  `src/output/`, `src/config/`), ESLint with `no-explicit-any`,
  `npm run build` / `lint` / `test` scripts. Verification
  checklist passed.
- **Phase 2 — Config module** (2026-08-21): `Config` interface,
  protected defaults (`context/`, `output/blog-post.md`),
  `loadConfig(cliOverrides)` with `blogify.config.json` loading,
  shape validation, and merge precedence (CLI > file > defaults).
  Unit tests cover all four verification scenarios. Checklist
  passed.
- **Phase 3 — Core file scanning** (2026-08-21): `scanContextFiles`,
  `readContextFile`, and `scanContext` in `src/core/` using Node
  `fs` and `gray-matter`. Non-recursive `.md` scan, per-file error
  collection, missing-dir throws, empty-dir returns `[]`. Unit tests
  cover all four scenarios; real `context/` scan returns 6 files
  with zero errors. Checklist passed.
- **Phase 4 — CLI init command** (2026-08-21): `blogify init`
  scaffolds `context/` and `output/` via `runInit` in
  `src/cli/init.ts`. Supports `--dir`/`--out` overrides, green
  created / cyan already-exists messages per `ui-context.md`. Second
  run is a no-op. Unit tests cover fresh dir, idempotent re-run,
  and custom paths. Checklist passed.
- **Phase 5 — Generator module** (2026-08-21): `buildPrompt` in
  `src/generator/prompt.ts` with fixed Technical PM/Consultant
  template and synthesis rules; `callAnthropic` in
  `src/generator/client.ts` wraps `@anthropic-ai/sdk` with API key
  validation, response validation, distinct error messages, and
  one retry on transient 5xx/network errors. Unit tests cover prompt
  structure and all error paths. Manual API smoke test skipped
  (no `ANTHROPIC_API_KEY` in environment). Checklist passed.

## In Progress

- None yet.

## Next Up

- Output module — Phase 6
- Wire `blogify generate` end to end — Phase 7 (after Phase 6)

## Open Questions

- Should `blogify generate` overwrite `output/blog-post.md` by
  default, or prompt/timestamp when a file already exists?
- Should the output filename be derived from the project name,
  or always fixed as `blog-post.md`?

## Architecture Decisions

- TypeScript + Node.js chosen over Python — smoother global CLI
  install experience via `npm install -g` (decided 2026-08-21)
- Commander.js confirmed as CLI framework — mature subcommand
  routing, built-in `--help`, minimal boilerplate; matches
  `context/architecture.md` (confirmed 2026-08-21, Phase 1)
- Config merge precedence: CLI overrides > `blogify.config.json` >
  defaults in `src/config/defaults.ts` (decided 2026-08-21,
  Phase 2)
- Context scan is non-recursive and flat — only top-level `.md`
  files in `contextDir` are read; one bad file is skipped and
  reported in `errors` without aborting the scan (decided
  2026-08-21, Phase 3)
- Technical PM/Consultant is the only tone/style for v1;
  additional style presets deferred to a later version

## Session Notes

- Working package name is "blogify" — confirm it's available on
  npm before publishing
- Blog post structure is fixed: Situation → Approach → What Was
  Built → Key Decisions → Impact → Lessons/Next
- Source files were recreated from scratch; `dist/` and
  `node_modules/` from a prior partial run were retained and
  rebuilt via `npm run build`
