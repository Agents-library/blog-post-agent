"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGenerateCommand = registerGenerateCommand;
function registerGenerateCommand(program) {
    program
        .command("generate")
        .description("Scan context Markdown files and generate a blog post")
        .action(() => {
        console.log("not implemented yet");
    });
}
