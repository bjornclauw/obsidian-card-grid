import type { App, Plugin } from "obsidian";
import { Notice } from "obsidian";
import type { CardGridData, CardId, CardInstance, CardTypeId, GridBlockRef } from "../domain/types";
import type { CardTypeRegistry } from "../cards/registry";
import { createId, parseCardGridObject } from "../domain/codec";
import { DEFAULT_GAP } from "../domain/defaults";
import { GridStore } from "../state/gridStore";
import { GridView } from "../ui/GridView";
import { CardGridRepository } from "../infrastructure/CardGridRepository";
import { parseYamlObject } from "../infrastructure/yaml";
import { CardEditorModal } from "../ui/modals/CardEditorModal";
import { CardTypeSuggestModal } from "../ui/modals/CardTypeSuggestModal";
import { CardResizer } from "../ui/CardResizer";

function cloneCard(card: CardInstance, newId: string): CardInstance {
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
  private isResizing = false;

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
        onAddCardBefore: (id) => this.addCard(id, "before"),
        onAddCardAfter: (id) => this.addCard(id, "after"),
        onEditCard: (id) => this.editCard(id),
        onCloneCard: (id) => this.cloneCard(id),
        onDeleteCard: (id) => this.deleteCard(id),
        onMoveCard: (id, dir) => this.moveCard(id, dir),
        onChangeType: (id, type) => this.changeType(id, type as CardTypeId),
        onResetGridWidths: () => this.resetAllWidths(),
        onChangeColumns: (count) => this.changeColumns(count)
      },
      controller: this
    });

    this.store.subscribe((next, prev) => {
      this.view.update(next);
      this.scheduleSave(next);
      this.applyGridStyles(next);
    });
  }

  mount(): void {
    this.view.update(this.store.getState());
    new CardResizer(this.app, this.view.getContainer(), this);
    this.applyGridStyles(this.store.getState());
  }

  destroy(): void {
    this.destroyed = true;
    if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
    this.view.destroy();
  }

  private applyGridStyles(data: CardGridData): void {
    const container = this.view.getContainer();
    container.style.setProperty("--grid-columns", String(data.columns));
    container.style.setProperty("--grid-gap", `${data.gap}px`);
  }

  private scheduleSave(state: CardGridData): void {
    if (this.destroyed) return;
    if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(async () => {
      this.saveTimer = null;
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

  private addCard(pivotId?: CardId, mode: "before" | "after" | "end" = "end"): void {
    const state = this.store.getState();
    let index: number;

    if (mode === "end" || !pivotId) {
      index = state.cards.length;
    } else {
      const pivotIndex = state.cards.findIndex((c) => c.id === pivotId);
      if (pivotIndex === -1) {
        index = state.cards.length;
      } else {
        index = mode === "before" ? pivotIndex : pivotIndex + 1;
      }
    }

    new CardTypeSuggestModal(this.app, this.registry, (type) => {
      const def = this.registry.get(type);
      const base = def.normalize({ id: createId("card"), type });

      (base as any).width = 1; // Default to standard column width

      this.store.dispatch({ type: "card/insert", card: base, atIndex: index });
      this.rebalanceGrid();
    }).open();
  }

  private deleteCard(id: CardId): void {
    this.store.dispatch({ type: "card/delete", id });
    this.rebalanceGrid();
  }

  private cloneCard(id: CardId): void {
    const card = this.findCard(id);
    if (!card) return;

    const cloned = cloneCard(card, createId("card"));
    const index = this.store.getState().cards.findIndex((c) => c.id === id);
    this.store.dispatch({ type: "card/insert", card: cloned, atIndex: index + 1 });

    this.rebalanceGrid();
  }

  private moveCard(id: CardId, direction: "up" | "down"): void {
    const state = this.store.getState();
    const idx = state.cards.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const toIndex = direction === "up" ? idx - 1 : idx + 1;
    this.store.dispatch({ type: "card/move", id, toIndex });
    this.rebalanceGrid();
  }

  private changeType(id: CardId, type: CardTypeId): void {
    const existing = this.findCard(id);
    if (!existing) return;
    const def = this.registry.get(type);
    const updated = def.normalize({ ...(existing as any), type, id });
    this.store.dispatch({ type: "card/replace", card: updated });
    this.rebalanceGrid();
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
      this.rebalanceGrid();
    }).open();
  }

  private changeColumns(count: number): void {
    this.store.dispatch({
      type: "grid/set-options",
      patch: { columns: count }
    });
    this.rebalanceGrid();
  }

  public updateCardWidths(updates: { id: CardId; width: number }[]): void {
    // Keep resizing flag true during dispatches to suppress intermediate renders
    this.setResizing(true);

    try {
      for (const update of updates) {
        const card = this.findCard(update.id);
        if (!card) continue;

        this.store.dispatch({
          type: "card/replace",
          card: { ...(card as any), width: Math.round(update.width * 1000) / 1000 }
        });
      }
    } finally {
      this.setResizing(false);
      // Manually trigger the final update now that both cards are updated in state
      this.rebalanceGrid();
      this.view.update(this.store.getState());
    }
  }

  public resetAllWidths(): void {
    const state = this.store.getState();
    this.setResizing(true);

    try {
      // Reset grid-level gap to default
      this.store.dispatch({
        type: "grid/set-options",
        patch: { gap: DEFAULT_GAP }
      });

      for (const card of state.cards) {
        const updated = { ...card } as any;
        updated.width = 1;
        delete updated.imageHeight;

        this.store.dispatch({
          type: "card/replace",
          card: updated
        });
      }
    } finally {
      this.setResizing(false);
      this.view.update(this.store.getState());
    }
  }


  public setResizing(resizing: boolean): void {
    this.isResizing = resizing;
  }

  public isCurrentlyResizing(): boolean {
    return this.isResizing;

  }
  /**
   * Performs a global reflow of the grid. It groups cards into rows and scales 
   * widths proportionally to ensure each row exactly fills the 'columns' constraint.
   * This naturally pushes and pulls cards between rows recursively.
     */
  private rebalanceGrid(): void {
    const state = this.store.getState();

    const cards = [...state.cards];
    const columns = state.columns;
    if (cards.length === 0) return;

    this.setResizing(true);
    try {
      const updates: CardInstance[] = [];

      let currentIndex = 0;

      while (currentIndex < cards.length) {
        const row: CardInstance[] = [];
        let rowSum = 0;

        // Group: Respect the column count strictly. Exactly 'columns' cards per row.
        // This ensures the structural truth of the grid is defined by the column count property.
        while (currentIndex < cards.length && row.length < columns) {
          const card = cards[currentIndex];
          row.push(card);
          rowSum += (typeof card.width === 'number' ? card.width : 1);
          currentIndex++;
        }

        // Scale: Proportionally adjust widths so the row fills exactly 'columns' units.
        const isFullRow = row.length === columns;
        let targetSum = isFullRow ? columns : Math.min(rowSum, columns);

        // Reset solitary cards in incomplete rows to 1 column if they were larger 
        // (handles cards being pushed or cloned from large cards).
        if (!isFullRow && row.length === 3 && rowSum > 3) {
          targetSum = 3;
        }

        const scale = rowSum > 0 ? targetSum / rowSum : 1;

        for (const card of row) {
          const newWidth = Math.round((card.width ?? 1) * scale * 1000) / 1000;
          if (newWidth === card.width) continue;

          const updated = { ...card, width: newWidth } as any;
          if (updated.raw) updated.raw = { ...updated.raw, width: newWidth };
          updates.push(updated);
        }
      }

      for (const card of updates) {
        this.store.dispatch({ type: "card/replace", card });
      }
    } finally {
      this.setResizing(false);
      this.view.update(this.store.getState());
    }
  }
}