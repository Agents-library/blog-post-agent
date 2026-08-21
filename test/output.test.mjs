import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, test } from "node:test";

import matter from "gray-matter";

import { buildFrontmatter, writeOutput } from "../dist/output/index.js";

function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

describe("buildFrontmatter", () => {
  test("shape matches spec: title, date, tags, summary", () => {
    const yaml = buildFrontmatter({
      title: "Shipping Blogify",
      date: "2026-08-21",
      tags: ["cli", "typescript"],
      summary: "A Technical PM write-up of the Blogify CLI.",
    });

    const parsed = matter(yaml);

    assert.deepEqual(parsed.data, {
      title: "Shipping Blogify",
      date: "2026-08-21",
      tags: ["cli", "typescript"],
      summary: "A Technical PM write-up of the Blogify CLI.",
    });
    assert.equal(parsed.content.trim(), "");
    assert.match(yaml, /^---\r?\n/);
  });

  test("defaults tags to [] and date to today; title falls back when omitted", () => {
    const yaml = buildFrontmatter({});
    const parsed = matter(yaml);

    assert.equal(parsed.data.title, "Project Update");
    assert.equal(parsed.data.date, todayIsoDate());
    assert.deepEqual(parsed.data.tags, []);
    assert.equal(parsed.data.summary, "");
  });

  test("infers title from the first heading and summary from opening lines", () => {
    const content = [
      "# Context-Driven Title",
      "",
      "This opening paragraph is the summary source.",
      "It continues on a second line.",
      "",
      "## Situation",
      "Later body is ignored for the summary.",
    ].join("\n");

    const parsed = matter(buildFrontmatter({ content }));

    assert.equal(parsed.data.title, "Context-Driven Title");
    assert.equal(
      parsed.data.summary,
      "This opening paragraph is the summary source. It continues on a second line.",
    );
  });
});

describe("writeOutput", () => {
  let tempDir;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "blogify-output-test-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  test("writing to a nested path creates directories", () => {
    const outputPath = join(tempDir, "nested", "deeper", "blog-post.md");

    writeOutput("# Hello\n", outputPath);

    assert.ok(existsSync(dirname(outputPath)));
    assert.equal(readFileSync(outputPath, "utf8"), "# Hello\n");
  });

  test("succeeds and overwrites an existing file", () => {
    const outputPath = join(tempDir, "output", "blog-post.md");
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, "old content\n", "utf8");

    writeOutput("new content\n", outputPath);

    assert.equal(readFileSync(outputPath, "utf8"), "new content\n");
  });

  test("never writes outside the resolved outputPath", () => {
    const outputPath = join(tempDir, "output", "blog-post.md");
    const outsidePath = join(tempDir, "outside.md");
    writeFileSync(outsidePath, "sentinel\n", "utf8");

    writeOutput("only here\n", outputPath);

    assert.ok(existsSync(outputPath));
    assert.equal(readFileSync(outputPath, "utf8"), "only here\n");
    assert.equal(readFileSync(outsidePath, "utf8"), "sentinel\n");
    assert.equal(existsSync(join(tempDir, "blog-post.md")), false);
  });

  test("written file is valid Markdown with valid YAML frontmatter", () => {
    const body = [
      "## Situation",
      "The team needed a repeatable way to turn project notes into a post.",
      "",
      "## Approach",
      "Generate frontmatter locally, then write a single Markdown file.",
    ].join("\n");
    const outputPath = join(tempDir, "output", "blog-post.md");
    const fileContents = `${buildFrontmatter({
      title: "Valid Frontmatter Post",
      date: "2026-08-21",
      tags: ["markdown"],
      summary: "Confirms YAML frontmatter round-trips through gray-matter.",
      content: body,
    })}\n${body}\n`;

    writeOutput(fileContents, outputPath);

    const parsed = matter(readFileSync(outputPath, "utf8"));

    assert.equal(parsed.data.title, "Valid Frontmatter Post");
    assert.equal(parsed.data.date, "2026-08-21");
    assert.deepEqual(parsed.data.tags, ["markdown"]);
    assert.equal(
      parsed.data.summary,
      "Confirms YAML frontmatter round-trips through gray-matter.",
    );
    assert.match(parsed.content, /## Situation/);
    assert.match(parsed.content, /## Approach/);
  });
});
