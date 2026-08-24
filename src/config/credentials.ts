import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export const PROVIDERS = [
  "anthropic",
  "openai",
  "gemini",
  "openrouter",
] as const;

export type ProviderId = (typeof PROVIDERS)[number];

export interface StoredCredentials {
  provider: ProviderId;
  keys: Partial<Record<ProviderId, string>>;
}

const ENV_VAR: Record<ProviderId, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  gemini: "GEMINI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
};

const LABELS: Record<ProviderId, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  gemini: "Gemini",
  openrouter: "OpenRouter",
};

export function credentialsHome(): string {
  return process.env.BLOGIFY_HOME ?? homedir();
}

export function credentialsPath(homeDir = credentialsHome()): string {
  return join(homeDir, ".blogify", "credentials.json");
}

export function providerEnvVar(provider: ProviderId): string {
  return ENV_VAR[provider];
}

export function providerLabel(provider: ProviderId): string {
  return LABELS[provider];
}

export function isProviderId(value: string): value is ProviderId {
  return (PROVIDERS as readonly string[]).includes(value);
}

export function detectProviderFromKey(apiKey: string): ProviderId | undefined {
  const key = apiKey.trim();

  if (key.startsWith("sk-ant-")) {
    return "anthropic";
  }
  if (key.startsWith("sk-or-")) {
    return "openrouter";
  }
  if (key.startsWith("AIza")) {
    return "gemini";
  }
  if (key.startsWith("sk-")) {
    return "openai";
  }

  return undefined;
}

function parseStoredCredentials(raw: unknown): StoredCredentials | undefined {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return undefined;
  }

  const record = raw as Record<string, unknown>;
  const keys: Partial<Record<ProviderId, string>> = {};

  if (record.keys !== null && typeof record.keys === "object" && !Array.isArray(record.keys)) {
    const keyRecord = record.keys as Record<string, unknown>;
    for (const provider of PROVIDERS) {
      const value = keyRecord[provider];
      if (typeof value === "string" && value.trim().length > 0) {
        keys[provider] = value.trim();
      }
    }
  }

  let provider: ProviderId | undefined;
  if (typeof record.provider === "string" && isProviderId(record.provider)) {
    provider = record.provider;
  } else {
    provider = PROVIDERS.find((id) => keys[id] !== undefined);
  }

  if (provider === undefined) {
    return undefined;
  }

  return { provider, keys };
}

export function loadStoredCredentials(
  homeDir = credentialsHome(),
): StoredCredentials | undefined {
  const path = credentialsPath(homeDir);
  if (!existsSync(path)) {
    return undefined;
  }

  try {
    const raw: unknown = JSON.parse(readFileSync(path, "utf8"));
    return parseStoredCredentials(raw);
  } catch {
    return undefined;
  }
}

export function readApiKey(
  provider: ProviderId,
  homeDir = credentialsHome(),
): string | undefined {
  const fromEnv = process.env[ENV_VAR[provider]]?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  const stored = loadStoredCredentials(homeDir);
  const fromFile = stored?.keys[provider]?.trim();
  return fromFile || undefined;
}

export function listAvailableProviders(
  homeDir = credentialsHome(),
): ProviderId[] {
  return PROVIDERS.filter((provider) => readApiKey(provider, homeDir) !== undefined);
}

export function hasAnyApiKey(homeDir = credentialsHome()): boolean {
  return listAvailableProviders(homeDir).length > 0;
}

export function resolveProvider(homeDir = credentialsHome()): ProviderId {
  const preferred = process.env.BLOGIFY_PROVIDER?.trim();
  if (preferred && isProviderId(preferred) && readApiKey(preferred, homeDir)) {
    return preferred;
  }

  const stored = loadStoredCredentials(homeDir);
  if (stored && readApiKey(stored.provider, homeDir)) {
    return stored.provider;
  }

  const available = listAvailableProviders(homeDir);
  if (available.length === 1) {
    return available[0];
  }
  if (available.length > 1) {
    return available[0];
  }

  throw new Error(
    "No API key is configured. Run blogify setup, or set ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY, or OPENROUTER_API_KEY.",
  );
}

export function applyCredentialsToEnv(homeDir = credentialsHome()): void {
  const stored = loadStoredCredentials(homeDir);
  if (!stored) {
    return;
  }

  for (const provider of PROVIDERS) {
    const key = stored.keys[provider];
    const envName = ENV_VAR[provider];
    if (key && !process.env[envName]) {
      process.env[envName] = key;
    }
  }

  if (!process.env.BLOGIFY_PROVIDER) {
    process.env.BLOGIFY_PROVIDER = stored.provider;
  }
}

function persistSystemEnv(name: string, value: string): void {
  if (process.platform !== "win32") {
    return;
  }

  spawnSync("setx", [name, value], {
    stdio: "ignore",
    windowsHide: true,
  });
}

export function persistApiKey(
  provider: ProviderId,
  apiKey: string,
  options: { homeDir?: string; persistSystem?: boolean } = {},
): void {
  const key = apiKey.trim();
  if (!key) {
    throw new Error("API key cannot be empty.");
  }

  const homeDir = options.homeDir ?? credentialsHome();
  const persistSystem = options.persistSystem ?? true;
  const existing = loadStoredCredentials(homeDir);
  const stored: StoredCredentials = {
    provider,
    keys: { ...existing?.keys, [provider]: key },
  };

  const path = credentialsPath(homeDir);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(stored, null, 2)}\n`, "utf8");

  try {
    chmodSync(path, 0o600);
  } catch {
    // Windows may ignore POSIX mode bits.
  }

  process.env[ENV_VAR[provider]] = key;
  process.env.BLOGIFY_PROVIDER = provider;

  if (persistSystem) {
    persistSystemEnv(ENV_VAR[provider], key);
    persistSystemEnv("BLOGIFY_PROVIDER", provider);
  }
}
