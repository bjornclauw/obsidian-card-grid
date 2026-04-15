"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanYamlSource = cleanYamlSource;
exports.parseYamlObject = parseYamlObject;
exports.stringifyYamlObject = stringifyYamlObject;
const obsidian_1 = require("obsidian");
function cleanYamlSource(source) {
    return source
        .replace(/\u00a0/g, " ")
        .replace(/\t/g, "  ")
        .replace(/[^\S\r\n]+$/gm, "");
}
function parseYamlObject(source) {
    const cleaned = cleanYamlSource(source);
    return (0, obsidian_1.parseYaml)(cleaned);
}
function stringifyYamlObject(value) {
    return (0, obsidian_1.stringifyYaml)(value);
}
