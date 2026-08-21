import type { Command } from "commander";
import type { AnthropicClient } from "../generator";
export interface GenerateOptions {
    dir?: string;
    out?: string;
    verbose?: boolean;
}
export interface GenerateDeps {
    client?: AnthropicClient;
}
export declare function printGenerateFailure(error: unknown, verbose?: boolean): void;
export declare function runGenerate(options?: GenerateOptions, deps?: GenerateDeps): Promise<void>;
export declare function registerGenerateCommand(program: Command): void;
