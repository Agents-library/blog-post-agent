export interface ParsedFile {
  path: string;
  frontmatter: Record<string, unknown>;
  content: string;
}

export interface ScanError {
  file: string;
  reason: string;
}

export interface ScanResult {
  files: ParsedFile[];
  errors: ScanError[];
}
