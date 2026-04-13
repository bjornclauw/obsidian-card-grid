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
const obsidian_1 = require("obsidian");
/**
 * IMAGE PICKER
 */
class ImagePickerModal extends obsidian_1.FuzzySuggestModal {
    constructor(app, onSelect) {
        super(app);
        this.onSelect = onSelect;
    }
    getItems() {
        return this.app.vault.getFiles().filter((f) => ["png", "jpg", "jpeg", "webp"].includes(f.extension.toLowerCase()));
    }
    getItemText(item) {
        return item.path;
    }
    onChooseItem(item) {
        this.onSelect(item);
    }
}
/**
 * COLOR PICKER (native browser)
 */
function openColorPicker(initial, onChange) {
    const input = document.createElement("input");
    input.type = "color";
    input.value = initial || "#e91e63";
    input.style.position = "fixed";
    input.style.zIndex = "9999";
    input.style.left = "20px";
    input.style.top = "20px";
    input.oninput = () => onChange(input.value);
    input.onchange = () => input.remove();
    document.body.appendChild(input);
    input.click();
}
class CardGridPlugin extends obsidian_1.Plugin {
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Card Grid PRO loaded");
            this.registerMarkdownCodeBlockProcessor("card-grid", (source, el, ctx) => {
                try {
                    const cleaned = this.clean(source);
                    const data = (0, obsidian_1.parseYaml)(cleaned);
                    if (!data || typeof data !== "object")
                        return;
                    this.render(el, data, source, ctx.sourcePath);
                }
                catch (err) {
                    el.createEl("pre", { text: "YAML Error: " + err });
                }
            });
        });
    }
    /**
     * CLEAN INPUT (copy-paste safe)
     */
    clean(source) {
        return source
            .replace(/\u00A0/g, " ")
            .replace(/\t/g, "  ")
            .replace(/[^\S\r\n]+$/gm, "");
    }
    /**
     * RESOLVE IMAGE PATH
     */
    resolveImage(path) {
        const file = this.app.vault.getAbstractFileByPath(path);
        if (file instanceof obsidian_1.TFile) {
            return this.app.vault.getResourcePath(file);
        }
        return path;
    }
    /**
     * OPEN IMAGE PICKER
     */
    pickImage(callback) {
        new ImagePickerModal(this.app, callback).open();
    }
    /**
     * UPDATE YAML BLOCK SAFELY
     */
    updateFile(sourcePath, updatedData) {
        return __awaiter(this, void 0, void 0, function* () {
            const file = this.app.vault.getAbstractFileByPath(sourcePath);
            if (!(file instanceof obsidian_1.TFile))
                return;
            const raw = yield this.app.vault.read(file);
            const updatedYaml = (0, obsidian_1.stringifyYaml)(updatedData);
            const newContent = raw.replace(/```card-grid[\s\S]*?```/, "```card-grid\n" + updatedYaml + "\n```");
            yield this.app.vault.modify(file, newContent);
        });
    }
    /**
     * RENDER GRID
     */
    render(el, data, rawSource, sourcePath) {
        var _a;
        const container = el.createDiv();
        container.addClass("card-grid-container");
        if (data.columns) {
            container.style.gridTemplateColumns =
                `repeat(${data.columns}, minmax(250px, 1fr))`;
        }
        if (data.gap) {
            container.style.gap = `${data.gap}px`;
        }
        (_a = data.cards) === null || _a === void 0 ? void 0 : _a.forEach((card, index) => {
            const box = container.createDiv();
            box.addClass("card-grid-card");
            box.style.border = `2px solid ${card.color || "#ccc"}`;
            /**
             * IMAGE
             */
            const img = box.createEl("img");
            img.src = card.image ? this.resolveImage(card.image)
                : "https://via.placeholder.com/300x200?text=Add+Image";
            img.style.width = "100%";
            img.style.height = "200px";
            img.style.objectFit = "cover";
            img.style.borderRadius = "6px";
            img.style.cursor = "pointer";
            img.onclick = () => {
                this.pickImage((file) => __awaiter(this, void 0, void 0, function* () {
                    card.image = file.path;
                    img.src = this.app.vault.getResourcePath(file);
                    yield this.updateFile(sourcePath, data);
                }));
            };
            /**
             * TITLE + COLOR PICKER
             */
            const title = box.createEl("h4", {
                text: card.title || "No title"
            });
            title.style.cursor = "pointer";
            title.onclick = () => {
                openColorPicker(card.color || "#e91e63", (color) => __awaiter(this, void 0, void 0, function* () {
                    card.color = color;
                    title.style.backgroundColor = color;
                    yield this.updateFile(sourcePath, data);
                }));
            };
            if (card.color) {
                title.style.backgroundColor = card.color;
            }
            /**
             * TEXT
             */
            if (card.text) {
                box.createEl("p", { text: card.text });
            }
        });
    }
}
exports.default = CardGridPlugin;
