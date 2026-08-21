# Implementation Plan — Overview

This plan builds Blogify in phases. Each phase is its own file
so an agent only needs to load one phase at a time, not the
entire plan — keeps context small and each unit independently
verifiable, per `context/ai-workflow-rules.md`.

## How to use this plan

1. Work through phases in order — each file states its
   dependency on earlier phases.
2. Treat each phase as one "unit" per
   `context/ai-workflow-rules.md`: don't start the next phase
   until the current one's Verification checklist passes.
3. After finishing a phase, update `context/progress-tracker.md`
   (move it from Next Up → Completed, note any new open
   questions or decisions) before moving on.
4. Follow `AGENTS.md` behavioral guidelines throughout — state
   assumptions, keep changes surgical, don't add anything beyond
   what the phase asks for.

## Phases

| # | File | Depends on | Goal |
|---|------|-----------|------|
| 1 | `01-project-scaffolding.md` | — | TypeScript CLI skeleton, builds and runs |
| 2 | `02-config-module.md` | 1 | Load + merge `blogify.config.json` with defaults |
| 3 | `03-core-file-scanning.md` | 2 | Scan and parse `context/*.md` files |
| 4 | `04-cli-init-command.md` | 1 | `blogify init` scaffolds folders |
| 5 | `05-generator-module.md` | 3 | Build prompt, call Anthropic API |
| 6 | `06-output-module.md` | 5 | Frontmatter + write final blog post file |
| 7 | `07-cli-generate-command.md` | 2, 3, 5, 6 | Wire `blogify generate` end to end |
| 8 | `08-testing-hardening.md` | 1–7 | Confirm invariants, fill edge-case coverage |
| 9 | `09-packaging-publish.md` | 8 | Global npm install, README, publish |

Phases 2–4 can be worked in parallel once Phase 1 is done, since
they don't depend on each other. Phase 5 needs Phase 3's output
shape defined, and Phase 7 is pure integration — no new logic of
its own.

## Open questions to resolve as you go

These are tracked in `context/progress-tracker.md` and get
resolved in specific phases:

- Overwrite behavior for `output/blog-post.md` → resolved in
  Phase 6
- Output filename derivation → resolved in Phase 6
- Commander.js as CLI framework (currently an assumption) →
  confirm in Phase 1 before proceeding
