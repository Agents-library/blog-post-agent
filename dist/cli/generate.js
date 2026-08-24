"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.printGenerateFailure = printGenerateFailure;
exports.runGenerate = runGenerate;
exports.registerGenerateCommand = registerGenerateCommand;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const config_1 = require("../config");
const credentials_1 = require("../config/credentials");
const core_1 = require("../core");
const generator_1 = require("../generator");
const output_1 = require("../output");
const setup_1 = require("./setup");
function formatDisplayPath(absolutePath, cwd) {
    const displayPath = (0, node_path_1.relative)(cwd, absolutePath) || absolutePath;
    return displayPath.replace(/\\/g, "/");
}
function isInsideOrEqual(candidate, root) {
    const relativeToRoot = (0, node_path_1.relative)(root, candidate);
    return (relativeToRoot === "" ||
        (!relativeToRoot.startsWith(`..${node_path_1.sep}`) &&
            relativeToRoot !== ".." &&
            !(0, node_path_1.isAbsolute)(relativeToRoot)));
}
function errorMessage(error) {
    return error instanceof Error ? error.message : "Unknown error";
}
function printGenerateFailure(error, verbose) {
    console.error(chalk_1.default.red(`✗ ${errorMessage(error)}`));
    if (verbose === true && error instanceof Error && error.stack !== undefined) {
        console.error(error.stack);
    }
}
async function runGenerate(options = {}, deps = {}) {
    const cwd = process.cwd();
    const cliOverrides = {};
    if (options.dir !== undefined) {
        cliOverrides.contextDir = options.dir;
    }
    if (options.out !== undefined) {
        cliOverrides.outputPath = options.out;
    }
    const config = (0, config_1.loadConfig)(cliOverrides);
    const contextDir = (0, node_path_1.resolve)(cwd, config.contextDir);
    const outputPath = (0, node_path_1.resolve)(cwd, config.outputPath);
    const outputDisplay = formatDisplayPath(outputPath, cwd);
    if (isInsideOrEqual(outputPath, contextDir)) {
        throw new Error(`Output path ${outputDisplay} is inside the context directory. Choose a path outside ${config.contextDir}.`);
    }
    console.log(chalk_1.default.cyan("Generating blog post..."));
    console.log();
    const scanSpinner = (0, ora_1.default)(`Scanning ${config.contextDir}`).start();
    let fileCount;
    let prompt;
    try {
        const result = (0, core_1.scanContext)(contextDir);
        fileCount = result.files.length;
        if (fileCount === 0 && result.errors.length === 0) {
            scanSpinner.stop();
            console.log(chalk_1.default.yellow(`${config.contextDir} folder is empty`));
            return;
        }
        if (result.errors.length > 0) {
            scanSpinner.stop();
            for (const scanError of result.errors) {
                const fileDisplay = formatDisplayPath(scanError.file, cwd);
                console.log(chalk_1.default.yellow(`Skipped ${fileDisplay}: ${scanError.reason}`));
            }
        }
        if (fileCount === 0) {
            throw new Error(`No readable Markdown files in ${config.contextDir}. Fix the skipped files and try again.`);
        }
        prompt = (0, generator_1.buildPrompt)(result.files);
        if (result.errors.length === 0) {
            scanSpinner.succeed(`Scanned ${fileCount} Markdown file${fileCount === 1 ? "" : "s"}`);
        }
        else {
            console.log(chalk_1.default.green(`✓ Scanned ${fileCount} Markdown file${fileCount === 1 ? "" : "s"}`));
        }
    }
    catch (error) {
        if (scanSpinner.isSpinning) {
            scanSpinner.fail(`Failed to scan ${config.contextDir}`);
        }
        throw error;
    }
    const provider = deps.client === undefined ? await (0, setup_1.ensureApiSetup)() : undefined;
    const providerName = provider ? (0, credentials_1.providerLabel)(provider) : "Anthropic";
    const apiSpinner = (0, ora_1.default)(`Calling ${providerName} API...`).start();
    let body;
    try {
        body = await (0, generator_1.generateCompletion)(prompt, {
            client: deps.client,
            provider,
        });
        apiSpinner.succeed("Generated blog post content");
    }
    catch (error) {
        apiSpinner.fail(`${providerName} API call failed`);
        throw error;
    }
    if ((0, node_fs_1.existsSync)(outputPath)) {
        console.log(chalk_1.default.cyan(`Overwriting existing file ${outputDisplay}`));
    }
    const frontmatter = (0, output_1.buildFrontmatter)({ content: body });
    (0, output_1.writeOutput)(`${frontmatter}\n${body.trim()}\n`, outputPath);
    console.log();
    console.log(chalk_1.default.green(`✓ Blog post written to ${outputDisplay}`));
}
function registerGenerateCommand(program) {
    program
        .command("generate")
        .description("Scan context Markdown files and generate a blog post")
        .option("--dir <path>", "override the context folder location")
        .option("--out <path>", "override the output file path")
        .option("--verbose", "show full error stack traces on failure")
        .action(async (options) => {
        try {
            await runGenerate(options);
        }
        catch (error) {
            printGenerateFailure(error, options.verbose);
            process.exit(1);
        }
    });
}
