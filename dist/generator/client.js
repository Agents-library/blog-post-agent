"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.callAnthropic = callAnthropic;
exports.generateCompletion = generateCompletion;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const credentials_1 = require("../config/credentials");
const ANTHROPIC_MODEL = "claude-sonnet-4-6";
const OPENAI_MODEL = "gpt-4o";
const GEMINI_MODEL = "gemini-3.6-flash";
const OPENROUTER_MODEL = "openai/gpt-4o";
const MAX_TOKENS = 8192;
function requireApiKey(provider) {
    const apiKey = (0, credentials_1.readApiKey)(provider);
    if (!apiKey) {
        throw new Error(`${(0, credentials_1.providerEnvVar)(provider)} is not set. Run blogify setup or set it before running blogify generate.`);
    }
    return apiKey;
}
function createDefaultAnthropicClient() {
    return new sdk_1.default({ apiKey: requireApiKey("anthropic"), maxRetries: 0 });
}
function extractAnthropicText(message) {
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
function formatProviderError(provider, error) {
    const label = (0, credentials_1.providerLabel)(provider);
    if (error instanceof Error) {
        if (error.message.includes("empty text response") ||
            error.message.includes("malformed response")) {
            return error;
        }
        const errorType = getErrorTypeName(error);
        if (errorType === "APIConnectionError" ||
            errorType === "APIConnectionTimeoutError" ||
            error.message === "fetch failed") {
            return new Error(`Network error while calling the ${label} API. Check your internet connection and try again.`);
        }
        if (errorType === "InternalServerError" && "status" in error) {
            const status = error.status;
            return new Error(`${label} API is temporarily unavailable (${status}). Please try again later.`);
        }
        return new Error(`${label} API call failed: ${error.message}`);
    }
    return new Error(`${label} API call failed with an unknown error.`);
}
async function withRetry(provider, operation) {
    try {
        return await operation();
    }
    catch (error) {
        if (!isTransientError(error)) {
            throw formatProviderError(provider, error);
        }
        try {
            return await operation();
        }
        catch (retryError) {
            throw formatProviderError(provider, retryError);
        }
    }
}
async function createAnthropicMessage(client, prompt) {
    const message = await client.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: MAX_TOKENS,
        messages: [{ role: "user", content: prompt }],
    });
    return extractAnthropicText(message);
}
async function callAnthropic(prompt, client) {
    requireApiKey("anthropic");
    const anthropic = client ?? createDefaultAnthropicClient();
    return withRetry("anthropic", () => createAnthropicMessage(anthropic, prompt));
}
async function postJson(url, body, headers) {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...headers,
        },
        body: JSON.stringify(body),
    });
    let json;
    try {
        json = await response.json();
    }
    catch {
        json = undefined;
    }
    return { status: response.status, json };
}
function throwIfHttpError(provider, status, json) {
    if (status >= 200 && status < 300) {
        return;
    }
    const error = new Error(`HTTP ${status}`);
    error.status = status;
    if (json !== null && typeof json === "object" && "error" in json) {
        const payload = json;
        if (typeof payload.error === "string") {
            error.message = payload.error;
        }
        else if (payload.error?.message) {
            error.message = payload.error.message;
        }
    }
    throw error;
}
function extractOpenAiText(json) {
    if (json === null || typeof json !== "object") {
        throw new Error("OpenAI API returned a malformed response with no content blocks.");
    }
    const choices = json
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
async function callOpenAiCompatible(provider, prompt) {
    const apiKey = requireApiKey(provider);
    const url = provider === "openrouter"
        ? "https://openrouter.ai/api/v1/chat/completions"
        : "https://api.openai.com/v1/chat/completions";
    const model = provider === "openrouter" ? OPENROUTER_MODEL : OPENAI_MODEL;
    return withRetry(provider, async () => {
        const { status, json } = await postJson(url, {
            model,
            max_tokens: MAX_TOKENS,
            messages: [{ role: "user", content: prompt }],
        }, { Authorization: `Bearer ${apiKey}` });
        throwIfHttpError(provider, status, json);
        try {
            return extractOpenAiText(json);
        }
        catch (error) {
            if (provider === "openrouter" && error instanceof Error) {
                throw new Error(error.message.replaceAll("OpenAI API", "OpenRouter API"));
            }
            throw error;
        }
    });
}
function extractGeminiText(json) {
    if (json === null || typeof json !== "object") {
        throw new Error("Gemini API returned a malformed response with no content blocks.");
    }
    const candidates = json.candidates;
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
async function callGemini(prompt) {
    const apiKey = requireApiKey("gemini");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
    return withRetry("gemini", async () => {
        const { status, json } = await postJson(url, {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: MAX_TOKENS },
        }, {});
        throwIfHttpError("gemini", status, json);
        return extractGeminiText(json);
    });
}
async function generateCompletion(prompt, options = {}) {
    if (options.client) {
        return withRetry("anthropic", () => createAnthropicMessage(options.client, prompt));
    }
    const provider = options.provider ?? (0, credentials_1.resolveProvider)();
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
