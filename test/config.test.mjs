import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, test } from "node:test";

import { DEFAULT_CONFIG, loadConfig } from "../dist/config/index.js";

describe("loadConfig", () => {
  let originalCwd;
  let tempDir;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = mkdtempSync(join(tmpdir(), "blogify-config-test-"));
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
  });

  test("returns defaults when no config file is present", () => {
    const config = loadConfig();

    assert.deepEqual(config, DEFAULT_CONFIG);
  });

  test("merges values from blogify.config.json", () => {
    writeFileSync(
      join(tempDir, "blogify.config.json"),
      JSON.stringify({
        contextDir: "docs/",
        outputPath: "dist/post.md",
      }),
    );

    const config = loadConfig();

    assert.deepEqual(config, {
      contextDir: "docs/",
      outputPath: "dist/post.md",
    });
  });

  test("applies CLI overrides after config file values", () => {
    writeFileSync(
      join(tempDir, "blogify.config.json"),
      JSON.stringify({
        contextDir: "docs/",
        outputPath: "dist/post.md",
      }),
    );

    const config = loadConfig({
      contextDir: "cli-context/",
      outputPath: "cli-output/post.md",
    });

    assert.deepEqual(config, {
      contextDir: "cli-context/",
      outputPath: "cli-output/post.md",
    });
  });

  test("throws a clear error for malformed config files", () => {
    writeFileSync(join(tempDir, "blogify.config.json"), "{ not-json");

    assert.throws(
      () => loadConfig(),
      /blogify\.config\.json is not valid JSON/,
    );

    writeFileSync(join(tempDir, "blogify.config.json"), "[]");

    assert.throws(
      () => loadConfig(),
      /must be a JSON object/,
    );

    writeFileSync(
      join(tempDir, "blogify.config.json"),
      JSON.stringify({ contextDir: "" }),
    );

    assert.throws(
      () => loadConfig(),
      /"contextDir" must be a non-empty string/,
    );
  });
});
