import type { App, Plugin } from "obsidian";
import type { CardGridData, CardId, CardInstance } from "../domain/types";
import type { CardTypeRegistry, CardView, CardViewContext } from "../cards/registry";
import { showCardMenu, type CardMenuHandlers } from "./menus/cardMenu";

type CardDomEntry = {
  type: string;
  view: CardView;
};

export class GridView {
  private readonly app: App;
  private readonly plugin: Plugin;
  private readonly registry: CardTypeRegistry;
  private readonly sourcePath: string;
  private readonly hostEl: HTMLElement;
  private readonly onMenu: CardMenuHandlers;

  private container: HTMLElement;
  private cardDom = new Map<CardId, CardDomEntry>();

  constructor(opts: {
    app: App;
    plugin: Plugin;
    registry: CardTypeRegistry;
    sourcePath: string;
    hostEl: HTMLElement;
    onMenu: CardMenuHandlers;
  }) {
    this.app = opts.app;
    this.plugin = opts.plugin;
    this.registry = opts.registry;
    this.sourcePath = opts.sourcePath;
    this.hostEl = opts.hostEl;
    this.onMenu = opts.onMenu;

    this.container = this.hostEl.querySelector(".card-grid-container") as HTMLElement;
    if (!this.container) this.container = this.hostEl.createDiv("card-grid-container");
  }

  destroy(): void {
    this.cardDom.clear();
    this.container.empty();
  }

  update(grid: CardGridData): void {
    this.container.style.display = "grid";
    this.container.style.gridTemplateColumns = `repeat(${grid.columns}, minmax(200px, 1fr))`;
    this.container.style.gap = `${grid.gap}px`;
    this.hostEl.dataset.cardGridId = grid.id;

    const viewCtx: CardViewContext = {
      app: this.app,
      plugin: this.plugin,
      sourcePath: this.sourcePath,
      grid
    };

    const existing = new Set(this.cardDom.keys());

    for (const card of grid.cards) {
      const entry = this.ensureCard(card, viewCtx);
      this.container.appendChild(entry.view.el);
      entry.view.update(card as any, viewCtx);
      existing.delete(card.id);
    }

    for (const id of existing) {
      const entry = this.cardDom.get(id);
      entry?.view.el.remove();
      this.cardDom.delete(id);
    }
  }

  private ensureCard(card: CardInstance, ctx: CardViewContext): CardDomEntry {
    const existing = this.cardDom.get(card.id);
    if (existing && existing.type === card.type) return existing;

    // Replace if type changes.
    existing?.view.el.remove();

    const def = this.registry.get(card.type);
    const view = def.createView(ctx);

    view.el.dataset.cardId = card.id;
    view.el.addEventListener("contextmenu", (evt) => {
      showCardMenu(
        evt as MouseEvent,
        this.app,
        ctx.grid,
        this.registry,
        card.id,
        this.onMenu
      );
    });

    const entry: CardDomEntry = { type: card.type, view };
    this.cardDom.set(card.id, entry);
    return entry;
  }
}
