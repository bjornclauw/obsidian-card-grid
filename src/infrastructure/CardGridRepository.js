"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardGridRepository = void 0;
const obsidian_1 = require("obsidian");
const yaml_1 = require("./yaml");
const codec_1 = require("../domain/codec");
function isFenceStart(line) {
    return line.trimEnd() === "```card-grid";
}
function isFenceEnd(line) {
    return line.trimEnd() === "```";
}
function findCardGridBlocks(lines) {
    const blocks = [];
    for (let i = 0; i < lines.length; i++) {
        if (!isFenceStart(lines[i]))
            continue;
        let j = i + 1;
        while (j < lines.length && !isFenceEnd(lines[j]))
            j++;
        if (j >= lines.length)
            break;
        const rawYaml = lines.slice(i + 1, j).join("\n");
        let parsedId;
        try {
            const parsed = (0, yaml_1.parseYamlObject)((0, yaml_1.cleanYamlSource)(rawYaml));
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                const id = parsed.id;
                if (typeof id === "string")
                    parsedId = id;
            }
        }
        catch (_a) {
            // Ignore parse errors and fall back to line-based replacement.
        }
        blocks.push({ lineStart: i, lineEnd: j, rawYaml, parsedId });
        i = j;
    }
    return blocks;
}
class CardGridRepository {
    constructor(app) {
        this.app = app;
    }
    save(ref, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const file = this.app.vault.getAbstractFileByPath(ref.sourcePath);
            if (!(file instanceof obsidian_1.TFile))
                return;
            const raw = yield this.app.vault.read(file);
            const lines = raw.split("\n");
            const yamlObj = (0, codec_1.serializeCardGridData)(data);
            const yaml = (0, yaml_1.stringifyYamlObject)(yamlObj).trimEnd();
            const newBlock = ["```card-grid", yaml, "```"].join("\n");
            const blocks = findCardGridBlocks(lines);
            const byId = blocks.find((b) => b.parsedId === data.id);
            const target = byId !== null && byId !== void 0 ? byId : this.resolveByRef(lines, ref, blocks);
            if (!target)
                return;
            const newLines = [
                ...lines.slice(0, target.lineStart),
                newBlock,
                ...lines.slice(target.lineEnd + 1)
            ];
            yield this.app.vault.modify(file, newLines.join("\n"));
        });
    }
    resolveByRef(lines, ref, blocks) {
        const { lineStart, lineEnd } = ref;
        if (lineStart !== undefined &&
            lineEnd !== undefined &&
            lineStart >= 0 &&
            lineEnd >= lineStart &&
            lineEnd < lines.length &&
            isFenceStart(lines[lineStart]) &&
            isFenceEnd(lines[lineEnd])) {
            return { lineStart, lineEnd, rawYaml: lines.slice(lineStart + 1, lineEnd).join("\n") };
        }
        // If only one block exists, update it to keep behavior predictable.
        if (blocks.length === 1)
            return blocks[0];
        return null;
    }
}
exports.CardGridRepository = CardGridRepository;
