import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/resources/messages/messages";

import {
  providerEnvVar,
  providerLabel,
  readApiKey,
  resolveProvider,
} from "../config/credentials";
import type { ProviderId } from "../config/credentials";

const ANTHROPIC_MODEL = "claude-sonnet-4-6";
const OPENAI_MODEL = "gpt-4o";
const GEMINI_MODEL = "gemini-3.6-flash";
const OPENROUTER_MODEL = "openai/gpt-4o";
const MAX_TOKENS = 8192;

export interface AnthropicClient {
  messages: {
    create(params: {
      model: string;
      max_tokens: number;
      messages: Array<{ role: "user"; content: string }>;
    }): Promise<Message>;
  };
}

function requireApiKey(provider: ProviderId): string {
  const apiKey = readApiKey(provider);

  if (!apiKey) {
    throw new Error(
      `${providerEnvVar(provider)} is not set. Run blogify setup or set it before running blogify generate.`,
    );
  }

  return apiKey;
}

function createDefaultAnthropicClient(): AnthropicClient {
  return new Anthropic({ apiKey: requireApiKey("anthropic"), maxRetries: 0 });
}

function extractAnthropicText(message: Message): string {
  if (!message.content || message.content.length === 0) {
    throw new Error(
      "Anthropic API returned a malformed response with no content blocks.",
    );
  }

  const text = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Anthropic API returned an empty text response.");
  }

  return text;
}

function getErrorTypeName(error: object): string | undefined {
  return error.constructor?.name;
}

function isTransientError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const errorType = getErrorTypeName(error);
  if (
    errorType === "InternalServerError" ||
    errorType === "APIConnectionError" ||
    errorType === "APIConnectionTimeoutError"
  ) {
    return true;
  }

  if ("status" in error) {
    const status = (error as { status: number }).status;
    return typeof status === "number" && status >= 500 && status < 600;
  }

  return false;
}

function formatProviderError(provider: ProviderId, error: unknown): Error {
  const label = providerLabel(provider);

  if (error instanceof Error) {
    if (
      error.message.includes("empty text response") ||
      error.message.includes("malformed response")
    ) {
      return error;
    }

    const errorType = getErrorTypeName(error);
    if (
      errorType === "APIConnectionError" ||
      errorType === "APIConnectionTimeoutError" ||
      error.message === "fetch failed"
    ) {
      return new Error(
        `Network error while calling the ${label} API. Check your internet connection and try again.`,
      );
    }

    if (errorType === "InternalServerError" && "status" in error) {
      const status = (error as { status: number }).status;
      return new Error(
        `${label} API is temporarily unavailable (${status}). Please try again later.`,
      );
    }

    return new Error(`${label} API call failed: ${error.message}`);
  }

  return new Error(`${label} API call failed with an unknown error.`);
}

async function withRetry<T>(
  provider: ProviderId,
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!isTransientError(error)) {
      throw formatProviderError(provider, error);
    }

    try {
      return await operation();
    } catch (retryError) {
      throw formatProviderError(provider, retryError);
    }
  }
}

async function createAnthropicMessage(
  client: AnthropicClient,
  prompt: string,
): Promise<string> {
  const message = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{ role: "user", content: prompt }],
  });

  return extractAnthropicText(message);
}

export async function callAnthropic(
  prompt: string,
  client?: AnthropicClient,
): Promise<string> {
  requireApiKey("anthropic");
  const anthropic = client ?? createDefaultAnthropicClient();
  return withRetry("anthropic", () => createAnthropicMessage(anthropic, prompt));
}

async function postJson(
  url: string,
  body: unknown,
  headers: Record<string, string>,
): Promise<{ status: number; json: unknown }> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    json = undefined;
  }

  return { status: response.status, json };
}

function throwIfHttpError(provider: ProviderId, status: number, json: unknown): void {
  if (status >= 200 && status < 300) {
    return;
  }

  const error = new Error(`HTTP ${status}`) as Error & { status: number };
  error.status = status;

  if (json !== null && typeof json === "object" && "error" in json) {
    const payload = json as { error?: { message?: string } | string };
    if (typeof payload.error === "string") {
      error.message = payload.error;
    } else if (payload.error?.message) {
      error.message = payload.error.message;
    }
  }

  throw error;
}

function extractOpenAiText(json: unknown): string {
  if (json === null || typeof json !== "object") {
    throw new Error("OpenAI API returned a malformed response with no content blocks.");
  }

  const choices = (json as { choices?: Array<{ message?: { content?: string } }> })
    .choices;
  const text = choices?.[0]?.message?.content?.trim();

  if (!choices || choices.length === 0) {
    throw new Error("OpenAI API returned a malformed response with no content blocks.");
  }
  if (!text) {
    throw new Error("OpenAI API returned an empty text response.");
  }

  return text;
}

async function callOpenAiCompatible(
  provider: "openai" | "openrouter",
  prompt: string,
): Promise<string> {
  const apiKey = requireApiKey(provider);
  const url =
    provider === "openrouter"
      ? "https://openrouter.ai/api/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions";
  const model = provider === "openrouter" ? OPENROUTER_MODEL : OPENAI_MODEL;

  return withRetry(provider, async () => {
    const { status, json } = await postJson(
      url,
      {
        model,
        max_tokens: MAX_TOKENS,
        messages: [{ role: "user", content: prompt }],
      },
      { Authorization: `Bearer ${apiKey}` },
    );
    throwIfHttpError(provider, status, json);
    try {
      return extractOpenAiText(json);
    } catch (error) {
      if (provider === "openrouter" && error instanceof Error) {
        throw new Error(error.message.replaceAll("OpenAI API", "OpenRouter API"));
      }
      throw error;
    }
  });
}

function extractGeminiText(json: unknown): string {
  if (json === null || typeof json !== "object") {
    throw new Error("Gemini API returned a malformed response with no content blocks.");
  }

  const candidates = (
    json as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    }
  ).candidates;

  if (!candidates || candidates.length === 0) {
    throw new Error("Gemini API returned a malformed response with no content blocks.");
  }

  const text = candidates[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Gemini API returned an empty text response.");
  }

  return text;
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = requireApiKey("gemini");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

  return withRetry("gemini", async () => {
    const { status, json } = await postJson(
      url,
      {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: MAX_TOKENS },
      },
      {},
    );
    throwIfHttpError("gemini", status, json);
    return extractGeminiText(json);
  });
}

export async function generateCompletion(
  prompt: string,
  options: { client?: AnthropicClient; provider?: ProviderId } = {},
): Promise<string> {
  if (options.client) {
    return withRetry("anthropic", () =>
      createAnthropicMessage(options.client as AnthropicClient, prompt),
    );
  }

  const provider = options.provider ?? resolveProvider();

  switch (provider) {
    case "anthropic":
      return callAnthropic(prompt);
    case "openai":
      return callOpenAiCompatible("openai", prompt);
    case "openrouter":
      return callOpenAiCompatible("openrouter", prompt);
    case "gemini":
      return callGemini(prompt);
  }
}
