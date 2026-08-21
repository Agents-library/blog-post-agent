# Phase 8 — Testing & Hardening

**Depends on:** Phases 1–7

## Goal

Fill test coverage gaps, handle edge cases found during manual
testing, and confirm all `context/architecture.md` invariants
actually hold in the implementation.

## In Scope

Confirm each invariant from `context/architecture.md`, with a
test where possible:

1. **No writes outside the resolved output path** — add a test
   asserting `writeOutput()` never resolves to a path outside
   the configured `outputPath`.
2. **No fabricated metrics** — not fully automatable; spot-check
   via the prompt instructions from Phase 5 and manually review
   a few generated samples against their source `context/` files.
3. **`generate` runs with zero project-specific config** — add an
   integration test that runs `generate` in a temp dir with no
   `blogify.config.json` at all.
4. **`context/` is never modified or deleted** — add a test that
   checks file contents/mtimes in `context/` are unchanged after
   a full `generate` run.

Also add error-path tests for:

- Malformed `blogify.config.json`
- Missing `ANTHROPIC_API_KEY`
- Permission-denied on the output directory

## Out of Scope

New features — this phase only hardens what's already built. If
you find a missing feature, note it in
`context/progress-tracker.md` Open Questions rather than adding
it here.

## Steps

1. Write or confirm tests for each invariant above.
2. Add the error-path tests listed.
3. Run the full suite, fix any flakiness.

## Verification

- [ ] `npm test` passes with no skipped tests
- [ ] All 4 invariants checked off (automated where possible,
      manually verified otherwise) — record the check in
      `context/progress-tracker.md`

## Files Touched

Tests across all modules

## Before Marking Done

Update `context/progress-tracker.md` — mark the testing phase
complete.
