import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, test } from "node:test";

import {
  APIConnectionError,
  InternalServerError,
} from "@anthropic-ai/sdk";

import { buildPrompt, BLOG_SECTIONS, callAnthropic, generateCompletion } from "../dist/generator/index.js";

const sampleFiles = [
  {
    path: "/project/context/architecture.md",
    frontmatter: { title: "Architecture" },
    content: "# Architecture\n\nWe chose TypeScript and Commander.js.",
  },
  {
    path: "/project/context/overview.md",
    frontmatter: {},
    content: "# Overview\n\nBlogify generates PM-style blog posts.",
  },
];

describe("buildPrompt", () => {
  test("includes fixed section structure and synthesis rules", () => {
    const prompt = buildPrompt(sampleFiles);

    for (const section of BLOG_SECTIONS) {
      assert.match(prompt, new RegExp(`## ${section}`));
    }

    assert.match(
      prompt,
      /synthesize across ALL source files into one coherent post/i,
    );
    assert.match(prompt, /do NOT write a per-file summary/i);
    assert.match(prompt, /Technical PM\/Consultant voice/i);
    assert.match(
      prompt,
      /Never fabricate metrics, percentages, timelines, or other quantitative claims/i,
    );
  });

  test("embeds parsed file content and frontmatter", () => {
    const prompt = buildPrompt(sampleFiles);

    assert.match(prompt, /### Source: architecture\.md/);
    assert.match(prompt, /"title":"Architecture"/);
    assert.match(prompt, /We chose TypeScript and Commander\.js\./);
    assert.match(prompt, /### Source: overview\.md/);
    assert.match(prompt, /Blogify generates PM-style blog posts\./);
  });
});

describe("callAnthropic", () => {
  let originalApiKey;
  let originalHome;

  beforeEach(() => {
    originalApiKey = process.env.ANTHROPIC_API_KEY;
    originalHome = process.env.BLOGIFY_HOME;
    process.env.ANTHROPIC_API_KEY = "test-api-key";
    process.env.BLOGIFY_HOME = join(tmpdir(), "blogify-no-creds");
  });

  afterEach(() => {
    if (originalApiKey === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = originalApiKey;
    }

    if (originalHome === undefined) {
      delete process.env.BLOGIFY_HOME;
    } else {
      process.env.BLOGIFY_HOME = originalHome;
    }
  });

  test("throws a clear error when the API key is missing", async () => {
    delete process.env.ANTHROPIC_API_KEY;

    await assert.rejects(
      () => callAnthropic("prompt"),
      /ANTHROPIC_API_KEY is not set/,
    );
  });

  test("returns text from a successful API response", async () => {
    const client = {
      messages: {
        create: async () => ({
          content: [{ type: "text", text: "# Generated post\n\nBody text." }],
        }),
      },
    };

    const result = await callAnthropic("prompt", client);

    assert.equal(result, "# Generated post\n\nBody text.");
  });

  test("throws a clear error for an empty text response", async () => {
    const client = {
      messages: {
        create: async () => ({
          content: [{ type: "text", text: "   " }],
        }),
      },
    };

    await assert.rejects(
      () => callAnthropic("prompt", client),
      /empty text response/,
    );
  });

  test("throws a clear error for a malformed response", async () => {
    const client = {
      messages: {
        create: async () => ({
          content: [],
        }),
      },
    };

    await assert.rejects(
      () => callAnthropic("prompt", client),
      /malformed response/,
    );
  });

  test("throws a clear error for network failures", async () => {
    const client = {
      messages: {
        create: async () => {
          throw new APIConnectionError({ message: "connection failed" });
        },
      },
    };

    await assert.rejects(
      () => callAnthropic("prompt", client),
      /Network error while calling the Anthropic API/,
    );
  });

  test("retries once on transient 5xx errors", async () => {
    let attempts = 0;
    const client = {
      messages: {
        create: async () => {
          attempts += 1;

          if (attempts === 1) {
            throw new InternalServerError(500, undefined, "server error", undefined);
          }

          return {
            content: [{ type: "text", text: "Recovered after retry." }],
          };
        },
      },
    };

    const result = await callAnthropic("prompt", client);

    assert.equal(result, "Recovered after retry.");
    assert.equal(attempts, 2);
  });

  test("does not retry non-transient API errors", async () => {
    let attempts = 0;
    const client = {
      messages: {
        create: async () => {
          attempts += 1;
          throw new Error("invalid request");
        },
      },
    };

    await assert.rejects(
      () => callAnthropic("prompt", client),
      /Anthropic API call failed: invalid request/,
    );
    assert.equal(attempts, 1);
  });
});

describe("generateCompletion", () => {
  let originalEnv;
  let originalFetch;

  beforeEach(() => {
    originalEnv = {
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
      BLOGIFY_PROVIDER: process.env.BLOGIFY_PROVIDER,
      BLOGIFY_HOME: process.env.BLOGIFY_HOME,
    };
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.BLOGIFY_PROVIDER;
    process.env.BLOGIFY_HOME = join(tmpdir(), "blogify-no-creds");
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;

    for (const [name, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  });

  test("calls OpenAI when that provider is selected", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.BLOGIFY_PROVIDER = "openai";

    globalThis.fetch = async () => ({
      status: 200,
      json: async () => ({
        choices: [{ message: { content: "OpenAI post body" } }],
      }),
    });

    const result = await generateCompletion("prompt");
    assert.equal(result, "OpenAI post body");
  });

  test("calls Gemini when that provider is selected", async () => {
    process.env.GEMINI_API_KEY = "AIza-test";
    process.env.BLOGIFY_PROVIDER = "gemini";

    globalThis.fetch = async () => ({
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: "Gemini post body" }] } }],
      }),
    });

    const result = await generateCompletion("prompt");
    assert.equal(result, "Gemini post body");
  });
});
