import { existsSync, mkdirSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

import chalk from "chalk";
import type { Command } from "commander";

import { DEFAULT_CONFIG } from "../config/defaults";

export interface InitOptions {
  dir?: string;
  out?: string;
}

interface EnsureDirResult {
  path: string;
  created: boolean;
}

function ensureDirectory(absolutePath: string): EnsureDirResult {
  const created = !existsSync(absolutePath);
  mkdirSync(absolutePath, { recursive: true });
  return { path: absolutePath, created };
}

function formatDisplayPath(absolutePath: string, cwd: string): string {
  const displayPath = relative(cwd, absolutePath) || absolutePath;
  return displayPath.replace(/\\/g, "/");
}

export function runInit(cwd: string, options: InitOptions = {}): void {
  const contextDir = options.dir ?? DEFAULT_CONFIG.contextDir;
  const outputPath = options.out ?? DEFAULT_CONFIG.outputPath;
  const outputDir = dirname(outputPath);

  const contextResult = ensureDirectory(resolve(cwd, contextDir));
  const outputResult = ensureDirectory(resolve(cwd, outputDir));

  console.log(chalk.cyan("Initializing Blogify project..."));
  console.log();

  for (const result of [contextResult, outputResult]) {
    const displayPath = formatDisplayPath(result.path, cwd);

    if (result.created) {
      console.log(chalk.green(`✓ Created ${displayPath}`));
    } else {
      console.log(chalk.cyan(`${displayPath} already exists`));
    }
  }

  console.log();

  const anyCreated = contextResult.created || outputResult.created;
  if (anyCreated) {
    console.log(
      chalk.green(
        `Ready — add Markdown files to ${contextDir} and run blogify generate.`,
      ),
    );
    console.log(
      chalk.dim(
        "On first generate, Blogify will ask you to choose a provider and save an API key.",
      ),
    );
  } else {
    console.log(chalk.cyan("Nothing to create — folders are already in place."));
  }
}

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Scaffold context/ and output/ folders in the current project")
    .option("--dir <path>", "override the context folder location")
    .option("--out <path>", "override the output file path")
    .action((options: InitOptions) => {
      runInit(process.cwd(), options);
    });
}
