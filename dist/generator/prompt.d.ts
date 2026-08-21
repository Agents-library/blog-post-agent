import type { ParsedFile } from "../core/types";
export declare const BLOG_SECTIONS: readonly ["Situation", "Approach", "What Was Built", "Key Decisions", "Impact", "Lessons/Next"];
export declare function buildPrompt(files: ParsedFile[]): string;
