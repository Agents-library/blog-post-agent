import type { Message } from "@anthropic-ai/sdk/resources/messages/messages";
export interface AnthropicClient {
    messages: {
        create(params: {
            model: string;
            max_tokens: number;
            messages: Array<{
                role: "user";
                content: string;
            }>;
        }): Promise<Message>;
    };
}
export declare function callAnthropic(prompt: string, client?: AnthropicClient): Promise<string>;
