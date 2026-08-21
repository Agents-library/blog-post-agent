"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runInit = runInit;
exports.registerInitCommand = registerInitCommand;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const chalk_1 = __importDefault(require("chalk"));
const defaults_1 = require("../config/defaults");
function ensureDirectory(absolutePath) {
    const created = !(0, node_fs_1.existsSync)(absolutePath);
    (0, node_fs_1.mkdirSync)(absolutePath, { recursive: true });
    return { path: absolutePath, created };
}
function formatDisplayPath(absolutePath, cwd) {
    const displayPath = (0, node_path_1.relative)(cwd, absolutePath) || absolutePath;
    return displayPath.replace(/\\/g, "/");
}
function runInit(cwd, options = {}) {
    const contextDir = options.dir ?? defaults_1.DEFAULT_CONFIG.contextDir;
    const outputPath = options.out ?? defaults_1.DEFAULT_CONFIG.outputPath;
    const outputDir = (0, node_path_1.dirname)(outputPath);
    const contextResult = ensureDirectory((0, node_path_1.resolve)(cwd, contextDir));
    const outputResult = ensureDirectory((0, node_path_1.resolve)(cwd, outputDir));
    console.log(chalk_1.default.cyan("Initializing Blogify project..."));
    console.log();
    for (const result of [contextResult, outputResult]) {
        const displayPath = formatDisplayPath(result.path, cwd);
        if (result.created) {
            console.log(chalk_1.default.green(`✓ Created ${displayPath}`));
        }
        else {
            console.log(chalk_1.default.cyan(`${displayPath} already exists`));
        }
    }
    console.log();
    const anyCreated = contextResult.created || outputResult.created;
    if (anyCreated) {
        console.log(chalk_1.default.green(`Ready — add Markdown files to ${contextDir} and run blogify generate.`));
    }
    else {
        console.log(chalk_1.default.cyan("Nothing to create — folders are already in place."));
    }
}
function registerInitCommand(program) {
    program
        .command("init")
        .description("Scaffold context/ and output/ folders in the current project")
        .option("--dir <path>", "override the context folder location")
        .option("--out <path>", "override the output file path")
        .action((options) => {
        runInit(process.cwd(), options);
    });
}
