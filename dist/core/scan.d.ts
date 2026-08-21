import type { ParsedFile, ScanResult } from "./types";
export declare function scanContextFiles(contextDir: string): string[];
export declare function readContextFile(filePath: string): ParsedFile;
export declare function scanContext(contextDir: string): ScanResult;
