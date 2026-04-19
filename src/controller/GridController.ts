import type { App, Plugin } from "obsidian";
import { Notice } from "obsidian";
import type { CardGridSettings } from "../plugin/settings";
import type { CardGridData, CardId, CardInstance, CardTypeId, GridBlockRef } from "../domain/types";
import type { CardTypeRegistry } from "../cards/registry";
import { createId, parseCardGridObject } from "../domain/codec";
import { defaultGridData } from "../domain/defaults";
import { GridStore } from "../state/gridStore";
import { GridView } from "../ui/GridView";
import { CardGridRepository } from "../infrastructure/CardGridRepository";
import { parseYamlObject } from "../infrastructure/yaml";
import { CardEditorModal } from "../ui/modals/CardEditorModal";
import { CardTypeSuggestModal } from "../ui/modals/CardTypeSuggestModal";
import { CardResizer } from "../ui/CardResizer";

const MIN_WIDTH = 0.3;

function cloneCard<T extends CardInstance>(card: T, newId: string): T {
  const cloned = structuredClone(card) as CardInstance;
  cloned.id = newId;
  if ('raw' in cloned && typeof cloned.raw === "object" && cloned.raw !== null) {
    (cloned.raw as any).id = newId;
  }
  return cloned as T;
}

export class GridController {
  private readonly app: App;
  private readonly plugin: Plugin;
  private readonly registry: CardTypeRegistry;
  private readonly ref: GridBlockRef;
  private readonly repository: CardGridRepository;
  private readonly store: GridStore;
  private readonly view: GridView;
  private resizer: CardResizer | null = null;

  private saveTimer: number | null = null;
  private saveChain: Promise<void> = Promise.resolve();
  private destroyed = false;
  private isResizing = false;

  // Called by the plugin after the widget's height has settled post-render.
  // Used to keep the height cache up to date so CM6 always gets the correct
  // estimated height on remount, preventing gap recalculation scroll jumps.
  private readonly onHeightSettled: ((height: number) => void) | null;

  constructor(opts: {
    app: App;
    plugin: Plugin;
    registry: CardTypeRegistry;
    hostEl: HTMLElement;
    ref: GridBlockRef;
    codeBlockSource: string;
    onHeightSettled?: (height: number) => void;
  }) {
    this.app = opts.app;
    this.plugin = opts.plugin;
    this.registry = opts.registry;
    this.ref = opts.ref;
    this.onHeightSettled = opts.onHeightSettled ?? null;
    this.repository = new CardGridRepository(this.app);

    const rawObj = parseYamlObject(opts.codeBlockSource);
    const settings = (opts.plugin as any).settings as CardGridSettings;
    const initial = parseCardGridObject({
      columns: settings?.defaultColumns,
      gap: settings?.defaultGap,
      borderRadius: settings?.defaultBorderRadius,
      imageFit: settings?.defaultImageFit,
      imageHeight: settings?.defaultImageHeight,
      imagePosition: settings?.defaultImagePosition,
      imageRadius: settings?.defaultImageRadius,
      ...(rawObj as object)
    }, this.registry);

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

    // Gate the subscriber on isResizing so that bulk operations (cloneCard,
    // rebalanceGrid, etc.) that dispatch multiple store updates in a single
    // logical operation don't trigger intermediate view renders or save
    // scheduling. Each bulk op manually calls flushUpdate() when done.
    this.store.subscribe((next, _prev) => {
      if (this.isResizing) return;
      this.view.update(next);
      this.scheduleSave(next);
      this.applyGridStyles(next);
    });
  }

  mount(): void {
    this.view.update(this.store.getState());
    this.resizer = new CardResizer(this.app, this.view.getContainer(), this);
    this.applyGridStyles(this.store.getState());

    // Install a ResizeObserver to track the widget's settled height and
    // report it back to the plugin's height cache. This ensures that when
    // CM6 remounts the widget after a save, it can immediately apply the
    // correct min-height so the gap calculation is never wrong.
    if (this.onHeightSettled) {
      const hostEl = this.view.getContainer();
      let settleTimer: number | null = null;
      let readyToReport = false;

      // Don't report during the first synchronous render pass — the widget
      // may have only partially laid out and the height would be wrong.
      requestAnimationFrame(() => { readyToReport = true; });

      const ro = new ResizeObserver((entries) => {
        if (!readyToReport) return;
        const height = entries[0]?.contentRect.height ?? hostEl.offsetHeight;
        // Ignore near-zero heights that fire during teardown
        if (height < 50) return;
        if (settleTimer !== null) window.clearTimeout(settleTimer);
        settleTimer = window.setTimeout(() => {
          this.onHeightSettled!(height);
        }, 300);
      });

      ro.observe(hostEl);

      // Wrap destroy so the observer is cleaned up with the controller
      const origDestroy = this.destroy.bind(this);
      this.destroy = () => {
        ro.disconnect();
        if (settleTimer !== null) window.clearTimeout(settleTimer);
        origDestroy();
      };
    }
  }

