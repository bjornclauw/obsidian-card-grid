import type { App, Plugin } from "obsidian";
import type { CardGridData, CardId, CardInstance } from "../domain/types";
import type { CardTypeRegistry, CardView, CardViewContext } from "../cards/registry";
import { showCardMenu, type CardMenuHandlers } from "./menus/cardMenu";
import type { GridController } from "../controller/GridController";

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
  private controller?: GridController;

  private container: HTMLElement;
  private cardDom = new Map<CardId, CardDomEntry>();

  constructor(opts: {
    app: App;
    plugin: Plugin;
    registry: CardTypeRegistry;
    sourcePath: string;
    hostEl: HTMLElement;
    onMenu: CardMenuHandlers;
    controller?: GridController;
  }) {
    this.app = opts.app;
    this.plugin = opts.plugin;
    this.registry = opts.registry;
    this.sourcePath = opts.sourcePath;
    this.hostEl = opts.hostEl;
    this.onMenu = opts.onMenu;
    this.controller = opts.controller;

    this.container = this.hostEl.querySelector(".card-grid-container") as HTMLElement;
    if (!this.container) this.container = this.hostEl.createDiv("card-grid-container");
  }

  destroy(): void {
    this.cardDom.clear();
    this.container.empty();
  }

  update(grid: CardGridData): void {
    // Skip update if currently resizing
    if (this.controller?.isCurrentlyResizing()) {
      return;
    }

    this.container.style.display = "flex";
    this.container.style.flexDirection = "row";
    this.container.style.gap = `${grid.gap}px`;
    this.container.style.flexWrap = "wrap";
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

      // Update width on existing cards
      const cardWithWidth = card as any;
      const widthFraction = cardWithWidth.width ?? 1;
      entry.view.el.style.flex = `${widthFraction} 1 0%`;

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

    existing?.view.el.remove();

    const def = this.registry.get(card.type);
    const view = def.createView(ctx);

    view.el.dataset.cardId = card.id;

    // Apply flex-based width for resizing support
    const cardWithWidth = card as any;
    const widthFraction = cardWithWidth.width ?? 1;
    view.el.style.flex = `${widthFraction} 1 0%`;
    view.el.dataset.widthFraction = String(widthFraction);
    view.el.style.minWidth = "0";  // Important for flex overflow

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

  getContainer(): HTMLElement {
    return this.container;
  }
}