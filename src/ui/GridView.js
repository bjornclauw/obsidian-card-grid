"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GridView = void 0;
const cardMenu_1 = require("./menus/cardMenu");
class GridView {
    constructor(opts) {
        this.cardDom = new Map();
        this.app = opts.app;
        this.plugin = opts.plugin;
        this.registry = opts.registry;
        this.sourcePath = opts.sourcePath;
        this.hostEl = opts.hostEl;
        this.onMenu = opts.onMenu;
        this.container = this.hostEl.querySelector(".card-grid-container");
        if (!this.container)
            this.container = this.hostEl.createDiv("card-grid-container");
    }
    destroy() {
        this.cardDom.clear();
        this.container.empty();
    }
    update(grid) {
        this.container.style.display = "grid";
        this.container.style.gridTemplateColumns = `repeat(${grid.columns}, minmax(200px, 1fr))`;
        this.container.style.gap = `${grid.gap}px`;
        this.hostEl.dataset.cardGridId = grid.id;
        const viewCtx = {
            app: this.app,
            plugin: this.plugin,
            sourcePath: this.sourcePath,
            grid
        };
        const existing = new Set(this.cardDom.keys());
        for (const card of grid.cards) {
            const entry = this.ensureCard(card, viewCtx);
            this.container.appendChild(entry.view.el);
            entry.view.update(card, viewCtx);
            existing.delete(card.id);
        }
        for (const id of existing) {
            const entry = this.cardDom.get(id);
            entry === null || entry === void 0 ? void 0 : entry.view.el.remove();
            this.cardDom.delete(id);
        }
    }
    ensureCard(card, ctx) {
        const existing = this.cardDom.get(card.id);
        if (existing && existing.type === card.type)
            return existing;
        // Replace if type changes.
        existing === null || existing === void 0 ? void 0 : existing.view.el.remove();
        const def = this.registry.get(card.type);
        const view = def.createView(ctx);
        view.el.dataset.cardId = card.id;
        view.el.addEventListener("contextmenu", (evt) => {
            (0, cardMenu_1.showCardMenu)(evt, this.app, ctx.grid, this.registry, card.id, this.onMenu);
        });
        const entry = { type: card.type, view };
        this.cardDom.set(card.id, entry);
        return entry;
    }
}
exports.GridView = GridView;
