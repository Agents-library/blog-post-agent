#!/usr/bin/env node

import { Command } from "commander";
import { registerGenerateCommand } from "./generate";
import { registerInitCommand } from "./init";
import { registerSetupCommand } from "./setup";

const program = new Command();

program
  .name("blogify")
  .description(
    "Generate a Technical PM/Consultant-style blog post from project context Markdown files",
  )
  .version("0.1.0");

registerInitCommand(program);
registerGenerateCommand(program);
registerSetupCommand(program);

void program.parseAsync();
