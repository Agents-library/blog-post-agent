# Phase 5 — Generator Module

**Depends on:** Phase 3 (needs parsed context files as input)

## Goal

Implement `src/generator/` — build the Technical PM/Consultant
prompt from parsed context files, call the Anthropic API, and
return the raw generated blog post text.

## In Scope

- `buildPrompt(files: ParsedFile[])` — constructs a single
  prompt that instructs the model to:
  - synthesize across all files, not summarize per-file
  - write in the Technical PM/Consultant voice defined in
    `context/project-overview.md`
  - follow the fixed structure: Situation → Approach → What Was
    Built → Key Decisions → Impact → Lessons/Next
  - never fabricate metrics not present in the source files
    (per `context/architecture.md` invariant #2)
- `callAnthropic(prompt)` — wraps `@anthropic-ai/sdk`, reads
  `ANTHROPIC_API_KEY` from `process.env`, throws a clear error if
  it's missing
- Response validation before returning (non-empty text block),
  per `context/code-standards.md` Anthropic API Usage rules
- One automatic retry on transient failures only (e.g. 5xx) — no
  silent retry loop, per `context/code-standards.md`

## Out of Scope

- Writing the file to disk (Phase 6)
- Frontmatter generation (Phase 6)

## Steps

1. Implement `buildPrompt()` with the fixed template baked in —
   not user-configurable in v1 (per
   `context/project-overview.md` scope).
2. Implement `callAnthropic()` with clear, distinct error
   messages for: missing API key, network failure, malformed or
   empty response.
3. Add a single automatic retry on transient errors only.
4. Unit tests: prompt builder produces the expected structure and
   instructions given sample parsed files; `callAnthropic()`
   tested with the SDK call mocked, covering each error path.

## Verification

- [ ] Unit tests pass for prompt construction and all error
      handling paths
- [ ] Manual run with a real API key against this repo's
      `context/` folder produces coherent PM/Consultant-style
      markdown (human review, not asserted in tests)

## Files Touched

`src/generator/prompt.ts`, `src/generator/client.ts`,
`src/generator/index.ts`, tests

## Before Marking Done

Update `context/progress-tracker.md`. If the prompt's structure
changes from what's specified, update
`context/project-overview.md`'s blog post template so the spec
doesn't drift from the implementation.