  destroy(): void {
    this.destroyed = true;
    if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
    this.resizer?.destroy();
    this.view.destroy();
  }

  private applyGridStyles(data: CardGridData): void {
    const container = this.view.getContainer();
    container.style.setProperty("--grid-columns", String(data.columns));
    container.style.setProperty("--grid-gap", `${data.gap}px`);
    container.style.setProperty("--grid-border-radius", `${data.borderRadius}px`);
    container.style.setProperty("--card-background-default", "var(--background-secondary)");
    container.style.setProperty("--card-text-default", "var(--text-normal)");
  }

  private scheduleSave(state: CardGridData): void {
    if (this.destroyed) return;
    if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(async () => {
      this.saveTimer = null;
      this.saveChain = this.saveChain
        .then(() => this.repository.save(this.ref, state))
        .catch((err) => {
          console.error("Card Grid: Failed to save to vault", err);
          new Notice("Card Grid: Save failed. Check console for details.");
        });
    }, 250);
  }

  // Single exit point for all bulk operations. Called after setResizing(false)
  // to trigger exactly one view update, one save schedule, and one style apply.
  private flushUpdate(): void {
    const state = this.store.getState();
    this.view.update(state);
    this.scheduleSave(state);
    this.applyGridStyles(state);
  }

  private findCard(id: CardId): CardInstance | null {
    return this.store.getState().cards.find((c) => c.id === id) ?? null;
  }

