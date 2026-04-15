import type { App, Plugin } from "obsidian";
import { Notice } from "obsidian";
import type { CardGridData, CardId, CardInstance, CardTypeId, GridBlockRef } from "../domain/types";
import type { CardTypeRegistry } from "../cards/registry";
import { createId, parseCardGridObject } from "../domain/codec";
import { GridStore } from "../state/gridStore";
import { GridView } from "../ui/GridView";
import { CardGridRepository } from "../infrastructure/CardGridRepository";
import { parseYamlObject } from "../infrastructure/yaml";
import { CardEditorModal } from "../ui/modals/CardEditorModal";
import { CardTypeSuggestModal } from "../ui/modals/CardTypeSuggestModal";

function cloneCard(card: CardInstance, newId: string): CardInstance {
  // Keep existing fields but assign a new id.
  const anyCard = card as any;
  if (anyCard.raw && typeof anyCard.raw === "object") {
    return { ...anyCard, id: newId, raw: { ...(anyCard.raw as any), id: newId } };
  }
  return { ...(card as any), id: newId } as CardInstance;
}

export class GridController {
  private readonly app: App;
  private readonly plugin: Plugin;
  private readonly registry: CardTypeRegistry;
  private readonly ref: GridBlockRef;
  private readonly repository: CardGridRepository;
  private readonly store: GridStore;
  private readonly view: GridView;

  private saveTimer: number | null = null;
  private saveChain: Promise<void> = Promise.resolve();
  private destroyed = false;

  constructor(opts: {
    app: App;
    plugin: Plugin;
    registry: CardTypeRegistry;
    hostEl: HTMLElement;
    ref: GridBlockRef;
    codeBlockSource: string;
  }) {
    this.app = opts.app;
    this.plugin = opts.plugin;
    this.registry = opts.registry;
    this.ref = opts.ref;
    this.repository = new CardGridRepository(this.app);

    const rawObj = parseYamlObject(opts.codeBlockSource);
    const initial = parseCardGridObject(rawObj, this.registry);

    this.store = new GridStore(initial);
    this.view = new GridView({
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
        onChangeType: (id, type) => this.changeType(id, type as CardTypeId)
      }
    });

    this.store.subscribe((next, prev) => {
      this.view.update(next);
      this.scheduleSave(next);
    });
  }

  mount(): void {
    this.view.update(this.store.getState());
  }

  destroy(): void {
    this.destroyed = true;
    if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
    this.view.destroy();
  }

  private scheduleSave(state: CardGridData): void {
    if (this.destroyed) return;
    if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(async () => {
      this.saveTimer = null;
      // Serialize saves to avoid race conditions when multiple edits happen quickly.
      const snapshot = state;
      this.saveChain = this.saveChain
        .then(() => this.repository.save(this.ref, snapshot))
        .catch(() => {
          // Avoid breaking the chain; Obsidian will surface vault errors elsewhere.
        });
    }, 250);
  }

  private findCard(id: CardId): CardInstance | null {
    return this.store.getState().cards.find((c) => c.id === id) ?? null;
  }

  private addCard(afterId?: CardId): void {
    const state = this.store.getState();
    const index =
      afterId === undefined ? state.cards.length : state.cards.findIndex((c) => c.id === afterId) + 1;

    new CardTypeSuggestModal(this.app, this.registry, (type) => {
      const def = this.registry.get(type);
      const base = def.normalize({ id: createId("card"), type });
      this.store.dispatch({ type: "card/insert", card: base, atIndex: index });
    }).open();
  }

  private deleteCard(id: CardId): void {
    this.store.dispatch({ type: "card/delete", id });
  }

  private cloneCard(id: CardId): void {
    const card = this.findCard(id);
    if (!card) return;
    const state = this.store.getState();
    const index = state.cards.findIndex((c) => c.id === id);
    const cloned = cloneCard(card, createId("card"));
    this.store.dispatch({ type: "card/insert", card: cloned, atIndex: index + 1 });
  }

  private moveCard(id: CardId, direction: "up" | "down"): void {
    const state = this.store.getState();
    const idx = state.cards.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const toIndex = direction === "up" ? idx - 1 : idx + 1;
    this.store.dispatch({ type: "card/move", id, toIndex });
  }

  private changeType(id: CardId, type: CardTypeId): void {
    const existing = this.findCard(id);
    if (!existing) return;
    const def = this.registry.get(type);
    const updated = def.normalize({ ...(existing as any), type, id });
    this.store.dispatch({ type: "card/replace", card: updated });
  }

  private editCard(id: CardId): void {
    const card = this.findCard(id);
    if (!card) return;
    const def = this.registry.get(card.type);

    if (!this.registry.has(card.type) || card.type === "unknown") {
      new Notice("Unknown card type cannot be edited.");
      return;
    }

    new CardEditorModal(this.app, this.plugin, this.ref.sourcePath, def as any, card as any, (updated) => {
      if (!updated) return;
      this.store.dispatch({ type: "card/replace", card: updated });
    }).open();
  }
}
