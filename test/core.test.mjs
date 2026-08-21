import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, test } from "node:test";

import {
  readContextFile,
  scanContext,
  scanContextFiles,
} from "../dist/core/index.js";

describe("scanContextFiles", () => {
  let tempDir;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "blogify-scan-test-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  test("returns resolved .md file paths from a normal folder", () => {
    writeFileSync(join(tempDir, "alpha.md"), "# Alpha\n");
    writeFileSync(join(tempDir, "beta.md"), "# Beta\n");
    writeFileSync(join(tempDir, "notes.txt"), "ignore me\n");
    mkdirSync(join(tempDir, "nested"));
    writeFileSync(join(tempDir, "nested", "gamma.md"), "# Gamma\n");

    const paths = scanContextFiles(tempDir);

    assert.equal(paths.length, 2);
    assert.deepEqual(
      paths.map((filePath) => resolve(filePath)).sort(),
      [join(tempDir, "alpha.md"), join(tempDir, "beta.md")]
        .map((filePath) => resolve(filePath))
        .sort(),
    );
  });

  test("excludes a top-level directory whose name ends with .md", () => {
    writeFileSync(join(tempDir, "real.md"), "# Real\n");
    mkdirSync(join(tempDir, "fake.md"));
    writeFileSync(join(tempDir, "fake.md", "nested.md"), "# Nested\n");

    const paths = scanContextFiles(tempDir);

    assert.deepEqual(paths, [resolve(join(tempDir, "real.md"))]);
  });

  test("returns an empty array for an empty folder", () => {
    const paths = scanContextFiles(tempDir);

    assert.deepEqual(paths, []);
  });

  test("throws a clear error when the folder is missing", () => {
    const missingDir = join(tempDir, "does-not-exist");

    assert.throws(
      () => scanContextFiles(missingDir),
      /Context directory not found/,
    );
  });
});

describe("readContextFile", () => {
  let tempDir;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "blogify-read-test-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  test("parses frontmatter and content", () => {
    const filePath = join(tempDir, "sample.md");
    writeFileSync(
      filePath,
      "---\ntitle: Sample\ntags:\n  - cli\n---\n\n# Body\n",
    );

    const parsed = readContextFile(filePath);

    assert.equal(parsed.path, resolve(filePath));
    assert.deepEqual(parsed.frontmatter, {
      title: "Sample",
      tags: ["cli"],
    });
    assert.equal(parsed.content.trim(), "# Body");
  });
});

describe("scanContext", () => {
  let tempDir;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "blogify-scan-context-test-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  test("aggregates parsed files from a normal folder", () => {
    writeFileSync(join(tempDir, "one.md"), "# One\n");
    writeFileSync(join(tempDir, "two.md"), "---\ntitle: Two\n---\n\n# Two\n");
    writeFileSync(join(tempDir, "three.md"), "# Three\n");

    const result = scanContext(tempDir);

    assert.equal(result.files.length, 3);
    assert.deepEqual(result.errors, []);
    assert.equal(
      result.files.find((file) => file.path === resolve(join(tempDir, "two.md")))
        ?.frontmatter.title,
      "Two",
    );
  });

  test("returns an empty result for an empty folder", () => {
    const result = scanContext(tempDir);

    assert.deepEqual(result, { files: [], errors: [] });
  });

  test("throws when the folder is missing", () => {
    const missingDir = join(tempDir, "missing");

    assert.throws(() => scanContext(missingDir), /Context directory not found/);
  });

  test("skips malformed files and continues scanning valid ones", () => {
    writeFileSync(join(tempDir, "valid.md"), "# Valid\n");
    writeFileSync(
      join(tempDir, "broken.md"),
      "---\ntitle: [unclosed\n---\n\n# Broken\n",
    );
    writeFileSync(join(tempDir, "also-valid.md"), "# Also valid\n");

    const result = scanContext(tempDir);

    assert.equal(result.files.length, 2);
    assert.equal(result.errors.length, 1);
    assert.equal(result.errors[0].file, resolve(join(tempDir, "broken.md")));
    assert.ok(result.errors[0].reason.length > 0);
  });

  test("malformed YAML still errors on a subsequent scan", () => {
    writeFileSync(
      join(tempDir, "broken.md"),
      "---\ntitle: [unclosed\n---\n\n# Broken\n",
    );

    const first = scanContext(tempDir);
    const second = scanContext(tempDir);

    assert.equal(first.files.length, 0);
    assert.equal(first.errors.length, 1);
    assert.equal(second.files.length, 0);
    assert.equal(second.errors.length, 1);
  });
});

describe("scanContext against repo context/", () => {
  test("returns 6 parsed files with zero errors", () => {
    const contextDir = resolve("context");
    const result = scanContext(contextDir);

    assert.equal(result.files.length, 6);
    assert.deepEqual(result.errors, []);
  });
});
