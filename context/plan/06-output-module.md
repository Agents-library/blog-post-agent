# Phase 6 — Output Module

**Depends on:** Phase 5 (needs generated content to write)

## Goal

Implement `src/output/` — generate frontmatter and write the
final blog post file.

## In Scope

- `buildFrontmatter({ title, date, tags, summary })` — generates
  YAML frontmatter matching the template in
  `context/project-overview.md`
- `writeOutput(content, resolvedOutputPath)` — writes the file,
  creating the `output/` directory if it doesn't exist

## Decisions made in this phase (resolves open questions)

- **Overwrite behavior:** `writeOutput()` overwrites
  `output/blog-post.md` by default on each run. This is the
  simplest option and matches the storage model in
  `context/architecture.md` ("generated file, safe to
  overwrite"). The CLI layer (Phase 7) is responsible for
  warning the user before the write happens — this module just
  performs it.
- **Filename:** stays fixed as `blog-post.md` (or the
  `--out` override) rather than being derived from a detected
  project name — simpler, and avoids guessing a project name
  from ambiguous source files.

After implementing, update `context/progress-tracker.md`: move
both items from Open Questions into Architecture Decisions.

## Out of Scope

- The overwrite confirmation prompt/UX itself (Phase 7) — this
  module only performs the write

## Steps

1. Implement `buildFrontmatter()` — title and date can be
   inferred (title from context, else a generic fallback; date =
   today), tags default to an empty array, summary drawn from the
   generated content's opening lines or a short model-provided
   summary.
2. Implement `writeOutput()` using `fs`, ensuring the parent
   directory exists.
3. Unit tests: frontmatter shape matches spec, writing to a
   nested path creates directories, writing succeeds and
   overwrites an existing file.

## Verification

- [ ] Unit tests pass
- [ ] The resulting file is valid Markdown with valid YAML
      frontmatter (parse it in a test to confirm)

## Files Touched

`src/output/frontmatter.ts`, `src/output/write.ts`,
`src/output/index.ts`, tests

## Before Marking Done

Update `context/progress-tracker.md` — resolve the two open
questions as described above.
