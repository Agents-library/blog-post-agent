# Phase 7 — CLI `generate` Command

**Depends on:** Phases 2, 3, 5, 6

## Goal

Wire config, core, generator, and output together behind
`blogify generate`, with full CLI UX per
`context/ui-context.md` (spinners, color-coded status, final
summary).

## In Scope

- `src/cli/generate.ts`: resolves config → scans context → warns
  if empty → shows a spinner during generation → writes output →
  prints a final green summary with the output path
- Graceful handling of: missing API key, empty `context/` folder
  (yellow warning, not a crash), an existing output file about
  to be overwritten (info message before the write)
- `--verbose` flag: shows full error stack traces on failure
  instead of the default clean error message

## Out of Scope

- Any new business logic — this phase is integration only, no
  new module code beyond the command handler itself

## Steps

1. Wire the flow: `loadConfig` → `scanContext` → (if 0 files,
   print yellow warning and exit cleanly) → `buildPrompt` →
   `callAnthropic` (spinner active) → `buildFrontmatter` →
   `writeOutput` → print green success summary.
2. Add `ora` spinners per `context/code-standards.md` CLI Output
   rules for the scanning and API-call steps.
3. Add `--verbose` flag handling for error output.
4. Integration test: run `generate` end to end against a fixture
   `context/` folder with the Anthropic call mocked, assert
   `output/blog-post.md` is created with the expected frontmatter
   shape.

## Verification

- [ ] Integration test (mocked API) passes end to end
- [ ] Manual run against this repo's real `context/` folder with
      a real API key produces `output/blog-post.md`
- [ ] Running `generate` against an empty `context/` folder
      prints a yellow warning and exits without crashing

## Files Touched

`src/cli/generate.ts`, tests

## Before Marking Done

Update `context/progress-tracker.md` — this closes out the
original "Next Up" list.
