"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BLOG_SECTIONS = void 0;
exports.buildPrompt = buildPrompt;
const node_path_1 = require("node:path");
exports.BLOG_SECTIONS = [
    "Situation",
    "Approach",
    "What Was Built",
    "Key Decisions",
    "Impact",
    "Lessons/Next",
];
function formatSourceFile(file) {
    const name = (0, node_path_1.basename)(file.path);
    const frontmatter = Object.keys(file.frontmatter).length > 0
        ? `Frontmatter: ${JSON.stringify(file.frontmatter)}\n`
        : "";
    return `### Source: ${name}\n${frontmatter}${file.content.trim()}`;
}
function buildPrompt(files) {
    const sectionsList = exports.BLOG_SECTIONS.map((section) => `## ${section}`).join("\n");
    const sourceBlock = files.map(formatSourceFile).join("\n\n---\n\n");
    return `You are a Technical PM/Consultant writing a publish-ready blog post about a software project.

Your job is to synthesize the project context files below into one coherent narrative. Write for a technical audience that values clarity, decision rationale, and honest tradeoffs.

STRUCTURE
Use these exact section headings in this order:
${sectionsList}

VOICE AND STYLE
- Write in a Technical PM/Consultant voice: clear, confident, and outcome-oriented
- Frame problems and constraints before solutions
- Explain why decisions were made, not just what was built
- Keep the post readable as a standalone article — no meta-commentary about "the source files"

RULES
- Synthesize across ALL source files into one coherent post — do NOT write a per-file summary
- Never fabricate metrics, percentages, timelines, or other quantitative claims not present in the source files
- If the sources lack quantitative data, describe impact qualitatively instead of inventing numbers
- Output Markdown body content only — no YAML frontmatter

SOURCE FILES
${sourceBlock}`;
}
