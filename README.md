# Blogify

CLI that scans a project's `context/` folder for Markdown files and
generates a Technical PM/Consultant-style blog post.

Requires **Node.js 18+**. Not published to npm — install from this
repo or from a packed `.tgz` file.

## Install locally (this machine)

From the project folder:

```bash
npm install
npm run build
npm link
```

`npm link` puts `blogify` on your PATH. Then run `blogify --help`
from any directory.

To unlink later:

```bash
npm unlink -g blogify
```

## Share a file for someone else to install

Pack a tarball you can send (email, chat, USB):

```bash
npm install
npm run build
npm pack
```

That creates `blogify-0.1.0.tgz` in the project root. The recipient
needs Node.js 18+, then from the folder that contains the file:

```bash
npm install -g ./blogify-0.1.0.tgz
```

On Windows Command Prompt:

```cmd
npm install -g blogify-0.1.0.tgz
```

They can confirm with `blogify --help` and `blogify --version`.

Uninstall:

```bash
npm uninstall -g blogify
```

## Quickstart

1. In the project you want to write about:

   ```bash
   blogify init
   ```

   This creates `context/` and `output/` if they are missing.

2. Add Markdown files to `context/` (architecture notes, README
   excerpts, decision logs — anything the post should draw from).

3. Save an API key once (or let the first `generate` prompt you):

   ```bash
   blogify setup
   ```

   Supported providers: Anthropic, OpenAI, Gemini, OpenRouter.
   Keys are stored for the current user (`~/.blogify/credentials.json`
   and Windows user environment variables), never in the project.

4. Generate:

   ```bash
   blogify generate
   ```

   Output is written to `output/blog-post.md` (overwritten on each
   run, with a notice in the terminal).

## Commands

| Command | What it does |
| --- | --- |
| `blogify init` | Scaffold `context/` and `output/` |
| `blogify generate` | Scan `context/*.md`, call the saved provider, write the post |
| `blogify setup` | Choose a provider and save an API key |
| `blogify --help` | Show usage |

Flags:

- `--dir <path>` — context folder (`init` and `generate`)
- `--out <path>` — output file path (`init` and `generate`)
- `--verbose` — full stack traces on `generate` errors

Optional `blogify.config.json` in the project root can set folder
paths. CLI flags override the file; both override built-in defaults
(`context/`, `output/blog-post.md`).

## Example output

`output/blog-post.md` is Markdown with YAML frontmatter, then a
fixed section order:

```markdown
---
title: Example Project
date: 2026-08-21
tags: []
summary: Short description inferred from the generated post.
---

## Situation
...

## Approach
...

## What Was Built
...

## Key Decisions
...

## Impact
...

## Lessons / Next
...
```

Only top-level `.md` files in `context/` are read. The tool does
not invent metrics that are not in those files.

## Develop from source (no global install)

```bash
npm install
npm run build
npm run dev -- --help
```

`npm run dev` runs the CLI via `ts-node` without a global install.
Pass command args after `--`.
