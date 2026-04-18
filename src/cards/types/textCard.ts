import { MarkdownRenderer } from "obsidian";
import type { TextCard } from "../../domain/types";
import type { CardTypeDefinition, CardView, CardViewContext } from "../registry";
import { createId } from "../../domain/codec";

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export const textCardType: CardTypeDefinition<TextCard> = {
  type: "text",
  displayName: "Text card",
  editor: {
    title: "Edit text card",
    fields: [
      { kind: "text", key: "title", label: "Title" },
      { kind: "markdown", key: "text", label: "Text" },
      {
        kind: "select",
        key: "alignment",
        label: "Alignment",
        options: [
          { label: "Left", value: "left" },
          { label: "Center", value: "center" }
        ]
      },
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
  normalize(raw: unknown): TextCard {
    if (!isRecord(raw)) {
      return { id: createId("card"), type: "text", title: "Untitled", text: "" };
    }
    const id =
      typeof raw.id === "string" && raw.id.trim().length > 0
        ? raw.id.trim()
        : createId("card");
    return {
      id,
      type: "text",
      title: typeof raw.title === "string" ? raw.title : "Untitled",
      text: typeof raw.text === "string" ? raw.text : "",
      alignment: (raw.alignment === "left" || raw.alignment === "center") ? raw.alignment : "center",
      backgroundColor:
        typeof raw.backgroundColor === "string" ? raw.backgroundColor : undefined,
      textColor: typeof raw.textColor === "string" ? raw.textColor : undefined,
      width: typeof raw.width === "number" ? raw.width : 1
    };
  },
  createView(ctx: CardViewContext): CardView<TextCard> {
    const box = document.createElement("div");
    box.className = "card-grid-card";
    box.style.padding = "0";
    box.style.overflow = "hidden";
    box.style.display = "flex";
    box.style.flexDirection = "column";

    const titleEl = box.createEl("h4");
    titleEl.style.margin = "0";
    titleEl.style.padding = "10px";

    const textEl = box.createDiv("card-text");
    textEl.style.padding = "10px";

    async function renderMarkdown(el: HTMLElement, markdown: string) {
      el.empty();
      await MarkdownRenderer.render(ctx.app, markdown || " ", el, ctx.sourcePath, ctx.plugin);
    }

    return {
      el: box,
      update(card: TextCard, viewCtx: CardViewContext) {
        box.style.setProperty('--card-width', String(card.width || 1));
        box.dataset.widthFraction = String(card.width || 1);
        box.dataset.cardId = card.id;

        box.style.border = `2px solid ${card.backgroundColor || "#ccc"}`;
        titleEl.style.color = card.textColor || "#000000";
        titleEl.style.backgroundColor = card.backgroundColor || "transparent";

        // Apply Alignment
        box.style.textAlign = card.alignment === "left" ? "left" : "center";
        if (card.alignment === "left") {
          titleEl.style.alignItems = "flex-start";
        } else {
        }

        void renderMarkdown(titleEl, card.title || "Untitled");

        // Text body renders as Markdown preview only (editing happens in a modal).
        void renderMarkdown(textEl, card.text || "");
      }
    };
  }
};
