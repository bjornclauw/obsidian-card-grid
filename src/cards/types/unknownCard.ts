import type { UnknownCard } from "../../domain/types";
import type { CardTypeDefinition, CardView, CardViewContext } from "../registry";
import { createId } from "../../domain/codec";

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export const unknownCardType: CardTypeDefinition<UnknownCard> = {
  type: "unknown",
  displayName: "Unknown card",
  editor: {
    title: "Unknown card",
    fields: [
      {
        kind: "number",
        key: "width",
        label: "Width (columns)",
        defaultValue: 1 // Default to 1 column
      }
    ]
  },
  normalize(raw: unknown): UnknownCard {
    const obj = isRecord(raw) ? raw : {};
    const id =
      typeof obj.id === "string" && obj.id.trim().length > 0
        ? obj.id.trim()
        : createId("card");
    const type =
      typeof obj.type === "string" && obj.type.trim().length > 0
        ? obj.type.trim()
        : "unknown";
    return {
      id,
      type,
      raw: obj
    };
  },
  createView(ctx: CardViewContext): CardView<UnknownCard> {
    const box = document.createElement("div");
    box.className = "card-grid-card";
    const title = box.createEl("h4", { text: "Unknown card type" });
    const pre = box.createEl("pre");
    pre.style.whiteSpace = "pre-wrap";
    pre.style.textAlign = "left";

    return {
      el: box,
      update(card: UnknownCard, viewCtx: CardViewContext) {
        title.style.color = "#000000";
        box.style.border = "2px solid #ccc";
        title.setText(`Unknown card type: ${card.type}`);
        pre.textContent = JSON.stringify(card.raw, null, 2);
      }
    };
  }
};
