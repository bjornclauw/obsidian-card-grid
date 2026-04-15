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
exports.imageCardType = void 0;
const obsidian_1 = require("obsidian");
const codec_1 = require("../../domain/codec");
const imageStyle_1 = require("../shared/imageStyle");
function isRecord(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
}
exports.imageCardType = {
    type: "image",
    displayName: "Image card",
    editor: {
        title: "Edit image card",
        fields: [
            { kind: "text", key: "title", label: "Title" },
            { kind: "markdown", key: "text", label: "Text" },
            { kind: "toggle", key: "imageEnabled", label: "Show image", defaultValue: true },
            { kind: "image-file", key: "image", label: "Image" },
            {
                kind: "select",
                key: "imageFit",
                label: "Image fit",
                options: [
                    { label: "Cover", value: "cover" },
                    { label: "Contain", value: "contain" },
                    { label: "Fill", value: "fill" },
                    { label: "None", value: "none" },
                    { label: "Scale-down", value: "scale-down" }
                ]
            },
            { kind: "number", key: "imageHeight", label: "Image height", min: 0, step: 10 },
            { kind: "text", key: "imagePosition", label: "Image position", placeholder: "e.g. center" },
            { kind: "number", key: "imageRadius", label: "Image radius", min: 0, step: 1 },
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
            return { id: (0, codec_1.createId)("card"), type: "image", title: "Untitled", text: "" };
        }
        const id = typeof raw.id === "string" && raw.id.trim().length > 0
            ? raw.id.trim()
            : (0, codec_1.createId)("card");
        return {
            id,
            type: "image",
            title: typeof raw.title === "string" ? raw.title : "Untitled",
            text: typeof raw.text === "string" ? raw.text : "",
            backgroundColor: typeof raw.backgroundColor === "string" ? raw.backgroundColor : undefined,
            textColor: typeof raw.textColor === "string" ? raw.textColor : undefined,
            image: typeof raw.image === "string" ? raw.image : undefined,
            imageEnabled: typeof raw.imageEnabled === "boolean" ? raw.imageEnabled : undefined,
            imageFit: (typeof raw.imageFit === "string" ? raw.imageFit : undefined),
            imageHeight: typeof raw.imageHeight === "number" ? raw.imageHeight : undefined,
            imagePosition: typeof raw.imagePosition === "string" ? raw.imagePosition : undefined,
            imageRadius: typeof raw.imageRadius === "number" ? raw.imageRadius : undefined
        };
    },
    createView(ctx) {
        const box = document.createElement("div");
        box.className = "card-grid-card";
        const img = box.createEl("img");
        const titleEl = box.createEl("h4");
        const textEl = box.createDiv("card-text");
        function renderMarkdown(el, markdown) {
            return __awaiter(this, void 0, void 0, function* () {
                el.empty();
                yield obsidian_1.MarkdownRenderer.render(ctx.app, markdown || " ", el, ctx.sourcePath, ctx.plugin);
            });
        }
        function resolveImagePath(path) {
            const file = ctx.app.vault.getAbstractFileByPath(path);
            if (file instanceof obsidian_1.TFile) {
                return ctx.app.vault.getResourcePath(file);
            }
            return path;
        }
        return {
            el: box,
            update(card, viewCtx) {
                box.style.border = `2px solid ${card.backgroundColor || "#ccc"}`;
                const enabled = card.imageEnabled !== false;
                if (enabled && card.image) {
                    img.style.display = "";
                    img.src = resolveImagePath(card.image);
                    (0, imageStyle_1.applyImageStyle)(img, card, viewCtx.grid);
                }
                else {
                    img.style.display = "none";
                }
                titleEl.style.color = card.textColor || "#000000";
                void renderMarkdown(titleEl, card.title || "Untitled");
                void renderMarkdown(textEl, card.text || "");
            }
        };
    }
};
