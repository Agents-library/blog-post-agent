import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { DEFAULT_CONFIG } from "./defaults";
import type {
  BlogifyConfigFile,
  Config,
  ConfigOverrides,
} from "./types";

const CONFIG_FILENAME = "blogify.config.json";
const ALLOWED_CONFIG_KEYS = new Set(["contextDir", "outputPath"]);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export function validateConfigFile(data: unknown): BlogifyConfigFile {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(
      `${CONFIG_FILENAME} must be a JSON object with optional "contextDir" and "outputPath" fields.`,
    );
  }

  const record = data as Record<string, unknown>;
  const validated: BlogifyConfigFile = {};

  for (const key of Object.keys(record)) {
    if (!ALLOWED_CONFIG_KEYS.has(key)) {
      throw new Error(
        `${CONFIG_FILENAME} contains unknown field "${key}". Allowed fields: contextDir, outputPath.`,
      );
    }
  }

  if ("contextDir" in record) {
    if (!isNonEmptyString(record.contextDir)) {
      throw new Error(
        `${CONFIG_FILENAME} field "contextDir" must be a non-empty string.`,
      );
    }
    validated.contextDir = record.contextDir;
  }

  if ("outputPath" in record) {
    if (!isNonEmptyString(record.outputPath)) {
      throw new Error(
        `${CONFIG_FILENAME} field "outputPath" must be a non-empty string.`,
      );
    }
    validated.outputPath = record.outputPath;
  }

  return validated;
}

function readConfigFile(cwd: string): BlogifyConfigFile {
  const configPath = join(cwd, CONFIG_FILENAME);

  if (!existsSync(configPath)) {
    return {};
  }

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(configPath, "utf8")) as unknown;
  } catch {
    throw new Error(
      `${CONFIG_FILENAME} is not valid JSON. Check the file for syntax errors.`,
    );
  }

  return validateConfigFile(raw);
}

export function loadConfig(cliOverrides: ConfigOverrides = {}): Config {
  const fileConfig = readConfigFile(process.cwd());

  return {
    ...DEFAULT_CONFIG,
    ...fileConfig,
    ...cliOverrides,
  };
}

export type { BlogifyConfigFile, Config, ConfigOverrides } from "./types";
export { DEFAULT_CONFIG } from "./defaults";
