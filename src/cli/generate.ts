import type { Command } from "commander";

export function registerGenerateCommand(program: Command): void {
  program
    .command("generate")
    .description("Scan context Markdown files and generate a blog post")
    .action(() => {
      console.log("not implemented yet");
    });
}
