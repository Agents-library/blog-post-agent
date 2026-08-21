# Phase 2 — Config Module

**Depends on:** Phase 1

## Goal

Implement `src/config/` — load defaults, merge with an optional
`blogify.config.json`, and expose a typed `Config` object to the
rest of the app.

## In Scope

- `Config` interface (`contextDir`, `outputPath`, etc. — per the
  CLI flags in `context/project-overview.md`)
- Default values: `context/` as default context dir,
  `output/blog-post.md` as default output path
- A function that loads and merges `blogify.config.json` from
  the project root if present, validating its shape before use
  (per `context/code-standards.md`: validate external input at
  the boundary)
- Precedence order: CLI flag > config file > default

## Out of Scope

- Reading actual CLI args — that's the CLI layer's job (Phase 7
  wires it in). This module only defines the merge function and
  accepts already-parsed overrides as input.

## Steps

1. Define the `Config` interface in `src/config/types.ts`.
2. Define defaults in `src/config/defaults.ts` — this file is
   protected per `AGENTS.md` / `ai-workflow-rules.md`, don't
   change casually later.
3. Implement `loadConfig(cliOverrides)` in `src/config/index.ts`:
   reads `blogify.config.json` if present, validates it, merges
   with defaults, applies `cliOverrides` last.
4. Unit tests: defaults-only, config-file-only, config file +
   CLI override precedence, malformed config file (should throw
   a clear error, not crash unhelpfully).

## Verification

- [ ] Unit tests pass for all four scenarios above
- [ ] `loadConfig()` with no `blogify.config.json` present does
      not throw

## Files Touched

`src/config/types.ts`, `src/config/defaults.ts`,
`src/config/index.ts`, tests

## Before Marking Done

Update `context/progress-tracker.md`.
