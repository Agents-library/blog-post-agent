"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerInitCommand = registerInitCommand;
function registerInitCommand(program) {
    program
        .command("init")
        .description("Scaffold context/ and output/ folders in the current project")
        .action(() => {
        console.log("not implemented yet");
    });
}
