import { MarkdownRenderer, TFile } from "obsidian";
import type { ImageCard } from "../../domain/types";
import type { CardTypeDefinition, CardView, CardViewContext } from "../registry";
import { createId } from "../../domain/codec";
import { applyImageStyle } from "../shared/imageStyle";

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export const imageCardType: CardTypeDefinition<ImageCard> = {
  type: "image",
  displayName: "Image card",
  editor: {
    title: "Edit image card",
    fields: [
      { kind: "text", key: "title", label: "Title" },
      { kind: "markdown", key: "text", label: "Text" },
      { kind: "toggle", key: "imageEnabled", label: "Show image", defaultValue: true },
      { kind: "image-file", key: "image", label: "Image" },
      {
        kind: "select",
        key: "imageFit",
        label: "Image fit",
        options: [
          { label: "Cover", value: "cover" },
          { label: "Contain", value: "contain" },
          { label: "Fill", value: "fill" },
          { label: "None", value: "none" },
          { label: "Scale-down", value: "scale-down" }
        ]
      },
      { kind: "number", key: "imageHeight", label: "Image height", min: 0, step: 10 },
      { kind: "text", key: "imagePosition", label: "Image position", placeholder: "e.g. center" },
      { kind: "number", key: "imageRadius", label: "Image radius", min: 0, step: 1 },
      {
        kind: "color",
        key: "backgroundColor",
        label: "Border color",
        defaultValue: "#cccccc"
      },
      {
        kind: "color",
        key: "textColor",
        label: "Title color",
        defaultValue: "#000000"
      },
      {
        kind: "number",
        key: "width",
        label: "Width (columns)",
        defaultValue: 1 // Default to 1 column
      }
    ]
  },
  normalize(raw: unknown): ImageCard {
    if (!isRecord(raw)) {
      return { id: createId("card"), type: "image", title: "Untitled", text: "" };
    }
    const id =
      typeof raw.id === "string" && raw.id.trim().length > 0
        ? raw.id.trim()
        : createId("card");
    return {
      id,
      type: "image",
      title: typeof raw.title === "string" ? raw.title : "Untitled",
      text: typeof raw.text === "string" ? raw.text : "",
      backgroundColor:
        typeof raw.backgroundColor === "string" ? raw.backgroundColor : undefined,
      textColor: typeof raw.textColor === "string" ? raw.textColor : undefined,
      image: typeof raw.image === "string" ? raw.image : undefined,
      imageEnabled: typeof raw.imageEnabled === "boolean" ? raw.imageEnabled : undefined,
      imageFit: (typeof raw.imageFit === "string" ? raw.imageFit : undefined) as ImageCard["imageFit"],
      imageHeight: typeof raw.imageHeight === "number" ? raw.imageHeight : undefined,
      imagePosition: typeof raw.imagePosition === "string" ? raw.imagePosition : undefined,
      imageRadius: typeof raw.imageRadius === "number" ? raw.imageRadius : undefined,
      width: typeof raw.width === "number" ? Math.max(1, raw.width) : 1
    };
  },
  createView(ctx: CardViewContext): CardView<ImageCard> {
    const box = document.createElement("div");
    box.className = "card-grid-card";

    const img = box.createEl("img");
    const titleEl = box.createEl("h4");
    const textEl = box.createDiv("card-text");

    async function renderMarkdown(el: HTMLElement, markdown: string) {
      el.empty();
      await MarkdownRenderer.render(ctx.app, markdown || " ", el, ctx.sourcePath, ctx.plugin);
    }

    function resolveImagePath(path: string): string {
      const file = ctx.app.vault.getAbstractFileByPath(path);
      if (file instanceof TFile) {
        return ctx.app.vault.getResourcePath(file);
      }
      return path;
    }

    return {
      el: box,
      update(card: ImageCard, viewCtx: CardViewContext) {
        box.style.border = `2px solid ${card.backgroundColor || "#ccc"}`;

        const enabled = card.imageEnabled !== false;
        if (enabled && card.image) {
          img.style.display = "";
          img.src = resolveImagePath(card.image);
          applyImageStyle(img, card, viewCtx.grid);
        } else {
          img.style.display = "none";
        }

        titleEl.style.color = card.textColor || "#000000";
        titleEl.style.backgroundColor = card.backgroundColor || "transparent";
        void renderMarkdown(titleEl, card.title || "Untitled");
        void renderMarkdown(textEl, card.text || "");
      }
    };
  }
};
