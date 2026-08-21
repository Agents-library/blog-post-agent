import assert from "node:assert/strict";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { afterEach, beforeEach, describe, test } from "node:test";

import { runGenerate } from "../dist/cli/generate.js";
import { loadConfig } from "../dist/config/index.js";
import { buildPrompt } from "../dist/generator/index.js";
import { writeOutput } from "../dist/output/index.js";

const generatedBody = [
  "# Shipping Blogify From Context",
  "",
  "A Technical PM write-up of the Blogify generate flow.",
  "",
  "## Situation",
  "Teams needed a repeatable way to turn project notes into a post.",
].join("\n");

function mockClient(text = generatedBody) {
  return {
    messages: {
      create: async () => ({
        content: [{ type: "text", text }],
      }),
    },
  };
}

function listRelativeFiles(rootDir) {
  const files = [];

  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        files.push(relative(rootDir, fullPath).replace(/\\/g, "/"));
      }
    }
  }

  walk(rootDir);
  return files.sort();
}

function snapshotTree(dir) {
  const snapshot = {};

  function walk(current) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = join(current, entry.name);
      const key = relative(dir, fullPath).replace(/\\/g, "/");

      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        const stats = statSync(fullPath);
        snapshot[key] = {
          content: readFileSync(fullPath, "utf8"),
          mtimeMs: stats.mtimeMs,
          size: stats.size,
        };
      }
    }
  }

  walk(dir);
  return snapshot;
}

describe("architecture invariants", () => {
  let tempDir;
  let originalCwd;
  let originalApiKey;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "blogify-hardening-"));
    originalCwd = process.cwd();
    originalApiKey = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = "test-api-key";
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);

    if (originalApiKey === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = originalApiKey;
    }

    rmSync(tempDir, { recursive: true, force: true });
  });

  test("writeOutput() only writes the resolved outputPath, never a sibling path", () => {
    const outputPath = resolve(tempDir, "output", "blog-post.md");
    const siblingPath = join(tempDir, "unrelated.txt");
    writeFileSync(siblingPath, "leave me alone\n", "utf8");

    writeOutput("# Generated post\n", outputPath);

    assert.equal(resolve(outputPath), outputPath);
    assert.equal(readFileSync(outputPath, "utf8"), "# Generated post\n");
    assert.equal(readFileSync(siblingPath, "utf8"), "leave me alone\n");
    assert.deepEqual(listRelativeFiles(tempDir), [
      "output/blog-post.md",
      "unrelated.txt",
    ]);
  });

  test("buildPrompt forbids fabricating quantitative claims not in the sources", () => {
    const prompt = buildPrompt([
      {
        path: join(tempDir, "context", "overview.md"),
        frontmatter: {},
        content: "# Overview\n\nBlogify generates PM-style blog posts.\n",
      },
    ]);

    assert.match(
      prompt,
      /Never fabricate metrics, percentages, timelines, or other quantitative claims not present in the source files/,
    );
    assert.match(
      prompt,
      /If the sources lack quantitative data, describe impact qualitatively instead of inventing numbers/,
    );
  });

  test("generate completes with zero project-specific config", async () => {
    mkdirSync(join(tempDir, "context"));
    writeFileSync(
      join(tempDir, "context", "overview.md"),
      "# Overview\n\nBlogify generates PM-style blog posts.\n",
      "utf8",
    );

    assert.ok(!existsSync(join(tempDir, "blogify.config.json")));

    const config = loadConfig();
    assert.equal(config.contextDir, "context/");
    assert.equal(config.outputPath, "output/blog-post.md");

    await runGenerate({}, { client: mockClient() });

    assert.ok(!existsSync(join(tempDir, "blogify.config.json")));
    assert.ok(existsSync(join(tempDir, "output", "blog-post.md")));
  });

  test("generate does not modify or delete files in context/", async () => {
    const contextDir = join(tempDir, "context");
    mkdirSync(contextDir);
    writeFileSync(
      join(contextDir, "overview.md"),
      "# Overview\n\nSource file that must stay untouched.\n",
      "utf8",
    );
    writeFileSync(
      join(contextDir, "architecture.md"),
      "# Architecture\n\nTypeScript CLI with a mocked API client.\n",
      "utf8",
    );

    const before = snapshotTree(contextDir);

    await runGenerate({}, { client: mockClient() });

    assert.deepEqual(snapshotTree(contextDir), before);
    assert.ok(existsSync(join(tempDir, "output", "blog-post.md")));
  });
});

describe("error paths", () => {
  let tempDir;
  let originalCwd;
  let originalApiKey;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "blogify-errors-"));
    originalCwd = process.cwd();
    originalApiKey = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = "test-api-key";
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);

    if (originalApiKey === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = originalApiKey;
    }

    rmSync(tempDir, { recursive: true, force: true });
  });

  test("generate throws on malformed blogify.config.json", async () => {
    mkdirSync(join(tempDir, "context"));
    writeFileSync(
      join(tempDir, "context", "overview.md"),
      "# Overview\n\nSource file.\n",
      "utf8",
    );
    writeFileSync(join(tempDir, "blogify.config.json"), "{ not-json", "utf8");

    await assert.rejects(
      () => runGenerate({}, { client: mockClient() }),
      /blogify\.config\.json is not valid JSON/,
    );
  });

  test("generate throws when ANTHROPIC_API_KEY is missing", async () => {
    mkdirSync(join(tempDir, "context"));
    writeFileSync(
      join(tempDir, "context", "overview.md"),
      "# Overview\n\nSource file.\n",
      "utf8",
    );
    delete process.env.ANTHROPIC_API_KEY;

    await assert.rejects(
      () => runGenerate({}, { client: mockClient() }),
      /ANTHROPIC_API_KEY environment variable is not set/,
    );
  });

  test("writeOutput throws when the output path is permission-denied", () => {
    const outputDir = join(tempDir, "output");
    mkdirSync(outputDir, { recursive: true });
    const outputPath = join(outputDir, "blog-post.md");
    writeFileSync(outputPath, "existing\n", "utf8");
    chmodSync(outputPath, 0o444);

    try {
      assert.throws(
        () => writeOutput("new content\n", outputPath),
        (error) =>
          error instanceof Error &&
          (error.code === "EPERM" || error.code === "EACCES"),
      );
    } finally {
      chmodSync(outputPath, 0o666);
    }
  });

  test("generate throws when the output directory is permission-denied", async () => {
    mkdirSync(join(tempDir, "context"));
    writeFileSync(
      join(tempDir, "context", "overview.md"),
      "# Overview\n\nSource file.\n",
      "utf8",
    );

    const outputDir = join(tempDir, "output");
    mkdirSync(outputDir, { recursive: true });
    const outputPath = join(outputDir, "blog-post.md");
    writeFileSync(outputPath, "existing\n", "utf8");
    chmodSync(outputPath, 0o444);

    try {
      await assert.rejects(
        () => runGenerate({}, { client: mockClient() }),
        (error) =>
          error instanceof Error &&
          (error.code === "EPERM" || error.code === "EACCES"),
      );
    } finally {
      chmodSync(outputPath, 0o666);
    }
  });
});
