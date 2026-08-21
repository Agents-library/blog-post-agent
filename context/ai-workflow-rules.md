# AI Workflow Rules

## Approach

Build Blogify incrementally using a spec-driven workflow. The
context files in this folder (`project-overview.md`,
`architecture.md`, `code-standards.md`, `ui-context.md`,
`progress-tracker.md`) define what to build, how to build it,
and the current state of progress. Always implement against
these specs — do not infer or invent CLI behavior, prompt
structure, or output format from scratch.

## Scoping Rules

- Work on one feature unit at a time
- Prefer small, verifiable increments over large speculative
  changes
- Do not combine unrelated system boundaries in a single
  implementation step

## When to Split Work

Split an implementation step if it combines:

- File scanning/parsing logic and AI generation/prompt logic
- CLI argument handling and core business logic (scanning,
  generation, writing)
- Behavior not clearly defined in `project-overview.md` or
  `architecture.md`

If a change cannot be verified end to end quickly, the scope is
too broad — split it.

## Handling Missing Requirements

- Do not invent product behavior not defined in the context
  files
- If a requirement is ambiguous, resolve it in the relevant
  context file before implementing
- If a requirement is missing, add it as an open question in
  `progress-tracker.md` before continuing

## Protected Files

Do not modify the following unless explicitly instructed:

- `src/config/defaults.ts` — default configuration values;
  changes affect every project using the tool
- Generated `output/*.md` files in example/test projects — these
  are regenerated, not hand-edited

## Keeping Docs in Sync

Update the relevant context file whenever implementation
changes:

- System architecture or boundaries
- Storage model decisions
- Code conventions or standards
- Feature scope

## Before Moving to the Next Unit

1. The current unit works end to end within its defined scope
2. No invariant defined in `architecture.md` was violated
3. `progress-tracker.md` reflects the completed work
4. `npm run build` passes
