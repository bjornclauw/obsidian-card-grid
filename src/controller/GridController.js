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
exports.GridController = void 0;
const obsidian_1 = require("obsidian");
const codec_1 = require("../domain/codec");
const gridStore_1 = require("../state/gridStore");
const GridView_1 = require("../ui/GridView");
const CardGridRepository_1 = require("../infrastructure/CardGridRepository");
const yaml_1 = require("../infrastructure/yaml");
const CardEditorModal_1 = require("../ui/modals/CardEditorModal");
const CardTypeSuggestModal_1 = require("../ui/modals/CardTypeSuggestModal");
function cloneCard(card, newId) {
    // Keep existing fields but assign a new id.
    const anyCard = card;
    if (anyCard.raw && typeof anyCard.raw === "object") {
        return Object.assign(Object.assign({}, anyCard), { id: newId, raw: Object.assign(Object.assign({}, anyCard.raw), { id: newId }) });
    }
    return Object.assign(Object.assign({}, card), { id: newId });
}
class GridController {
    constructor(opts) {
        this.saveTimer = null;
        this.saveChain = Promise.resolve();
        this.destroyed = false;
        this.app = opts.app;
        this.plugin = opts.plugin;
        this.registry = opts.registry;
        this.ref = opts.ref;
        this.repository = new CardGridRepository_1.CardGridRepository(this.app);
        const rawObj = (0, yaml_1.parseYamlObject)(opts.codeBlockSource);
        const initial = (0, codec_1.parseCardGridObject)(rawObj, this.registry);
        this.store = new gridStore_1.GridStore(initial);
        this.view = new GridView_1.GridView({
            app: this.app,
            plugin: this.plugin,
            registry: this.registry,
            sourcePath: this.ref.sourcePath,
            hostEl: opts.hostEl,
            onMenu: {
                onAddCard: (afterId) => this.addCard(afterId),
                onEditCard: (id) => this.editCard(id),
                onCloneCard: (id) => this.cloneCard(id),
                onDeleteCard: (id) => this.deleteCard(id),
                onMoveCard: (id, dir) => this.moveCard(id, dir),
                onChangeType: (id, type) => this.changeType(id, type)
            }
        });
        this.store.subscribe((next, prev) => {
            this.view.update(next);
            this.scheduleSave(next);
        });
    }
    mount() {
        this.view.update(this.store.getState());
    }
    destroy() {
        this.destroyed = true;
        if (this.saveTimer !== null)
            window.clearTimeout(this.saveTimer);
        this.view.destroy();
    }
    scheduleSave(state) {
        if (this.destroyed)
            return;
        if (this.saveTimer !== null)
            window.clearTimeout(this.saveTimer);
        this.saveTimer = window.setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            this.saveTimer = null;
            // Serialize saves to avoid race conditions when multiple edits happen quickly.
            const snapshot = state;
            this.saveChain = this.saveChain
                .then(() => this.repository.save(this.ref, snapshot))
                .catch(() => {
                // Avoid breaking the chain; Obsidian will surface vault errors elsewhere.
            });
        }), 250);
    }
    findCard(id) {
        var _a;
        return (_a = this.store.getState().cards.find((c) => c.id === id)) !== null && _a !== void 0 ? _a : null;
    }
    addCard(afterId) {
        const state = this.store.getState();
        const index = afterId === undefined ? state.cards.length : state.cards.findIndex((c) => c.id === afterId) + 1;
        new CardTypeSuggestModal_1.CardTypeSuggestModal(this.app, this.registry, (type) => {
            const def = this.registry.get(type);
            const base = def.normalize({ id: (0, codec_1.createId)("card"), type });
            this.store.dispatch({ type: "card/insert", card: base, atIndex: index });
        }).open();
    }
    deleteCard(id) {
        this.store.dispatch({ type: "card/delete", id });
    }
    cloneCard(id) {
        const card = this.findCard(id);
        if (!card)
            return;
        const state = this.store.getState();
        const index = state.cards.findIndex((c) => c.id === id);
        const cloned = cloneCard(card, (0, codec_1.createId)("card"));
        this.store.dispatch({ type: "card/insert", card: cloned, atIndex: index + 1 });
    }
    moveCard(id, direction) {
        const state = this.store.getState();
        const idx = state.cards.findIndex((c) => c.id === id);
        if (idx === -1)
            return;
        const toIndex = direction === "up" ? idx - 1 : idx + 1;
        this.store.dispatch({ type: "card/move", id, toIndex });
    }
    changeType(id, type) {
        const existing = this.findCard(id);
        if (!existing)
            return;
        const def = this.registry.get(type);
        const updated = def.normalize(Object.assign(Object.assign({}, existing), { type, id }));
        this.store.dispatch({ type: "card/replace", card: updated });
    }
    editCard(id) {
        const card = this.findCard(id);
        if (!card)
            return;
        const def = this.registry.get(card.type);
        if (!this.registry.has(card.type) || card.type === "unknown") {
            new obsidian_1.Notice("Unknown card type cannot be edited.");
            return;
        }
        new CardEditorModal_1.CardEditorModal(this.app, this.plugin, this.ref.sourcePath, def, card, (updated) => {
            if (!updated)
                return;
            this.store.dispatch({ type: "card/replace", card: updated });
        }).open();
    }
}
exports.GridController = GridController;
