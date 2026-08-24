import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, test } from "node:test";

import matter from "gray-matter";

import { printGenerateFailure, runGenerate } from "../dist/cli/generate.js";

const generatedBody = [
  "# Shipping Blogify From Context",
  "",
  "A Technical PM write-up of the Blogify generate flow.",
  "",
  "## Situation",
  "Teams needed a repeatable way to turn project notes into a post.",
  "",
  "## Approach",
  "Wire config, scan, generate, and write behind one command.",
].join("\n");

function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function mockClient(text = generatedBody) {
  return {
    messages: {
      create: async () => ({
        content: [{ type: "text", text }],
      }),
    },
  };
}

describe("runGenerate", { concurrency: false }, () => {
  let tempDir;
  let originalCwd;
  let originalEnv;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "blogify-generate-test-"));
    originalCwd = process.cwd();
    originalEnv = {
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
      BLOGIFY_PROVIDER: process.env.BLOGIFY_PROVIDER,
      BLOGIFY_HOME: process.env.BLOGIFY_HOME,
    };
    process.env.ANTHROPIC_API_KEY = "test-api-key";
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.BLOGIFY_PROVIDER;
    process.env.BLOGIFY_HOME = tempDir;
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);

    for (const [name, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }

    rmSync(tempDir, { recursive: true, force: true });
  });

  test("writes output/blog-post.md with expected frontmatter from a fixture context/", async () => {
    mkdirSync(join(tempDir, "context"));
    writeFileSync(
      join(tempDir, "context", "overview.md"),
      "# Overview\n\nBlogify generates PM-style blog posts.\n",
      "utf8",
    );

    await runGenerate({}, { client: mockClient() });

    const outputPath = join(tempDir, "output", "blog-post.md");
    assert.ok(existsSync(outputPath));

    const parsed = matter(readFileSync(outputPath, "utf8"));

    assert.equal(parsed.data.title, "Shipping Blogify From Context");
    assert.equal(parsed.data.date, todayIsoDate());
    assert.deepEqual(parsed.data.tags, []);
    assert.equal(
      parsed.data.summary,
      "A Technical PM write-up of the Blogify generate flow.",
    );
    assert.match(parsed.content, /## Situation/);
    assert.match(parsed.content, /## Approach/);
  });

  test("prints a warning and exits cleanly when context/ is empty", async () => {
    mkdirSync(join(tempDir, "context"));

    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => {
      logs.push(args.map(String).join(" "));
    };

    try {
      await runGenerate({}, { client: mockClient() });
    } finally {
      console.log = originalLog;
    }

    assert.ok(!existsSync(join(tempDir, "output", "blog-post.md")));
    assert.match(logs.join("\n"), /context\/ folder is empty/);
  });

  test("throws a clear error when the API key is missing", async () => {
    mkdirSync(join(tempDir, "context"));
    writeFileSync(
      join(tempDir, "context", "overview.md"),
      "# Overview\n\nSource file.\n",
      "utf8",
    );
    delete process.env.ANTHROPIC_API_KEY;

    await assert.rejects(
      () => runGenerate({}),
      /No API key is configured/,
    );
  });

  test("warns about skipped scan errors and continues with valid files", async () => {
    mkdirSync(join(tempDir, "context"));
    writeFileSync(
      join(tempDir, "context", "overview.md"),
      "# Overview\n\nValid source file.\n",
      "utf8",
    );
    writeFileSync(
      join(tempDir, "context", "broken.md"),
      "---\ntitle: [unclosed\n---\n\n# Broken\n",
      "utf8",
    );

    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => {
      logs.push(args.map(String).join(" "));
    };

    try {
      await runGenerate(
        {
          dir: join(tempDir, "context"),
          out: join(tempDir, "output", "blog-post.md"),
        },
        { client: mockClient() },
      );
    } finally {
      console.log = originalLog;
    }

    const output = logs.join("\n");
    assert.match(output, /Skipped .*broken\.md:/);
    assert.ok(existsSync(join(tempDir, "output", "blog-post.md")));
  });

  test("stops generation when every context file fails to parse", async () => {
    mkdirSync(join(tempDir, "context"));
    writeFileSync(
      join(tempDir, "context", "broken.md"),
      "---\ntitle: [unclosed\n---\n\n# Broken\n",
      "utf8",
    );

    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => {
      logs.push(args.map(String).join(" "));
    };

    try {
      await assert.rejects(
        () =>
          runGenerate(
            {
              dir: join(tempDir, "context"),
              out: join(tempDir, "output", "blog-post.md"),
            },
            { client: mockClient() },
          ),
        /No readable Markdown files/,
      );
    } finally {
      console.log = originalLog;
    }

    assert.match(logs.join("\n"), /Skipped .*broken\.md:/);
    assert.doesNotMatch(logs.join("\n"), /folder is empty/);
    assert.ok(!existsSync(join(tempDir, "output", "blog-post.md")));
  });

  test("rejects --out nested under context/ without overwriting source files", async () => {
    mkdirSync(join(tempDir, "context"));
    const sourcePath = join(tempDir, "context", "overview.md");
    const nestedOutput = join(tempDir, "context", "generated.md");
    const sourceContents = "# Overview\n\nMust not be overwritten.\n";
    writeFileSync(sourcePath, sourceContents, "utf8");

    await assert.rejects(
      () =>
        runGenerate(
          { out: "context/generated.md" },
          { client: mockClient() },
        ),
      /inside the context directory/,
    );

    assert.equal(readFileSync(sourcePath, "utf8"), sourceContents);
    assert.ok(!existsSync(nestedOutput));
    assert.ok(!existsSync(join(tempDir, "output", "blog-post.md")));
  });
});

describe("printGenerateFailure", () => {
  test("prints the stack when --verbose is set", () => {
    const error = new Error("generation failed");
    const errors = [];
    const originalError = console.error;
    console.error = (...args) => {
      errors.push(args.map(String).join(" "));
    };

    try {
      printGenerateFailure(error, true);
    } finally {
      console.error = originalError;
    }

    const output = errors.join("\n");
    assert.match(output, /generation failed/);
    assert.match(output, /Error: generation failed/);
  });
});
