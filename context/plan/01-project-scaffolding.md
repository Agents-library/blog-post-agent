# Phase 1 — Project Scaffolding

**Depends on:** none

## Goal

A working, buildable TypeScript CLI skeleton with a `blogify`
bin command that runs and shows help, with no real logic yet.

## In Scope

- `package.json` with name, `bin` field, scripts
  (`build`, `dev`, `test`, `lint`)
- `tsconfig.json` with `strict: true` (per
  `context/code-standards.md`)
- `src/cli/index.ts` entrypoint wired to Commander.js, before
  proceeding confirm Commander is the right call (it's currently
  an assumption in `context/progress-tracker.md`)
- Empty `init` and `generate` command stubs registered (no
  logic — `--help` works for both)
- Folder structure per `context/architecture.md` boundaries:
  `src/cli/`, `src/core/`, `src/generator/`, `src/output/`,
  `src/config/`
- ESLint config enforcing `no-explicit-any` and strict rules

## Out of Scope

- Any scanning, generation, config-loading, or output logic
  (later phases)
- Publishing to npm (Phase 9)

## Steps

1. Init the npm project. Add TypeScript, Commander, and dev
   dependencies (`ts-node`, `eslint`, `typescript`, `@types/node`).
2. Configure `tsconfig.json` with `strict: true`.
3. Create `src/cli/index.ts`. Register `init` and `generate` as
   empty Commander commands (just print "not implemented yet").
4. Set `package.json` `bin` field to the compiled entrypoint, add
   `build`/`dev`/`lint`/`test` scripts.
5. Create placeholder files in `src/core/`, `src/generator/`,
   `src/output/`, `src/config/` so the folder structure exists
   before later phases fill it in.
6. Set up ESLint per `context/code-standards.md` TypeScript
   rules.

## Verification

- [ ] `npm run build` compiles with zero errors
- [ ] `node dist/cli/index.js --help` lists both `init` and
      `generate` commands
- [ ] `blogify init --help` and `blogify generate --help` both
      print usage text without crashing

## Files Touched

`package.json`, `tsconfig.json`, `.eslintrc`,
`src/cli/index.ts`, `src/{core,generator,output,config}/`
(placeholders)

## Before Marking Done

Update `context/progress-tracker.md`: move "Scaffold project"
from Next Up to Completed. Confirm the Commander.js decision in
Architecture Decisions (or note if you chose differently and
why).
