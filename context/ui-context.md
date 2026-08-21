# UI Context

> Blogify is a CLI-only tool — there is no graphical UI. "UI"
> here means terminal output conventions: what gets printed, in
> what color, and in what order, across every command.

## Theme

Terminal output only. No GUI, no light/dark mode setting of our
own — output should respect the user's own terminal theme by
sticking to semantic colors rather than fixed hex values.

## Colors (semantic terminal colors via `chalk`)

| Role    | Style       | Usage                                             |
| ------- | ----------- | -------------------------------------------------- |
| Success | green       | Completed steps, final "blog post written to..."   |
| Error   | red         | Failed steps, validation errors                    |
| Info    | cyan        | Progress/status messages (e.g. "Scanning context/") |
| Warning | yellow      | Non-fatal issues (e.g. "context/ folder is empty") |
| Muted   | gray / dim  | Secondary detail text (file paths, counts)          |

## Typography

N/A — terminal output only, no font control beyond the user's own
terminal settings.

## Border Radius

N/A — not applicable to a CLI tool.

## Component Library

N/A — no UI components. CLI output uses `chalk` (color) and
`ora` (spinners) per the CLI Output rules in
`code-standards.md`.

## Layout Patterns (command output structure)

- Every command prints a short header line, then step-by-step
  status lines, then a final summary line
- Spinners are used for any step over ~1s (scanning files,
  calling the API) and resolve to a ✓ or ✗ symbol
- Errors always end the process with a single red summary line —
  no raw stack traces unless `--verbose` is passed

## Icons / Symbols

- `✓` for completed steps, `✗` for failed steps, spinner frames
  for in-progress steps — no emoji, keep output professional and
  terminal-friendly
