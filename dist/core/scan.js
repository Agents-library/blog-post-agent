"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanContextFiles = scanContextFiles;
exports.readContextFile = readContextFile;
exports.scanContext = scanContext;
const node_fs_1 = require("node:fs");
const node_module_1 = require("node:module");
const node_path_1 = require("node:path");
const gray_matter_1 = __importDefault(require("gray-matter"));
const loadYaml = (0, node_module_1.createRequire)(__filename);
const yaml = loadYaml("js-yaml");
function parseFrontmatterYaml(input) {
    const parsed = yaml.load(input);
    if (parsed === undefined || parsed === null) {
        return {};
    }
    if (typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Frontmatter must be a YAML object.");
    }
    return parsed;
}
function scanContextFiles(contextDir) {
    const resolvedDir = (0, node_path_1.resolve)(contextDir);
    if (!(0, node_fs_1.existsSync)(resolvedDir)) {
        throw new Error(`Context directory not found: ${resolvedDir}`);
    }
    if (!(0, node_fs_1.statSync)(resolvedDir).isDirectory()) {
        throw new Error(`Context path is not a directory: ${resolvedDir}`);
    }
    return (0, node_fs_1.readdirSync)(resolvedDir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
        .map((entry) => (0, node_path_1.resolve)(resolvedDir, entry.name));
}
function readContextFile(filePath) {
    const resolvedPath = (0, node_path_1.resolve)(filePath);
    const raw = (0, node_fs_1.readFileSync)(resolvedPath, "utf8");
    const { data, content } = (0, gray_matter_1.default)(raw, {
        engines: {
            yaml: parseFrontmatterYaml,
        },
    });
    const frontmatter = typeof data === "object" && data !== null && !Array.isArray(data)
        ? data
        : {};
    return {
        path: resolvedPath,
        frontmatter,
        content,
    };
}
function scanContext(contextDir) {
    const filePaths = scanContextFiles(contextDir);
    const files = [];
    const errors = [];
    for (const filePath of filePaths) {
        try {
            files.push(readContextFile(filePath));
        }
        catch (error) {
            const reason = error instanceof Error ? error.message : "Unknown error reading file";
            errors.push({ file: filePath, reason });
        }
    }
    return { files, errors };
}
