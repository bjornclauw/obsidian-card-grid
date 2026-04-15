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
exports.textCardType = void 0;
const obsidian_1 = require("obsidian");
const codec_1 = require("../../domain/codec");
function isRecord(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
}
exports.textCardType = {
    type: "text",
    displayName: "Text card",
    editor: {
        title: "Edit text card",
        fields: [
            { kind: "text", key: "title", label: "Title" },
            { kind: "markdown", key: "text", label: "Text" },
            {
                kind: "color",
                key: "backgroundColor",
                label: "Border color",
                defaultValue: "#cccccc"
            },
            {
                kind: "color",
                key: "textColor",
                label: "Title color",
                defaultValue: "#000000"
            }
        ]
    },
    normalize(raw) {
        if (!isRecord(raw)) {
            return { id: (0, codec_1.createId)("card"), type: "text", title: "Untitled", text: "" };
        }
        const id = typeof raw.id === "string" && raw.id.trim().length > 0
            ? raw.id.trim()
            : (0, codec_1.createId)("card");
        return {
            id,
            type: "text",
            title: typeof raw.title === "string" ? raw.title : "Untitled",
            text: typeof raw.text === "string" ? raw.text : "",
            backgroundColor: typeof raw.backgroundColor === "string" ? raw.backgroundColor : undefined,
            textColor: typeof raw.textColor === "string" ? raw.textColor : undefined
        };
    },
    createView(ctx) {
        const box = document.createElement("div");
        box.className = "card-grid-card";
        const titleEl = box.createEl("h4");
        const textEl = box.createDiv("card-text");
        function renderMarkdown(el, markdown) {
            return __awaiter(this, void 0, void 0, function* () {
                el.empty();
                yield obsidian_1.MarkdownRenderer.render(ctx.app, markdown || " ", el, ctx.sourcePath, ctx.plugin);
            });
        }
        return {
            el: box,
            update(card, viewCtx) {
                box.style.border = `2px solid ${card.backgroundColor || "#ccc"}`;
                titleEl.style.color = card.textColor || "#000000";
                void renderMarkdown(titleEl, card.title || "Untitled");
                // Text body renders as Markdown preview only (editing happens in a modal).
                void renderMarkdown(textEl, card.text || "");
            }
        };
    }
};
