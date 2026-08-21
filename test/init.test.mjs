import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, test } from "node:test";

import { runInit } from "../dist/cli/init.js";

describe("runInit", () => {
  let tempDir;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "blogify-init-test-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  test("creates context/ and output/ in an empty directory", () => {
    runInit(tempDir);

    assert.ok(existsSync(join(tempDir, "context")));
    assert.ok(existsSync(join(tempDir, "output")));
  });

  test("is a no-op on second run and does not throw", () => {
    runInit(tempDir);
    assert.doesNotThrow(() => runInit(tempDir));

    assert.ok(existsSync(join(tempDir, "context")));
    assert.ok(existsSync(join(tempDir, "output")));
  });

  test("respects --dir and --out overrides", () => {
    runInit(tempDir, { dir: "docs/", out: "reports/post.md" });

    assert.ok(existsSync(join(tempDir, "docs")));
    assert.ok(existsSync(join(tempDir, "reports")));
    assert.ok(!existsSync(join(tempDir, "context")));
    assert.ok(!existsSync(join(tempDir, "output")));
  });

  test("respects absolute --dir and --out overrides", () => {
    const absContext = resolve(tempDir, "abs-docs");
    const absOutputFile = resolve(tempDir, "abs-reports", "post.md");

    runInit(tempDir, { dir: absContext, out: absOutputFile });

    assert.ok(existsSync(absContext));
    assert.ok(existsSync(resolve(tempDir, "abs-reports")));
    assert.ok(!existsSync(join(tempDir, "context")));
    assert.ok(!existsSync(join(tempDir, "output")));
  });
});
