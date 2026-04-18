import type { App } from "obsidian";
import { Menu, MenuItem } from "obsidian";
import type { CardGridData, CardId } from "../../domain/types";
import type { CardTypeRegistry } from "../../cards/registry";
import { CardTypeSuggestModal } from "../modals/CardTypeSuggestModal";

export type CardMenuHandlers = {
  onAddCardBefore: (id: CardId) => void;
  onAddCardAfter: (id: CardId) => void;
  onEditCard: (id: CardId) => void;
  onCloneCard: (id: CardId) => void;
  onDeleteCard: (id: CardId) => void;
  onMoveCard: (id: CardId, direction: "up" | "down") => void;
  onChangeType: (id: CardId, type: string) => void;
  onChangeColumns: (count: number) => void;
  onResetGridWidths?: () => void;
};

export function showCardMenu(
  evt: MouseEvent,
  app: App,
  grid: CardGridData,
  registry: CardTypeRegistry,
  cardId: CardId,
  handlers: CardMenuHandlers
): void {
  evt.preventDefault();

  const menu = new Menu();

  // --- Card Actions ---
  menu.addItem((i) => i
    .setTitle("Edit card")
    .setIcon("pencil")
    .onClick(() => handlers.onEditCard(cardId)));

  menu.addSeparator();

  // --- Insertion ---
  menu.addItem((i) => i
    .setTitle("Add card before")
    .setIcon("plus-circle")
    .onClick(() => handlers.onAddCardBefore(cardId)));
  menu.addItem((i) => i
    .setTitle("Add card after")
    .setIcon("plus-circle")
    .onClick(() => handlers.onAddCardAfter(cardId)));

  menu.addSeparator();

  // --- Organization ---
  menu.addItem((i) => i
    .setTitle("Clone card")
    .setIcon("copy")
    .onClick(() => handlers.onCloneCard(cardId)));
  menu.addItem((i) => i
    .setTitle("Move up")
    .setIcon("arrow-up")
    .onClick(() => handlers.onMoveCard(cardId, "up")));
  menu.addItem((i) => i
    .setTitle("Move down")
    .setIcon("arrow-down")
    .onClick(() => handlers.onMoveCard(cardId, "down")));

  menu.addSeparator();

  // --- Grid & Type Settings ---
  menu.addItem((i) => i
    .setTitle("Change card type...")
    .setIcon("type")
    .onClick(() => {
      new CardTypeSuggestModal(app, registry, (type) => {
        handlers.onChangeType(cardId, type);
      }).open();
    }));

  menu.addItem((item) => {
    item.setTitle("Columns")
      .setIcon("layout-columns");
    const submenu = (item as any).setSubmenu();
    [1, 2, 3, 4].forEach((num) => {
      submenu.addItem((subItem: MenuItem) => {
        subItem.setTitle(`${num} column${num > 1 ? "s" : ""}`)
          .setChecked(grid.columns === num)
          .onClick(() => handlers.onChangeColumns(num));
      });
    });
  });

  menu.addItem((item) => item
    .setTitle("Reset dimensions")
    .setIcon("rotate-ccw")
    .onClick(() => handlers.onResetGridWidths?.()));

  menu.addSeparator();

  // --- Danger Zone ---
  menu.addItem((i) => i
    .setTitle("Remove card")
    .setIcon("trash")
    .onClick(() => handlers.onDeleteCard(cardId)));

  menu.showAtMouseEvent(evt);
}
