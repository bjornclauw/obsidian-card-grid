import { MarkdownRenderChild } from "obsidian";
import type { GridController } from "../controller/GridController";

export class GridRenderChild extends MarkdownRenderChild {
  private readonly controller: GridController;

  constructor(containerEl: HTMLElement, controller: GridController) {
    super(containerEl);
    this.controller = controller;
  }

  onload(): void {
    this.controller.mount();
  }

  onunload(): void {
    this.controller.destroy();
  }
}

