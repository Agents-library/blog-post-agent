#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const generate_1 = require("./generate");
const init_1 = require("./init");
const program = new commander_1.Command();
program
    .name("blogify")
    .description("Generate a Technical PM/Consultant-style blog post from project context Markdown files")
    .version("0.1.0");
(0, init_1.registerInitCommand)(program);
(0, generate_1.registerGenerateCommand)(program);
program.parse();