  private addCard(pivotId?: CardId, mode: "before" | "after" | "end" = "end"): void {
    this.setResizing(true);
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
      this.setResizing(false);
      if (!type) return;
      const def = this.registry.get(type);
      const base = def.normalize({ id: createId("card"), type });

      let width = 1;
      if (pivotId && (mode === "before" || mode === "after")) {
        const pivot = this.findCard(pivotId);
        if (pivot) {
          width = Math.max(MIN_WIDTH, Math.round(((pivot.width ?? 1) / 2) * 1000) / 1000);
          this.updateCardProperties(pivot.id, { width });
        }
      }

      (base as any).width = width;

      this.setResizing(true);
      this.store.dispatch({ type: "card/insert", card: base, atIndex: index });
      this.rebalanceGrid(); // rebalanceGrid calls flushUpdate() internally
    }).open();
  }

  public updateCardProperties(id: CardId, patch: Partial<CardInstance>): void {
    const card = this.findCard(id);
    if (!card) return;
    const updated = { ...card, ...patch } as any;
    if (updated.raw) updated.raw = { ...updated.raw, ...patch };
    // This is always called from within a bulk operation (isResizing=true),
    // so the subscriber is gated and no intermediate update fires.
    this.store.dispatch({ type: "card/replace", card: updated });
  }

  private deleteCard(id: CardId): void {
    this.setResizing(true);
    this.store.dispatch({ type: "card/delete", id });
    this.rebalanceGrid();
  }

  private cloneCard(id: CardId): void {
    const card = this.findCard(id);
    if (!card) return;

    this.setResizing(true);

    const state = this.store.getState();
    const columns = state.columns;
    const cards = state.cards;
    const cardIndex = cards.findIndex((c) => c.id === id);

    // Find all cards sharing this row (strictly by column count)
    const rowIndex = Math.floor(cardIndex / columns);
    const rowStart = rowIndex * columns;
    const rowEnd = Math.min(rowStart + columns, cards.length);
    const cardsInRow = cards.slice(rowStart, rowEnd);

    const rowSum = cardsInRow.reduce((sum, c) => sum + (c.width ?? 1), 0);
    const freeSpace = Math.max(0, columns - rowSum);
    const originalWidth = card.width ?? 1;

    let keptWidth: number;
    let cloneWidth: number;

    if (freeSpace >= MIN_WIDTH) {
      // Enough room — original keeps its full width, clone takes the free space.
      // Don't touch the original at all.
      keptWidth = originalWidth;
      cloneWidth = Math.round(freeSpace * 1000) / 1000;
    } else {
      // Not enough free space — split the original's width between both cards.
      keptWidth = Math.max(MIN_WIDTH, Math.round((originalWidth / 2) * 1000) / 1000);
      cloneWidth = Math.max(
        MIN_WIDTH,
        Math.round((originalWidth - keptWidth + freeSpace) * 1000) / 1000
      );
    }

    if (keptWidth !== originalWidth) {
      this.updateCardProperties(id, { width: keptWidth });
    }

    const cloned = cloneCard(card, createId("card"));
    (cloned as any).width = cloneWidth;

    const insertIndex = this.store.getState().cards.findIndex((c) => c.id === id);
    this.store.dispatch({ type: "card/insert", card: cloned, atIndex: insertIndex + 1 });

    this.rebalanceGrid();
  }

  private moveCard(id: CardId, direction: "up" | "down"): void {
    const state = this.store.getState();
    const idx = state.cards.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const toIndex = direction === "up" ? idx - 1 : idx + 1;
    this.setResizing(true);
    this.store.dispatch({ type: "card/move", id, toIndex });
    this.rebalanceGrid();
  }

  private changeType(id: CardId, type: CardTypeId): void {
    const existing = this.findCard(id);
    if (!existing) return;
    this.setResizing(true);
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

    new CardEditorModal(
      this.app,
      this.plugin,
      this.ref.sourcePath,
      this.store.getState(),
      def as any,
      card as any,
      (updated) => {
        if (!updated) return;
        this.setResizing(true);
        this.store.dispatch({ type: "card/replace", card: updated });
        this.rebalanceGrid();
      }).open();
  }

  private changeColumns(count: number): void {
    this.setResizing(true);
    this.store.dispatch({
      type: "grid/set-options",
      patch: { columns: count }
    });
    this.rebalanceGrid();
  }

  public updateCardWidths(updates: { id: CardId; width: number }[]): void {
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
      // rebalanceGrid will call flushUpdate() at the end
      this.rebalanceGrid();
    }
  }

  public resetAllWidths(): void {
    const state = this.store.getState();
    this.setResizing(true);
    try {
      const defaults = defaultGridData(this.store.getState().id);
      this.store.dispatch({
        type: "grid/set-options",
        patch: { gap: defaults.gap, borderRadius: defaults.borderRadius }
      });
      for (const card of state.cards) {
        const updated = { ...card } as any;
        updated.width = 1;
        delete updated.imageHeight;
        this.store.dispatch({ type: "card/replace", card: updated });
      }
    } finally {
      this.setResizing(false);
      this.flushUpdate();
    }
  }

  public setResizing(resizing: boolean): void {
    this.isResizing = resizing;
  }

  public isCurrentlyResizing(): boolean {
    return this.isResizing;
  }

  /**
   * Performs a global reflow of the grid. Groups cards into rows and scales
   * widths proportionally so each row exactly fills the 'columns' constraint.
   * Always ends with setResizing(false) + flushUpdate() so callers don't need
   * to do their own cleanup — just call rebalanceGrid() and walk away.
   */
  private rebalanceGrid(): void {
    const state = this.store.getState();
    const cards = [...state.cards];
    const columns = state.columns;

    // Even if there are no cards, we still need to flush the update
    // so the view and save reflect whatever operation preceded this call.
    if (cards.length === 0) {
      this.setResizing(false);
      this.flushUpdate();
      return;
    }

    try {
      const updates: CardInstance[] = [];
      let currentIndex = 0;

      while (currentIndex < cards.length) {
        const row: CardInstance[] = [];
        let rowSum = 0;

        while (currentIndex < cards.length && row.length < columns) {
          const card = cards[currentIndex];
          row.push(card);
          rowSum += typeof card.width === "number" ? card.width : 1;
          currentIndex++;
        }

        const isLastRow = currentIndex === cards.length;
        const targetSum = (rowSum >= columns - 0.05 || !isLastRow) ? columns - 0.001 : rowSum;
        const scale = rowSum > 0 ? targetSum / rowSum : 1;

        // Pass 1: scale and clamp
        let currentTotal = 0;
        const rowWidths = row.map(c => {
          const w = Math.max(MIN_WIDTH, (c.width ?? 1) * scale);
          currentTotal += w;
          return w;
        });

        // Pass 2: redistribute overage caused by clamping
        if (currentTotal > columns) {
          const overage = currentTotal - (columns - 0.001);
          const adjustableIndices = rowWidths
            .map((w, i) => w > MIN_WIDTH ? i : -1)
            .filter(i => i !== -1);
          if (adjustableIndices.length > 0) {
            const reduction = overage / adjustableIndices.length;
            for (const idx of adjustableIndices) {
              rowWidths[idx] = Math.max(MIN_WIDTH, rowWidths[idx] - reduction);
            }
          }
        }

        for (let i = 0; i < row.length; i++) {
          const card = row[i];
          const newWidth = Math.round(rowWidths[i] * 1000) / 1000;
          if (newWidth === card.width) continue;
          const updated = { ...card, width: newWidth } as any;
          if (updated.raw) updated.raw = { ...updated.raw, width: newWidth };
          updates.push(updated);
        }
      }

      // All dispatches below are gated by isResizing=true so no intermediate
      // subscriber callbacks fire
      for (const card of updates) {
        this.store.dispatch({ type: "card/replace", card });
      }
    } finally {
      // Always end bulk mode and flush exactly once
      this.setResizing(false);
      this.flushUpdate();
    }
  }
}