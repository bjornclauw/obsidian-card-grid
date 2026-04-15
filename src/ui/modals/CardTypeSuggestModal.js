"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardTypeSuggestModal = void 0;
const obsidian_1 = require("obsidian");
class CardTypeSuggestModal extends obsidian_1.SuggestModal {
    constructor(app, registry, onPick) {
        super(app);
        this.registry = registry;
        this.onPick = onPick;
        this.setPlaceholder("Choose card type…");
    }
    getSuggestions(query) {
        const q = query.toLowerCase().trim();
        const defs = this.registry
            .list()
            .filter((d) => d.type !== "unknown")
            .map((d) => ({ type: d.type, name: d.displayName }));
        if (!q)
            return defs;
        return defs.filter((d) => d.name.toLowerCase().includes(q) || d.type.toLowerCase().includes(q));
    }
    renderSuggestion(item, el) {
        el.createDiv({ text: item.name });
        el.createDiv({ text: item.type, cls: "card-grid-suggest-sub" });
    }
    onChooseSuggestion(item) {
        this.onPick(item.type);
    }
}
exports.CardTypeSuggestModal = CardTypeSuggestModal;
