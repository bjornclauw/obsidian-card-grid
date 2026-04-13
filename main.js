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
   UTIL
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
function makeEditable(el, initial, onSave) {
    el.contentEditable = "true";
    el.spellcheck = false;
    el.textContent = initial;
    el.addEventListener("blur", () => {
        onSave(el.textContent || "");
    });
}
/* =========================
   GRID KEY
========================= */
function getGridKey(sourcePath, sectionInfo, el) {
    var _a;
    const line = (_a = sectionInfo === null || sectionInfo === void 0 ? void 0 : sectionInfo.lineStart) !== null && _a !== void 0 ? _a : crypto.randomUUID();
    const key = `${sourcePath}::${line}`;
    el.dataset.gridKey = key;
    return key;
}
/* =========================
   IMAGE STYLE
========================= */
function applyImageStyle(img, card, grid) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const fit = (_b = (_a = card.imageFit) !== null && _a !== void 0 ? _a : grid === null || grid === void 0 ? void 0 : grid.imageFit) !== null && _b !== void 0 ? _b : "cover";
    const height = (_d = (_c = card.imageHeight) !== null && _c !== void 0 ? _c : grid === null || grid === void 0 ? void 0 : grid.imageHeight) !== null && _d !== void 0 ? _d : 180;
    const position = (_f = (_e = card.imagePosition) !== null && _e !== void 0 ? _e : grid === null || grid === void 0 ? void 0 : grid.imagePosition) !== null && _f !== void 0 ? _f : "center";
    const radius = (_h = (_g = card.imageRadius) !== null && _g !== void 0 ? _g : grid === null || grid === void 0 ? void 0 : grid.imageRadius) !== null && _h !== void 0 ? _h : 0;
    img.style.objectFit = fit;
    img.style.height = `${height}px`;
    img.style.objectPosition = position;
    img.style.borderRadius = `${radius}px`;
    img.style.width = "100%";
}
/* =========================
   PLUGIN
========================= */
class CardGridPlugin extends obsidian_1.Plugin {
    constructor() {
        super(...arguments);
        this.saveTimers = new Map();
    }
    onload() {
        this.registerMarkdownCodeBlockProcessor("card-grid", (source, el, ctx) => {
            var _a, _b, _c, _d, _e, _f, _g;
            const data = (0, obsidian_1.parseYaml)(this.clean(source));
            if (!data || typeof data !== "object")
                return;
            const sectionInfo = (_a = ctx.getSectionInfo) === null || _a === void 0 ? void 0 : _a.call(ctx, el);
            const gridKey = getGridKey(ctx.sourcePath, sectionInfo, el);
            const normalized = {
                columns: Number((_b = data.columns) !== null && _b !== void 0 ? _b : 3),
                gap: Number((_c = data.gap) !== null && _c !== void 0 ? _c : 10),
                imageFit: (_d = data.imageFit) !== null && _d !== void 0 ? _d : "cover",
                imageHeight: (_e = data.imageHeight) !== null && _e !== void 0 ? _e : 180,
                imagePosition: (_f = data.imagePosition) !== null && _f !== void 0 ? _f : "center",
                imageRadius: (_g = data.imageRadius) !== null && _g !== void 0 ? _g : 0,
                cards: Array.isArray(data.cards) ? data.cards : []
            };
            const context = {
                el,
                data: normalized,
                sourcePath: ctx.sourcePath,
                cardDOM: new Map(),
                sectionInfo
            };
            this.render(context);
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
       SAVE (SECTION SAFE)
    ========================= */
    debouncedSave(ctx) {
        const key = ctx.el.dataset.gridKey;
        if (!key)
            return;
        if (this.saveTimers.has(key)) {
            window.clearTimeout(this.saveTimers.get(key));
        }
        const t = window.setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            const file = this.app.vault.getAbstractFileByPath(ctx.sourcePath);
            if (!(file instanceof obsidian_1.TFile))
                return;
            const raw = yield this.app.vault.read(file);
            const section = ctx.sectionInfo;
            if (!section)
                return;
            const lines = raw.split("\n");
            const block = lines.slice(section.lineStart, section.lineEnd + 1).join("\n");
            const match = block.match(/```card-grid([\s\S]*?)```/);
            if (!match)
                return;
            const parsed = (0, obsidian_1.parseYaml)(this.clean(match[1]));
            if (!parsed)
                return;
            parsed.cards = ctx.data.cards;
            parsed.columns = ctx.data.columns;
            parsed.gap = ctx.data.gap;
            parsed.imageFit = ctx.data.imageFit;
            parsed.imageHeight = ctx.data.imageHeight;
            parsed.imagePosition = ctx.data.imagePosition;
            parsed.imageRadius = ctx.data.imageRadius;
            const newBlock = "```card-grid\n" + (0, obsidian_1.stringifyYaml)(parsed) + "\n```";
            const newLines = [
                ...lines.slice(0, section.lineStart),
                newBlock,
                ...lines.slice(section.lineEnd + 1)
            ];
            yield this.app.vault.modify(file, newLines.join("\n"));
        }), 250);
        this.saveTimers.set(key, t);
    }
    /* =========================
       RENDER
    ========================= */
    render(ctx) {
        var _a;
        let container = ctx.el.querySelector(".card-grid-container");
        if (!container) {
            container = ctx.el.createDiv("card-grid-container");
        }
        container.style.display = "grid";
        container.style.gridTemplateColumns = `repeat(${ctx.data.columns}, minmax(200px, 1fr))`;
        container.style.gap = `${ctx.data.gap}px`;
        container._gridData = ctx.data;
        const existing = new Set(ctx.cardDOM.keys());
        for (const card of ctx.data.cards) {
            if (!card.id)
                card.id = crypto.randomUUID();
            let node = ctx.cardDOM.get(card.id);
            if (!node) {
                node = this.createCard(card, ctx);
                ctx.cardDOM.set(card.id, node);
            }
            container.appendChild(node);
            this.syncCard(node, card, ctx.data);
            existing.delete(card.id);
        }
        for (const id of existing) {
            (_a = ctx.cardDOM.get(id)) === null || _a === void 0 ? void 0 : _a.remove();
            ctx.cardDOM.delete(id);
        }
        /* FORCE STYLE REFRESH */
        for (const card of ctx.data.cards) {
            const node = ctx.cardDOM.get(card.id);
            if (!node)
                continue;
            const img = node.querySelector("img");
            if (img)
                applyImageStyle(img, card, ctx.data);
        }
    }
    /* =========================
       CARD
    ========================= */
    createCard(card, ctx) {
        const box = document.createElement("div");
        box.className = "card-grid-card";
        box.style.border = `2px solid ${card.color || "#ccc"}`;
        if (card.image && card.imageEnabled !== false) {
            const img = box.createEl("img");
            img.src = this.resolveImage(card.image);
            applyImageStyle(img, card, ctx.data);
        }
        const title = box.createEl("h4");
        makeEditable(title, card.title || "Untitled", (v) => {
            card.title = v;
            this.debouncedSave(ctx);
        });
        const text = box.createEl("p");
        makeEditable(text, card.text || "", (v) => {
            card.text = v;
            this.debouncedSave(ctx);
        });
        box.oncontextmenu = (e) => {
            e.preventDefault();
            const menu = new obsidian_1.Menu();
            menu.addItem((i) => i.setTitle("➕ Add card").onClick(() => {
                ctx.data.cards.push({
                    id: crypto.randomUUID(),
                    title: "New card",
                    text: "",
                    color: "#ccc",
                    image: "",
                    imageEnabled: true
                });
                this.debouncedSave(ctx);
                this.render(ctx);
            }));
            menu.addItem((i) => i.setTitle("🗑 Remove this card").onClick(() => {
                const idx = ctx.data.cards.findIndex((c) => c.id === card.id);
                if (idx !== -1)
                    ctx.data.cards.splice(idx, 1);
                this.debouncedSave(ctx);
                this.render(ctx);
            }));
            menu.addItem((i) => i.setTitle("🎨 Change color").onClick(() => {
                openColorPickerAtCursor(e, card.color || "#ccc", (c) => {
                    card.color = c;
                    this.debouncedSave(ctx);
                    this.render(ctx);
                });
            }));
            menu.addItem((i) => i.setTitle("🖼 Change image").onClick(() => {
                new ImagePickerModal(this.app, (file) => {
                    card.image = file.path;
                    card.imageEnabled = true;
                    this.debouncedSave(ctx);
                    this.render(ctx);
                }).open();
            }));
            menu.addItem((i) => i.setTitle(card.imageEnabled === false ? "Enable image" : "Disable image")
                .onClick(() => {
                card.imageEnabled = !(card.imageEnabled !== false);
                this.debouncedSave(ctx);
                this.render(ctx);
            }));
            menu.addItem((i) => i.setTitle("⬆ Move up").onClick(() => {
                const arr = ctx.data.cards;
                const idx = arr.findIndex((c) => c.id === card.id);
                if (idx > 0) {
                    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                    this.debouncedSave(ctx);
                    this.render(ctx);
                }
            }));
            menu.addItem((i) => i.setTitle("⬇ Move down").onClick(() => {
                const arr = ctx.data.cards;
                const idx = arr.findIndex((c) => c.id === card.id);
                if (idx !== -1 && idx < arr.length - 1) {
                    [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
                    this.debouncedSave(ctx);
                    this.render(ctx);
                }
            }));
            menu.showAtMouseEvent(e);
        };
        return box;
    }
    /* =========================
       SYNC
    ========================= */
    syncCard(el, card, grid) {
        const img = el.querySelector("img");
        if (img) {
            if (card.image && card.imageEnabled !== false) {
                img.src = this.resolveImage(card.image);
                applyImageStyle(img, card, grid);
                img.style.display = "";
            }
            else {
                img.style.display = "none";
            }
        }
        const h4 = el.querySelector("h4");
        if (h4)
            h4.style.background = card.color || "";
    }
    resolveImage(path) {
        const file = this.app.vault.getAbstractFileByPath(path);
        if (file instanceof obsidian_1.TFile)
            return this.app.vault.getResourcePath(file);
        return path;
    }
}
exports.default = CardGridPlugin;
