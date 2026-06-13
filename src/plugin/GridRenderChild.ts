import { MarkdownRenderChild } from "obsidian";
import type { GridController } from "../controller/GridController";

export class GridRenderChild extends MarkdownRenderChild {
  private readonly controller: GridController;

  constructor(containerEl: HTMLElement, controller: GridController) {
    super(containerEl);
    this.controller = controller;
  }

  onload(): void {
    // The controller is mounted synchronously in the processor callback
    // (CardGridPlugin.ts) so that PDF export and off-screen Live Preview
    // blocks are fully rendered without waiting for this lifecycle hook.
    // Calling mount() here would create a second container — intentionally
    // left as a no-op.
  }

  onunload(): void {
    this.controller.destroy();
  }
}

