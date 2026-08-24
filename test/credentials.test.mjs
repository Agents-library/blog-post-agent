import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, test } from "node:test";

import {
  detectProviderFromKey,
  hasAnyApiKey,
  loadStoredCredentials,
  persistApiKey,
  resolveProvider,
} from "../dist/config/credentials.js";

describe("detectProviderFromKey", () => {
  test("detects each supported key prefix", () => {
    assert.equal(detectProviderFromKey("sk-ant-abc"), "anthropic");
    assert.equal(detectProviderFromKey("sk-proj-abc"), "openai");
    assert.equal(detectProviderFromKey("AIzaSyABC"), "gemini");
    assert.equal(detectProviderFromKey("sk-or-v1-abc"), "openrouter");
    assert.equal(detectProviderFromKey("unknown-key"), undefined);
  });
});

describe("credential persistence", () => {
  let homeDir;
  let originalEnv;

  beforeEach(() => {
    homeDir = mkdtempSync(join(tmpdir(), "blogify-creds-"));
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
    process.env.BLOGIFY_HOME = homeDir;
  });

  afterEach(() => {
    for (const [name, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }

    rmSync(homeDir, { recursive: true, force: true });
  });

  test("persistApiKey writes credentials.json and selects that provider", () => {
    persistApiKey("openai", "sk-test-key", {
      homeDir,
      persistSystem: false,
    });

    const stored = loadStoredCredentials(homeDir);
    assert.equal(stored.provider, "openai");
    assert.equal(stored.keys.openai, "sk-test-key");
    assert.equal(process.env.OPENAI_API_KEY, "sk-test-key");
    assert.equal(process.env.BLOGIFY_PROVIDER, "openai");
    assert.equal(resolveProvider(homeDir), "openai");

    const raw = readFileSync(
      join(homeDir, ".blogify", "credentials.json"),
      "utf8",
    );
    assert.match(raw, /sk-test-key/);
  });

  test("resolveProvider uses the only available key", () => {
    process.env.GEMINI_API_KEY = "AIza-only";
    assert.equal(hasAnyApiKey(homeDir), true);
    assert.equal(resolveProvider(homeDir), "gemini");
  });

  test("resolveProvider prefers BLOGIFY_PROVIDER when that key exists", () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-one";
    process.env.OPENAI_API_KEY = "sk-two";
    process.env.BLOGIFY_PROVIDER = "openai";
    assert.equal(resolveProvider(homeDir), "openai");
  });
});
