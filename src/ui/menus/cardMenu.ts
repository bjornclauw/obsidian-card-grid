import type { App } from "obsidian";
import { Menu } from "obsidian";
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

  menu.addItem((i) => i.setTitle("Edit").onClick(() => handlers.onEditCard(cardId)));
  menu.addItem((i) =>
    i.setTitle("Clone").onClick(() => handlers.onCloneCard(cardId))
  );
  menu.addItem((i) =>
    i.setTitle("Remove").onClick(() => handlers.onDeleteCard(cardId))
  );
  menu.addSeparator();
  menu.addItem((i) =>
    i.setTitle("Add card before").onClick(() => handlers.onAddCardBefore(cardId))
  );
  menu.addItem((i) =>
    i.setTitle("Add card after").onClick(() => handlers.onAddCardAfter(cardId))
  );



  menu.addSeparator();

  menu.addItem((i) => i.setTitle("Move up").onClick(() => handlers.onMoveCard(cardId, "up")));
  menu.addItem((i) =>
    i.setTitle("Move down").onClick(() => handlers.onMoveCard(cardId, "down"))
  );

  menu.addSeparator();

  menu.addItem((i) =>
    i.setTitle("Change type…").onClick(() => {
      new CardTypeSuggestModal(app, registry, (type) => {
        handlers.onChangeType(cardId, type);
      }).open();
    })
  );

  menu.addSeparator();
  // Inside src/ui/menus/cardMenu.ts
  menu.addItem((item) => {
    item.setTitle("Reset all widths")
      .setIcon("reset")
      .onClick(() => handlers.onResetGridWidths?.());
  });


  menu.showAtMouseEvent(evt);
}
