# Blogify

## Overview

Blogify is a CLI tool that scans a project's `context/` folder
for Markdown documentation and generates a polished, Technical
PM/Consultant-style blog post summarizing the project — its
problem framing, key decisions, and impact. It runs inside any
project directory with no per-project setup, using a globally
installed CLI and the Anthropic API to synthesize context files
into a single blog post.

## Goals

1. Generate a publish-ready blog post from existing project MD
   files in under a minute, with no manual copy-pasting.
2. Produce consistent, professional output in a Technical
   PM/Consultant voice across different kinds of projects.
3. Work identically across any project folder with zero
   per-project configuration, while still allowing overrides.

## Core User Flow

1. User installs Blogify globally (`npm install -g blogify`).
2. User sets `ANTHROPIC_API_KEY` once as an environment variable.
3. User creates a `context/` folder in their project and adds
   relevant MD files (README, architecture, changelog, etc.).
4. User runs `blogify generate` from the project root.
5. Blogify reads all `.md` files in `context/`, synthesizes
   them, and writes a formatted blog post to
   `output/blog-post.md`.
6. User reviews and edits the generated post before publishing.

## Features

### Core

- Scans and reads all `.md` files in a `context/` folder
  (configurable)
- Synthesizes multiple files into one coherent post — not a
  per-file summary
- Applies a fixed Technical PM/Consultant tone and structure
- Writes output as a single `.md` file with frontmatter (title,
  date, tags, summary)

### CLI Commands

- `blogify init` — scaffolds `context/` and `output/` folders in
  the current project
- `blogify generate` — runs the scan + generate + write flow
- `--dir <path>` — override the context folder location
- `--out <path>` — override the output file path

### Configuration

- Optional `blogify.config.json` in the project root for
  per-project overrides (folder paths, tone adjustments)

## Scope

### In Scope

- Local CLI usage, one project at a time
- Reading `.md` files only
- Generating a single blog post per run
- Technical PM/Consultant tone as the default — and only — style
  for v1

### Out of Scope

- Web UI or hosted version
- Multi-author / team review workflows
- Publishing directly to a blog platform (Medium, Dev.to, etc.)
- Non-Markdown source files (PDFs, Notion exports, etc.)
- Multiple tone/style presets (deferred to a later version)

## Success Criteria

1. Running `blogify generate` inside a project with a populated
   `context/` folder produces a complete, readable blog post in
   `output/`.
2. The generated post follows the Situation → Approach → What
   Was Built → Key Decisions → Impact → Lessons structure every
   time.
3. The tool works with zero project-specific configuration on a
   fresh project — only global install + API key needed.
4. No fabricated metrics appear in generated posts when source
   files contain no quantitative data.
