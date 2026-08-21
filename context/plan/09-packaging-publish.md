# Phase 9 — Packaging & Publish

**Depends on:** Phase 8

## Goal

Prepare Blogify for global install via npm.

## In Scope

- Confirm the `blogify` package name is available on npm (see
  the session note in `context/progress-tracker.md`)
- Finalize `package.json`: `bin` field, `files` field (ship only
  `dist/`), version `0.1.0`, license, repository link
- A short, public-facing `README.md` (separate from `AGENTS.md`
  and `context/`, which are for the coding agent, not npm users):
  install instructions, quickstart (`init` → add files →
  `generate`), example output
- `npm pack` locally and test a global install from the tarball
  before publishing

## Out of Scope

- CI/CD pipeline or automated release workflow — can be a future
  enhancement, not required for v1

## Steps

1. Check npm name availability; update `package.json` `name` if
   taken.
2. Set `"files": ["dist"]`,
   `"bin": { "blogify": "./dist/cli/index.js" }`, and add a
   shebang line (`#!/usr/bin/env node`) to the compiled
   entrypoint.
3. Write `README.md`.
4. Run `npm pack`, install the tarball globally in a clean temp
   environment, and run `blogify init && blogify generate`
   end to end.
5. `npm publish` — this is a manual, human-triggered step. The
   agent should prepare everything up to this point but not
   publish unattended.

## Verification

- [ ] Global install from the local tarball works end to end
- [ ] `README.md` accurately reflects real CLI behavior (read
      through it against the actual commands)

## Files Touched

`package.json`, `README.md`

## Before Marking Done

Update `context/progress-tracker.md` — mark v1 complete.
