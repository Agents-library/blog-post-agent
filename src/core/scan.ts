import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import matter from "gray-matter";

import type { ParsedFile, ScanError, ScanResult } from "./types";

const loadYaml = createRequire(__filename);
const yaml = loadYaml("js-yaml") as {
  load: (input: string) => unknown;
};

function parseFrontmatterYaml(input: string): Record<string, unknown> {
  const parsed: unknown = yaml.load(input);

  if (parsed === undefined || parsed === null) {
    return {};
  }

  if (typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Frontmatter must be a YAML object.");
  }

  return parsed as Record<string, unknown>;
}

export function scanContextFiles(contextDir: string): string[] {
  const resolvedDir = resolve(contextDir);

  if (!existsSync(resolvedDir)) {
    throw new Error(`Context directory not found: ${resolvedDir}`);
  }

  if (!statSync(resolvedDir).isDirectory()) {
    throw new Error(`Context path is not a directory: ${resolvedDir}`);
  }

  return readdirSync(resolvedDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => resolve(resolvedDir, entry.name));
}

export function readContextFile(filePath: string): ParsedFile {
  const resolvedPath = resolve(filePath);
  const raw = readFileSync(resolvedPath, "utf8");
  const { data, content } = matter(raw, {
    engines: {
      yaml: parseFrontmatterYaml,
    },
  });
  const frontmatter =
    typeof data === "object" && data !== null && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {};

  return {
    path: resolvedPath,
    frontmatter,
    content,
  };
}

export function scanContext(contextDir: string): ScanResult {
  const filePaths = scanContextFiles(contextDir);
  const files: ParsedFile[] = [];
  const errors: ScanError[] = [];

  for (const filePath of filePaths) {
    try {
      files.push(readContextFile(filePath));
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "Unknown error reading file";
      errors.push({ file: filePath, reason });
    }
  }

  return { files, errors };
}
