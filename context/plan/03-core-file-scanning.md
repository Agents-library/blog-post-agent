# Phase 3 — Core File Scanning

**Depends on:** Phase 2 (needs a resolved `contextDir` path)

## Goal

Implement `src/core/` — scan the context directory, read every
`.md` file, and parse frontmatter/content.

## In Scope

- `scanContextFiles(contextDir)` — returns resolved `.md` file
  paths. Non-recursive by default (flat `context/` folder, per
  `context/project-overview.md` examples and the Simplicity
  First rule in `AGENTS.md`).
- `readContextFile(filePath)` — reads a file, parses it with
  `gray-matter`, returns `{ path, frontmatter, content }`.
- `scanContext(contextDir)` — aggregates the above into
  `{ files: ParsedFile[], errors: { file, reason }[] }` so one
  malformed file doesn't kill the whole scan.

## Out of Scope

- Any AI/generation logic
- Any output writing

## Decisions made in this phase

- Empty `context/` folder → return an empty array, let the CLI
  layer (Phase 7) decide how to warn the user.
- Missing `context/` folder entirely → throw a clear, catchable
  error.
- One malformed/unreadable file among valid ones → skip it, add
  it to the `errors` array, continue scanning the rest. This
  keeps a single bad file from blocking the whole run.

## Steps

1. Implement `scanContextFiles()` using Node `fs`, filtered to
   `.md` extension only, non-recursive.
2. Implement `readContextFile()` using `gray-matter` to split
   frontmatter from content.
3. Implement `scanContext()` to aggregate both, per the error
   handling behavior above.
4. Unit tests: normal folder with 2–3 `.md` files, empty folder,
   missing folder, one malformed file mixed with valid ones.

## Verification

- [ ] Unit tests pass for all four scenarios above
- [ ] Running `scanContext()` against the real
      `context/` folder from this repo returns 6 parsed files
      with zero errors

## Files Touched

`src/core/scan.ts`, `src/core/types.ts`, tests

## Before Marking Done

Update `context/progress-tracker.md`.
