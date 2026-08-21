import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export function writeOutput(content: string, resolvedOutputPath: string): void {
  mkdirSync(dirname(resolvedOutputPath), { recursive: true });
  writeFileSync(resolvedOutputPath, content, "utf8");
}
