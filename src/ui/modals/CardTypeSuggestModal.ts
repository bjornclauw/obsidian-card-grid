import { App, SuggestModal } from "obsidian";
import type { CardTypeId } from "../../domain/types";
import type { CardTypeRegistry, CardTypeDefinition } from "../../cards/registry";

type Item = { type: CardTypeId; name: string; description?: string };

export class CardTypeSuggestModal extends SuggestModal<Item> {
  private readonly registry: CardTypeRegistry;
  private readonly onPick: (type: CardTypeId) => void;

  constructor(app: App, registry: CardTypeRegistry, onPick: (type: CardTypeId) => void) {
    super(app);
    this.registry = registry;
    this.onPick = onPick;
    this.setPlaceholder("Choose card type…");
  }

  getSuggestions(query: string): Item[] {
    const q = query.toLowerCase().trim();
    const defs = this.registry
      .list()
      .filter((d) => d.type !== "unknown")
      .map((d: CardTypeDefinition) => ({
        type: d.type,
        name: d.displayName,
        description: d.description
      }));

    if (!q) return defs;
    return defs.filter(
      (d) => d.name.toLowerCase().includes(q) || d.type.toLowerCase().includes(q)
    );
  }

  renderSuggestion(item: Item, el: HTMLElement): void {
    el.createDiv({ text: item.name });
    if (item.description) {
      el.createDiv({ text: item.description, cls: "card-grid-suggest-description" });
    }
    el.createDiv({ text: item.type, cls: "card-grid-suggest-sub" });
  }

  onChooseSuggestion(item: Item): void {
    this.onPick(item.type);
  }
}
