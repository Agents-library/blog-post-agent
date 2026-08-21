import type { Command } from "commander";
export interface InitOptions {
    dir?: string;
    out?: string;
}
export declare function runInit(cwd: string, options?: InitOptions): void;
export declare function registerInitCommand(program: Command): void;
