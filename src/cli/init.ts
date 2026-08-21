import type { Command } from "commander";

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Scaffold context/ and output/ folders in the current project")
    .action(() => {
      console.log("not implemented yet");
    });
}
