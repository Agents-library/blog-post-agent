import { existsSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";

import chalk from "chalk";
import type { Command } from "commander";
import ora from "ora";

import { loadConfig } from "../config";
import { providerLabel } from "../config/credentials";
import type { ConfigOverrides } from "../config/types";
import { scanContext } from "../core";
import { buildPrompt, generateCompletion } from "../generator";
import type { AnthropicClient } from "../generator";
import { buildFrontmatter, writeOutput } from "../output";
import { ensureApiSetup } from "./setup";

export interface GenerateOptions {
  dir?: string;
  out?: string;
  verbose?: boolean;
}

export interface GenerateDeps {
  client?: AnthropicClient;
}

function formatDisplayPath(absolutePath: string, cwd: string): string {
  const displayPath = relative(cwd, absolutePath) || absolutePath;
  return displayPath.replace(/\\/g, "/");
}

function isInsideOrEqual(candidate: string, root: string): boolean {
  const relativeToRoot = relative(root, candidate);

  return (
    relativeToRoot === "" ||
    (!relativeToRoot.startsWith(`..${sep}`) &&
      relativeToRoot !== ".." &&
      !isAbsolute(relativeToRoot))
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

export function printGenerateFailure(error: unknown, verbose?: boolean): void {
  console.error(chalk.red(`✗ ${errorMessage(error)}`));

  if (verbose === true && error instanceof Error && error.stack !== undefined) {
    console.error(error.stack);
  }
}

export async function runGenerate(
  options: GenerateOptions = {},
  deps: GenerateDeps = {},
): Promise<void> {
  const cwd = process.cwd();
  const cliOverrides: ConfigOverrides = {};

  if (options.dir !== undefined) {
    cliOverrides.contextDir = options.dir;
  }
  if (options.out !== undefined) {
    cliOverrides.outputPath = options.out;
  }

  const config = loadConfig(cliOverrides);
  const contextDir = resolve(cwd, config.contextDir);
  const outputPath = resolve(cwd, config.outputPath);
  const outputDisplay = formatDisplayPath(outputPath, cwd);

  if (isInsideOrEqual(outputPath, contextDir)) {
    throw new Error(
      `Output path ${outputDisplay} is inside the context directory. Choose a path outside ${config.contextDir}.`,
    );
  }

  console.log(chalk.cyan("Generating blog post..."));
  console.log();

  const scanSpinner = ora(`Scanning ${config.contextDir}`).start();
  let fileCount: number;
  let prompt: string;

  try {
    const result = scanContext(contextDir);
    fileCount = result.files.length;

    if (fileCount === 0 && result.errors.length === 0) {
      scanSpinner.stop();
      console.log(chalk.yellow(`${config.contextDir} folder is empty`));
      return;
    }

    if (result.errors.length > 0) {
      scanSpinner.stop();
      for (const scanError of result.errors) {
        const fileDisplay = formatDisplayPath(scanError.file, cwd);
        console.log(chalk.yellow(`Skipped ${fileDisplay}: ${scanError.reason}`));
      }
    }

    if (fileCount === 0) {
      throw new Error(
        `No readable Markdown files in ${config.contextDir}. Fix the skipped files and try again.`,
      );
    }

    prompt = buildPrompt(result.files);

    if (result.errors.length === 0) {
      scanSpinner.succeed(
        `Scanned ${fileCount} Markdown file${fileCount === 1 ? "" : "s"}`,
      );
    } else {
      console.log(
        chalk.green(
          `✓ Scanned ${fileCount} Markdown file${fileCount === 1 ? "" : "s"}`,
        ),
      );
    }
  } catch (error) {
    if (scanSpinner.isSpinning) {
      scanSpinner.fail(`Failed to scan ${config.contextDir}`);
    }
    throw error;
  }

  const provider =
    deps.client === undefined ? await ensureApiSetup() : undefined;
  const providerName = provider ? providerLabel(provider) : "Anthropic";
  const apiSpinner = ora(`Calling ${providerName} API...`).start();
  let body: string;

  try {
    body = await generateCompletion(prompt, {
      client: deps.client,
      provider,
    });
    apiSpinner.succeed("Generated blog post content");
  } catch (error) {
    apiSpinner.fail(`${providerName} API call failed`);
    throw error;
  }

  if (existsSync(outputPath)) {
    console.log(chalk.cyan(`Overwriting existing file ${outputDisplay}`));
  }

  const frontmatter = buildFrontmatter({ content: body });
  writeOutput(`${frontmatter}\n${body.trim()}\n`, outputPath);

  console.log();
  console.log(chalk.green(`✓ Blog post written to ${outputDisplay}`));
}

export function registerGenerateCommand(program: Command): void {
  program
    .command("generate")
    .description("Scan context Markdown files and generate a blog post")
    .option("--dir <path>", "override the context folder location")
    .option("--out <path>", "override the output file path")
    .option("--verbose", "show full error stack traces on failure")
    .action(async (options: GenerateOptions) => {
      try {
        await runGenerate(options);
      } catch (error) {
        printGenerateFailure(error, options.verbose);
        process.exit(1);
      }
    });
}
