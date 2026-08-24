import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, test } from "node:test";

import { runSetup } from "../dist/cli/setup.js";
import { loadStoredCredentials } from "../dist/config/credentials.js";

describe("runSetup", () => {
  let homeDir;
  let originalEnv;

  beforeEach(() => {
    homeDir = mkdtempSync(join(tmpdir(), "blogify-setup-"));
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

  test("auto-detects the provider when the user pastes an API key", async () => {
    const provider = await runSetup({
      homeDir,
      persistSystem: false,
      question: async () => "sk-or-v1-test-key",
    });

    assert.equal(provider, "openrouter");
    assert.equal(loadStoredCredentials(homeDir).provider, "openrouter");
    assert.equal(process.env.OPENROUTER_API_KEY, "sk-or-v1-test-key");
  });

  test("asks for a key after a numeric provider choice", async () => {
    const answers = ["2", "sk-openai-manual"];
    const provider = await runSetup({
      homeDir,
      persistSystem: false,
      question: async () => answers.shift(),
    });

    assert.equal(provider, "openai");
    assert.equal(loadStoredCredentials(homeDir).keys.openai, "sk-openai-manual");
  });

  test("switches provider when the entered key belongs to a different vendor", async () => {
    const answers = ["1", "AIzaSySWITCH"];
    const provider = await runSetup({
      homeDir,
      persistSystem: false,
      question: async () => answers.shift(),
    });

    assert.equal(provider, "gemini");
    assert.equal(process.env.GEMINI_API_KEY, "AIzaSySWITCH");
  });
});
