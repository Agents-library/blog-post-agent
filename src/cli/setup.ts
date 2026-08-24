import { createInterface } from "node:readline/promises";

import chalk from "chalk";
import type { Command } from "commander";

import {
  PROVIDERS,
  applyCredentialsToEnv,
  detectProviderFromKey,
  hasAnyApiKey,
  isProviderId,
  persistApiKey,
  providerLabel,
  resolveProvider,
} from "../config/credentials";
import type { ProviderId } from "../config/credentials";

export interface SetupQuestioner {
  (prompt: string): Promise<string>;
}

export interface SetupOptions {
  question?: SetupQuestioner;
  homeDir?: string;
  persistSystem?: boolean;
  interactive?: boolean;
}

function parseProviderChoice(input: string): ProviderId | undefined {
  const value = input.trim().toLowerCase();
  const index = Number.parseInt(value, 10);
  if (index >= 1 && index <= PROVIDERS.length) {
    return PROVIDERS[index - 1];
  }

  if (isProviderId(value)) {
    return value;
  }

  const byLabel = PROVIDERS.find(
    (provider) => providerLabel(provider).toLowerCase() === value,
  );
  return byLabel;
}

async function defaultQuestion(prompt: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    return await rl.question(prompt);
  } finally {
    rl.close();
  }
}

function printProviderMenu(): void {
  console.log(chalk.cyan("First-time setup — choose an AI provider"));
  console.log();
  PROVIDERS.forEach((provider, index) => {
    console.log(`  ${index + 1}) ${providerLabel(provider)}`);
  });
  console.log();
  console.log(
    chalk.dim("Paste an API key instead of a number to auto-detect the provider."),
  );
}

export async function runSetup(options: SetupOptions = {}): Promise<ProviderId> {
  const question = options.question ?? defaultQuestion;
  const persistSystem = options.persistSystem ?? true;
  const homeDir = options.homeDir;

  printProviderMenu();
  const firstAnswer = (await question("Provider or API key: ")).trim();
  if (!firstAnswer) {
    throw new Error("No provider or API key was entered.");
  }

  const detectedFromPaste = detectProviderFromKey(firstAnswer);
  let provider: ProviderId;
  let apiKey: string;

  if (detectedFromPaste) {
    provider = detectedFromPaste;
    apiKey = firstAnswer;
    console.log(
      chalk.cyan(`Detected ${providerLabel(provider)} from the API key.`),
    );
  } else {
    const chosen = parseProviderChoice(firstAnswer);
    if (!chosen) {
      throw new Error(
        "Choose 1–4, a provider name, or paste an API key (sk-ant-, sk-, AIza, or sk-or-).",
      );
    }

    provider = chosen;
    apiKey = (await question(`Enter ${providerLabel(provider)} API key: `)).trim();
    if (!apiKey) {
      throw new Error("API key cannot be empty.");
    }

    const detected = detectProviderFromKey(apiKey);
    if (detected && detected !== provider) {
      console.log(
        chalk.cyan(
          `This key looks like ${providerLabel(detected)}; using ${providerLabel(detected)}.`,
        ),
      );
      provider = detected;
    }
  }

  persistApiKey(provider, apiKey, { homeDir, persistSystem });
  console.log();
  console.log(
    chalk.green(
      `✓ Saved ${providerLabel(provider)} API key for this machine.`,
    ),
  );

  return provider;
}

export async function ensureApiSetup(
  options: SetupOptions = {},
): Promise<ProviderId | undefined> {
  applyCredentialsToEnv(options.homeDir);

  if (hasAnyApiKey(options.homeDir)) {
    return resolveProvider(options.homeDir);
  }

  const interactive =
    options.interactive ??
    Boolean(process.stdin.isTTY && process.stdout.isTTY);

  if (!interactive) {
    throw new Error(
      "No API key is configured. Run blogify setup, or set ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY, or OPENROUTER_API_KEY.",
    );
  }

  return runSetup(options);
}

export function registerSetupCommand(program: Command): void {
  program
    .command("setup")
    .description("Choose an AI provider and save an API key for this machine")
    .action(async () => {
      try {
        await runSetup();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(chalk.red(`✗ ${message}`));
        process.exit(1);
      }
    });
}
