export interface Config {
  contextDir: string;
  outputPath: string;
}

export type ConfigOverrides = Partial<Config>;

export interface BlogifyConfigFile {
  contextDir?: string;
  outputPath?: string;
}
