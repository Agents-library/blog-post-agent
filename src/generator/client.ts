import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/resources/messages/messages";

const DEFAULT_MODEL = "claude-sonnet-4-6";
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

function getApiKey(): string {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY environment variable is not set. Set it before running blogify generate.",
    );
  }

  return apiKey;
}

function createDefaultClient(): AnthropicClient {
  return new Anthropic({ apiKey: getApiKey(), maxRetries: 0 });
}

function extractText(message: Message): string {
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

function formatAnthropicError(error: unknown): Error {
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
      errorType === "APIConnectionTimeoutError"
    ) {
      return new Error(
        "Network error while calling the Anthropic API. Check your internet connection and try again.",
      );
    }

    if (errorType === "InternalServerError" && "status" in error) {
      const status = (error as { status: number }).status;
      return new Error(
        `Anthropic API is temporarily unavailable (${status}). Please try again later.`,
      );
    }

    return new Error(`Anthropic API call failed: ${error.message}`);
  }

  return new Error("Anthropic API call failed with an unknown error.");
}

async function createMessage(
  client: AnthropicClient,
  prompt: string,
): Promise<string> {
  const message = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{ role: "user", content: prompt }],
  });

  return extractText(message);
}

export async function callAnthropic(
  prompt: string,
  client?: AnthropicClient,
): Promise<string> {
  getApiKey();

  const anthropic = client ?? createDefaultClient();

  try {
    return await createMessage(anthropic, prompt);
  } catch (error) {
    if (!isTransientError(error)) {
      throw formatAnthropicError(error);
    }

    try {
      return await createMessage(anthropic, prompt);
    } catch (retryError) {
      throw formatAnthropicError(retryError);
    }
  }
}
