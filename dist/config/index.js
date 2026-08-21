"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = void 0;
exports.validateConfigFile = validateConfigFile;
exports.loadConfig = loadConfig;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const defaults_1 = require("./defaults");
const CONFIG_FILENAME = "blogify.config.json";
const ALLOWED_CONFIG_KEYS = new Set(["contextDir", "outputPath"]);
function isNonEmptyString(value) {
    return typeof value === "string" && value.length > 0;
}
function validateConfigFile(data) {
    if (data === null || typeof data !== "object" || Array.isArray(data)) {
        throw new Error(`${CONFIG_FILENAME} must be a JSON object with optional "contextDir" and "outputPath" fields.`);
    }
    const record = data;
    const validated = {};
    for (const key of Object.keys(record)) {
        if (!ALLOWED_CONFIG_KEYS.has(key)) {
            throw new Error(`${CONFIG_FILENAME} contains unknown field "${key}". Allowed fields: contextDir, outputPath.`);
        }
    }
    if ("contextDir" in record) {
        if (!isNonEmptyString(record.contextDir)) {
            throw new Error(`${CONFIG_FILENAME} field "contextDir" must be a non-empty string.`);
        }
        validated.contextDir = record.contextDir;
    }
    if ("outputPath" in record) {
        if (!isNonEmptyString(record.outputPath)) {
            throw new Error(`${CONFIG_FILENAME} field "outputPath" must be a non-empty string.`);
        }
        validated.outputPath = record.outputPath;
    }
    return validated;
}
function readConfigFile(cwd) {
    const configPath = (0, node_path_1.join)(cwd, CONFIG_FILENAME);
    if (!(0, node_fs_1.existsSync)(configPath)) {
        return {};
    }
    let raw;
    try {
        raw = JSON.parse((0, node_fs_1.readFileSync)(configPath, "utf8"));
    }
    catch {
        throw new Error(`${CONFIG_FILENAME} is not valid JSON. Check the file for syntax errors.`);
    }
    return validateConfigFile(raw);
}
function loadConfig(cliOverrides = {}) {
    const fileConfig = readConfigFile(process.cwd());
    return {
        ...defaults_1.DEFAULT_CONFIG,
        ...fileConfig,
        ...cliOverrides,
    };
}
var defaults_2 = require("./defaults");
Object.defineProperty(exports, "DEFAULT_CONFIG", { enumerable: true, get: function () { return defaults_2.DEFAULT_CONFIG; } });
