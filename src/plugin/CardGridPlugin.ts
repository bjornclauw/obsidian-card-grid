import { Plugin } from "obsidian";
import { createDefaultRegistry } from "../cards";
import { GridController } from "../controller/GridController";
import { GridRenderChild } from "./GridRenderChild";

export default class CardGridPlugin extends Plugin {
  private readonly registry = createDefaultRegistry();

  onload(): void {
    this.registerMarkdownCodeBlockProcessor("card-grid", (source, el, ctx) => {
      el.empty();

      const sectionInfo = ctx.getSectionInfo?.(el);
      const ref = {
        sourcePath: ctx.sourcePath,
        lineStart: sectionInfo?.lineStart,
        lineEnd: sectionInfo?.lineEnd
      };

      const controller = new GridController({
        app: this.app,
        plugin: this,
        registry: this.registry,
        hostEl: el,
        ref,
        codeBlockSource: source
      });

      ctx.addChild(new GridRenderChild(el, controller));
    });
  }
}

