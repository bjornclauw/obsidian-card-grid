"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showCardMenu = showCardMenu;
const obsidian_1 = require("obsidian");
const CardTypeSuggestModal_1 = require("../modals/CardTypeSuggestModal");
function showCardMenu(evt, app, grid, registry, cardId, handlers) {
    evt.preventDefault();
    const menu = new obsidian_1.Menu();
    menu.addItem((i) => i.setTitle("Edit").onClick(() => handlers.onEditCard(cardId)));
    menu.addItem((i) => i.setTitle("Add card after").onClick(() => handlers.onAddCard(cardId)));
    menu.addItem((i) => i.setTitle("Clone").onClick(() => handlers.onCloneCard(cardId)));
    menu.addItem((i) => i.setTitle("Remove").onClick(() => handlers.onDeleteCard(cardId)));
    menu.addSeparator();
    menu.addItem((i) => i.setTitle("Move up").onClick(() => handlers.onMoveCard(cardId, "up")));
    menu.addItem((i) => i.setTitle("Move down").onClick(() => handlers.onMoveCard(cardId, "down")));
    menu.addSeparator();
    menu.addItem((i) => i.setTitle("Change type…").onClick(() => {
        new CardTypeSuggestModal_1.CardTypeSuggestModal(app, registry, (type) => {
            handlers.onChangeType(cardId, type);
        }).open();
    }));
    menu.showAtMouseEvent(evt);
}
