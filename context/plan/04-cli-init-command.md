# Phase 4 — CLI `init` Command

**Depends on:** Phase 1

## Goal

Implement `blogify init` — scaffolds `context/` and `output/`
folders in the current working directory.

## In Scope

- Create `context/` and `output/` if they don't exist (relative
  to cwd, or `--dir`/`--out` overrides)
- Success message listing what was created, styled per
  `context/ui-context.md` (green for created, cyan for
  already-exists info)
- If folders already exist: do nothing destructive, just inform
  the user — no overwrite, no error

## Out of Scope

- Creating starter/template `.md` files inside `context/` — the
  user brings their own files. This could be a future
  enhancement, not v1 (see `context/project-overview.md` Out of
  Scope).

## Steps

1. Implement `src/cli/init.ts`: a Commander action handler that
   calls a small helper to ensure both directories exist
   (`fs.mkdir` with `recursive: true`).
2. Wire status messages per `context/ui-context.md` conventions.
3. Test: running `init` in an empty temp dir creates both
   folders; running it a second time is a no-op, not an error.

## Verification

- [ ] `blogify init` in a fresh temp dir creates `context/` and
      `output/` on disk
- [ ] Running `blogify init` a second time does not throw or
      overwrite anything

## Files Touched

`src/cli/init.ts`, tests

## Before Marking Done

Update `context/progress-tracker.md`.
