"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.callAnthropic = callAnthropic;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const DEFAULT_MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 8192;
function getApiKey() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        throw new Error("ANTHROPIC_API_KEY environment variable is not set. Set it before running blogify generate.");
    }
    return apiKey;
}
function createDefaultClient() {
    return new sdk_1.default({ apiKey: getApiKey(), maxRetries: 0 });
}
function extractText(message) {
    if (!message.content || message.content.length === 0) {
        throw new Error("Anthropic API returned a malformed response with no content blocks.");
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
function getErrorTypeName(error) {
    return error.constructor?.name;
}
function isTransientError(error) {
    if (!error || typeof error !== "object") {
        return false;
    }
    const errorType = getErrorTypeName(error);
    if (errorType === "InternalServerError" ||
        errorType === "APIConnectionError" ||
        errorType === "APIConnectionTimeoutError") {
        return true;
    }
    if ("status" in error) {
        const status = error.status;
        return typeof status === "number" && status >= 500 && status < 600;
    }
    return false;
}
function formatAnthropicError(error) {
    if (error instanceof Error) {
        if (error.message.includes("empty text response") ||
            error.message.includes("malformed response")) {
            return error;
        }
        const errorType = getErrorTypeName(error);
        if (errorType === "APIConnectionError" ||
            errorType === "APIConnectionTimeoutError") {
            return new Error("Network error while calling the Anthropic API. Check your internet connection and try again.");
        }
        if (errorType === "InternalServerError" && "status" in error) {
            const status = error.status;
            return new Error(`Anthropic API is temporarily unavailable (${status}). Please try again later.`);
        }
        return new Error(`Anthropic API call failed: ${error.message}`);
    }
    return new Error("Anthropic API call failed with an unknown error.");
}
async function createMessage(client, prompt) {
    const message = await client.messages.create({
        model: DEFAULT_MODEL,
        max_tokens: MAX_TOKENS,
        messages: [{ role: "user", content: prompt }],
    });
    return extractText(message);
}
async function callAnthropic(prompt, client) {
    getApiKey();
    const anthropic = client ?? createDefaultClient();
    try {
        return await createMessage(anthropic, prompt);
    }
    catch (error) {
        if (!isTransientError(error)) {
            throw formatAnthropicError(error);
        }
        try {
            return await createMessage(anthropic, prompt);
        }
        catch (retryError) {
            throw formatAnthropicError(retryError);
        }
    }
}
