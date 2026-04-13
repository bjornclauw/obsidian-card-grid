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
    input.style.opacity = "0";
    input.style.zIndex = "999999";
    document.body.appendChild(input);
    input.oninput = () => onChange(input.value);
    input.onchange = () => input.remove();
    setTimeout(() => input.click(), 0);
}
/* =========================
   INLINE TEXT EDITOR
========================= */
function makeEditable(el, initial, onSave) {
    el.contentEditable = "true";
    el.spellcheck = false;
    el.textContent = initial;
    el.addEventListener("blur", () => {
        onSave(el.textContent || "");
    });
}
/* =========================
   PLUGIN
========================= */
class CardGridPlugin extends obsidian_1.Plugin {
    constructor() {
        super(...arguments);
        this.cardEls = new Map();
        this.dragFrom = null;
        this.saveTimeout = null;
    }
    onload() {
        this.registerMarkdownCodeBlockProcessor("card-grid", (source, el, ctx) => {
            try {
                const data = (0, obsidian_1.parseYaml)(this.clean(source));
                if (!data || typeof data !== "object")
                    return;
                this.render(el, data, ctx.sourcePath);
            }
            catch (e) {
                el.createEl("pre", { text: String(e) });
            }
        });
    }
    /* =========================
       CLEAN
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
    pickImage(cb) {
        new ImagePickerModal(this.app, cb).open();
    }
    /* =========================
       SAVE (DEBOUNCED)
    ========================= */
    debouncedSave(sourcePath, data) {
        if (this.saveTimeout)
            window.clearTimeout(this.saveTimeout);
        this.saveTimeout = window.setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            const file = this.app.vault.getAbstractFileByPath(sourcePath);
            if (!(file instanceof obsidian_1.TFile))
                return;
            const raw = yield this.app.vault.read(file);
            const yaml = (0, obsidian_1.stringifyYaml)(data);
            const updated = raw.replace(/```card-grid[\s\S]*?```/, "```card-grid\n" + yaml + "\n```");
            yield this.app.vault.modify(file, updated);
        }), 400);
    }
    /* =========================
       RENDER
    ========================= */
    render(el, data, sourcePath) {
        el.empty();
        this.cardEls.clear();
        const container = el.createDiv("card-grid-container");
        const cards = Array.isArray(data.cards) ? data.cards : [];
        container.style.display = "grid";
        container.style.gridTemplateColumns =
            `repeat(${data.columns || 3}, minmax(200px, 1fr))`;
        container.style.gap = `${data.gap || 10}px`;
        cards.forEach((card, index) => {
            const box = this.createCard(card, index, data, sourcePath);
            container.appendChild(box);
            this.cardEls.set(String(index), box);
        });
    }
    /* =========================
       CARD CREATION
    ========================= */
    createCard(card, index, data, sourcePath) {
        const box = document.createElement("div");
        box.className = "card-grid-card";
        box.style.border = `2px solid ${card.color || "#ccc"}`;
        box.draggable = true;
        /* ================= IMAGE (optional) ================= */
        if (card.image && card.image.trim() !== "") {
            const img = box.createEl("img");
            img.src = this.resolveImage(card.image);
            img.style.width = "100%";
            img.style.height = "180px";
            img.style.objectFit = "cover";
            img.onclick = () => {
                this.pickImage((file) => {
                    card.image = file.path;
                    this.debouncedSave(sourcePath, data);
                    this.updateCard(box, card);
                });
            };
        }
        /* ================= TITLE ================= */
        const title = box.createEl("h4");
        makeEditable(title, card.title || "Untitled", (val) => {
            card.title = val;
            this.debouncedSave(sourcePath, data);
        });
        title.style.background = card.color || "";
        /* ================= TEXT ================= */
        const text = box.createEl("p");
        makeEditable(text, card.text || "", (val) => {
            card.text = val;
            this.debouncedSave(sourcePath, data);
        });
        /* ================= IMAGE ADD (if missing) ================= */
        if (!card.image) {
            const addImg = box.createDiv();
            addImg.textContent = "+ add image";
            addImg.style.cursor = "pointer";
            addImg.style.opacity = "0.6";
            addImg.onclick = () => {
                this.pickImage((file) => {
                    card.image = file.path;
                    this.debouncedSave(sourcePath, data);
                    this.render(box.parentElement, data, sourcePath);
                });
            };
        }
        /* ================= DRAG ================= */
        box.addEventListener("dragstart", () => {
            this.dragFrom = index;
            box.classList.add("dragging");
        });
        box.addEventListener("dragend", () => {
            box.classList.remove("dragging");
        });
        box.addEventListener("dragover", (e) => e.preventDefault());
        box.addEventListener("drop", (e) => {
            e.preventDefault();
            const from = this.dragFrom;
            const to = index;
            if (from === null || from === to)
                return;
            const cards = data.cards;
            const moved = cards.splice(from, 1)[0];
            cards.splice(to, 0, moved);
            this.debouncedSave(sourcePath, data);
            this.render(box.parentElement, data, sourcePath);
        });
        /* ================= CONTEXT MENU ================= */
        box.oncontextmenu = (e) => {
            e.preventDefault();
            const menu = new obsidian_1.Menu();
            menu.addItem((i) => i.setTitle("Delete").onClick(() => {
                data.cards.splice(index, 1);
                this.debouncedSave(sourcePath, data);
                this.render(box.parentElement, data, sourcePath);
            }));
            menu.addItem((i) => i.setTitle("Change color").onClick(() => {
                openColorPickerAtCursor(e, card.color || "#ccc", (c) => {
                    card.color = c;
                    this.debouncedSave(sourcePath, data);
                    this.render(box.parentElement, data, sourcePath);
                });
            }));
            menu.showAtMouseEvent(e);
        };
        return box;
    }
    /* =========================
       UPDATE SINGLE CARD (future use)
    ========================= */
    updateCard(el, card) {
        const img = el.querySelector("img");
        if (img && card.image) {
            img.src = this.resolveImage(card.image);
        }
    }
}
exports.default = CardGridPlugin;
