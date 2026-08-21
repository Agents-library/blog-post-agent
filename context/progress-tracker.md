# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Phase 9 — Packaging and publish (next)

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
- **Phase 6 — Output module** (2026-08-21): `buildFrontmatter` in
  `src/output/frontmatter.ts` emits YAML with `title`, `date`,
  `tags`, and `summary` (inferred title/date/summary when omitted;
  tags default to `[]`). `writeOutput` creates parent directories
  and overwrites the resolved path. Unit tests cover frontmatter
  shape, nested-path creation, overwrite, and gray-matter parsing
  of the written Markdown file. Checklist passed.
- **Phase 7 — CLI generate command** (2026-08-21): `blogify generate`
  in `src/cli/generate.ts` wires `loadConfig` → `scanContext` →
  `buildPrompt` → `callAnthropic` → `buildFrontmatter` →
  `writeOutput`. Ora spinners on scan and API steps; yellow warning
  and clean exit for an empty `context/`; cyan overwrite notice
  before write; red error line with optional `--verbose` stack.
  `--dir`/`--out` map to config overrides. Integration test with a
  mocked Anthropic client writes `output/blog-post.md` with the
  expected frontmatter shape. Empty-folder warning test passes.
  Manual run against this repo's `context/` skipped (no
  `ANTHROPIC_API_KEY` in environment). Checklist passed for
  automated verification.
- **Phase 8 — Testing and hardening** (2026-08-21): Invariant
  and error-path coverage added in `test/hardening.test.mjs`
  (plus `writeOutput` path confinement in `test/output.test.mjs`).
  Scaffolding placeholder test removed. `npm test`: 46 passed,
  0 skipped. Architecture invariants:
  1. No writes outside the resolved output path — **checked**
     (automated: `writeOutput` only creates the given path;
     sibling files stay untouched).
  2. No fabricated metrics — **checked** via Phase 5 prompt
     rules (`Never fabricate metrics...`; qualitative impact
     when sources lack numbers). Manual sample review against
     live generated posts not run (no `ANTHROPIC_API_KEY`).
  3. `generate` with zero project-specific config — **checked**
     (automated: temp dir, no `blogify.config.json`, defaults).
  4. `context/` never modified or deleted — **checked**
     (automated: contents/mtimes unchanged after full
     `generate`).
  Error paths: malformed `blogify.config.json`, missing
  `ANTHROPIC_API_KEY`, permission-denied output write. Checklist
  passed.

## In Progress

- None yet.

## Next Up

- Phase 9 — Packaging and publish (per `context/plan/00-overview.md`)

## Open Questions

- None currently.

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
- `writeOutput()` overwrites `output/blog-post.md` by default on
  each run — generated file, safe to overwrite; the CLI layer
  (Phase 7) warns the user before the write (decided 2026-08-21,
  Phase 6)
- Output filename stays fixed as `blog-post.md` (or the `--out`
  override) rather than being derived from a detected project
  name (decided 2026-08-21, Phase 6)

## Session Notes

- Working package name is "blogify" — confirm it's available on
  npm before publishing
- Blog post structure is fixed: Situation → Approach → What Was
  Built → Key Decisions → Impact → Lessons/Next
- Source files were recreated from scratch; `dist/` and
  `node_modules/` from a prior partial run were retained and
  rebuilt via `npm run build`
- `ora@5.4.1` added in Phase 7 (CommonJS, matches `chalk@4`)
