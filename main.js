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
/* =========================
   IMAGE PICKER
========================= */
class ImagePickerModal extends obsidian_1.FuzzySuggestModal {
    constructor(app, onSelect) {
        super(app);
        this.onSelect = onSelect;
    }
    getItems() {
        return this.app.vault.getFiles().filter((f) => ["png", "jpg", "jpeg", "webp", "gif"].includes(f.extension.toLowerCase()));
    }
    getItemText(item) {
        return item.path;
    }
    onChooseItem(item) {
        this.onSelect(item);
    }
}
/* =========================
   COLOR PICKER
========================= */
function openColorPickerAtCursor(e, initial, onChange) {
    const input = document.createElement("input");
    input.type = "color";
    input.value = initial || "#e91e63";
    input.style.position = "fixed";
    input.style.left = `${e.clientX}px`;
    input.style.top = `${e.clientY}px`;
    input.style.width = "20px";
    input.style.height = "20px";
    input.style.opacity = "0.01";
    input.style.zIndex = "999999";
    document.body.appendChild(input);
    input.oninput = () => onChange(input.value);
    input.onchange = () => input.remove();
    setTimeout(() => {
        input.click();
        input.focus();
    }, 0);
}
/* =========================
   TEXT EDITOR (NEW)
========================= */
function openTextEditorAtCursor(e, initial, onChange) {
    const input = document.createElement("input");
    input.type = "text";
    input.value = initial || "";
    input.style.position = "fixed";
    input.style.left = `${e.clientX}px`;
    input.style.top = `${e.clientY}px`;
    input.style.minWidth = "140px";
    input.style.padding = "6px 8px";
    input.style.fontSize = "14px";
    input.style.border = "1px solid var(--background-modifier-border)";
    input.style.borderRadius = "6px";
    input.style.zIndex = "999999";
    input.style.background = "var(--background-primary)";
    input.style.color = "var(--text-normal)";
    document.body.appendChild(input);
    input.focus();
    input.select();
    const save = () => {
        onChange(input.value);
        input.remove();
    };
    input.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter")
            save();
        if (ev.key === "Escape")
            input.remove();
    });
    input.addEventListener("blur", save);
}
/* =========================
   PLUGIN
========================= */
class CardGridPlugin extends obsidian_1.Plugin {
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Card Grid FULL FIXED loaded");
            this.registerMarkdownCodeBlockProcessor("card-grid", (source, el, ctx) => {
                try {
                    const cleaned = this.clean(source);
                    const data = (0, obsidian_1.parseYaml)(cleaned);
                    if (!data || typeof data !== "object")
                        return;
                    this.render(el, data, ctx.sourcePath);
                }
                catch (err) {
                    el.createEl("pre", { text: "YAML Error: " + err });
                }
            });
        });
    }
    /* =========================
       CLEAN INPUT
    ========================= */
    clean(source) {
        return source
            .replace(/\u00A0/g, " ")
            .replace(/\t/g, "  ")
            .replace(/[^\S\r\n]+$/gm, "");
    }
    /* =========================
       IMAGE RESOLVE
    ========================= */
    resolveImage(path) {
        const file = this.app.vault.getAbstractFileByPath(path);
        if (file instanceof obsidian_1.TFile) {
            return this.app.vault.getResourcePath(file);
        }
        return path;
    }
    /* =========================
       IMAGE PICKER
    ========================= */
    pickImage(callback) {
        new ImagePickerModal(this.app, callback).open();
    }
    /* =========================
       UPDATE FILE
    ========================= */
    updateFile(sourcePath, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const file = this.app.vault.getAbstractFileByPath(sourcePath);
            if (!(file instanceof obsidian_1.TFile))
                return;
            const raw = yield this.app.vault.read(file);
            const yaml = (0, obsidian_1.stringifyYaml)(data);
            const updated = raw.replace(/```card-grid[\s\S]*?```/, "```card-grid\n" + yaml + "\n```");
            yield this.app.vault.modify(file, updated);
        });
    }
    refresh(el, data, sourcePath) {
        this.render(el, data, sourcePath);
    }
    /* =========================
       CONTEXT MENU
    ========================= */
    buildMenu(card, index, data, sourcePath, el, e) {
        const menu = new obsidian_1.Menu();
        menu.addItem((item) => item.setTitle("🎨 Change color").setIcon("palette").onClick(() => {
            openColorPickerAtCursor(e, card.color || "#e91e63", (color) => __awaiter(this, void 0, void 0, function* () {
                card.color = color;
                yield this.updateFile(sourcePath, data);
                this.refresh(el, data, sourcePath);
            }));
        }));
        menu.addItem((item) => item.setTitle("🖼️ Change image").setIcon("image").onClick(() => {
            this.pickImage((file) => __awaiter(this, void 0, void 0, function* () {
                card.image = file.path;
                yield this.updateFile(sourcePath, data);
                this.refresh(el, data, sourcePath);
            }));
        }));
        menu.addItem((item) => item.setTitle("✏️ Edit title").setIcon("heading").onClick(() => {
            openTextEditorAtCursor(e, card.title || "", (value) => __awaiter(this, void 0, void 0, function* () {
                card.title = value;
                yield this.updateFile(sourcePath, data);
                this.refresh(el, data, sourcePath);
            }));
        }));
        menu.addItem((item) => item.setTitle("📝 Edit text").setIcon("document").onClick(() => {
            openTextEditorAtCursor(e, card.text || "", (value) => __awaiter(this, void 0, void 0, function* () {
                card.text = value;
                yield this.updateFile(sourcePath, data);
                this.refresh(el, data, sourcePath);
            }));
        }));
        menu.addSeparator();
        menu.addItem((item) => item.setTitle("➕ Add card").setIcon("plus").onClick(() => __awaiter(this, void 0, void 0, function* () {
            data.cards.splice(index + 1, 0, {
                title: "New card",
                color: "#cccccc",
                text: "",
                image: ""
            });
            yield this.updateFile(sourcePath, data);
            this.refresh(el, data, sourcePath);
        })));
        menu.addItem((item) => item.setTitle("🗑️ Delete card").setIcon("trash").onClick(() => __awaiter(this, void 0, void 0, function* () {
            data.cards.splice(index, 1);
            yield this.updateFile(sourcePath, data);
            this.refresh(el, data, sourcePath);
        })));
        menu.showAtMouseEvent(e);
    }
    /* =========================
       RENDER
    ========================= */
    render(el, data, sourcePath) {
        var _a;
        el.empty();
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
            /* IMAGE */
            const img = box.createEl("img");
            img.src = card.image
                ? this.resolveImage(card.image)
                : "https://via.placeholder.com/300x200?text=Click+to+add";
            img.style.width = "100%";
            img.style.height = "200px";
            img.style.objectFit = "cover";
            img.style.borderRadius = "6px";
            img.style.cursor = "pointer";
            img.onclick = () => {
                this.pickImage((file) => __awaiter(this, void 0, void 0, function* () {
                    card.image = file.path;
                    yield this.updateFile(sourcePath, data);
                    this.refresh(el, data, sourcePath);
                }));
            };
            /* TITLE */
            const title = box.createEl("h4", {
                text: card.title || "No title"
            });
            title.style.cursor = "pointer";
            title.onclick = (e) => {
                openTextEditorAtCursor(e, card.title || "", (value) => __awaiter(this, void 0, void 0, function* () {
                    card.title = value;
                    yield this.updateFile(sourcePath, data);
                    this.refresh(el, data, sourcePath);
                }));
            };
            if (card.color) {
                title.style.backgroundColor = card.color;
            }
            /* TEXT */
            if (card.text) {
                box.createEl("p", { text: card.text });
            }
            /* MENU */
            box.oncontextmenu = (e) => {
                e.preventDefault();
                this.buildMenu(card, index, data, sourcePath, el, e);
            };
        });
    }
}
exports.default = CardGridPlugin;
