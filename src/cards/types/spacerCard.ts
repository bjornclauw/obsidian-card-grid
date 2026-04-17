import type { CardInstance } from "../../domain/types";
import type { CardTypeDefinition, CardView, CardViewContext } from "../registry";
import { createId } from "../../domain/codec";

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

export interface SpacerCard extends CardInstance {
    type: "spacer";
}

export const spacerCardType: CardTypeDefinition<SpacerCard> = {
    type: "spacer",
    displayName: "Spacer card",
    editor: {
        title: "Edit spacer",
        fields: [
            {
                kind: "number",
                key: "width",
                label: "Width (columns)",
                defaultValue: 1
            }
        ]
    },
    normalize(raw: unknown): SpacerCard {
        if (!isRecord(raw)) {
            return { id: createId("card"), type: "spacer" };
        }
        const id =
            typeof raw.id === "string" && raw.id.trim().length > 0
                ? raw.id.trim()
                : createId("card");
        return {
            id,
            type: "spacer",
            width: typeof raw.width === "number" ? raw.width : 1
        };
    },
    createView(ctx: CardViewContext): CardView<SpacerCard> {
        const box = document.createElement("div");
        box.className = "card-grid-spacer";
        box.addClass("card-grid-spacer-print-hide");

        return {
            el: box,
            update(card: SpacerCard) {
                box.style.setProperty('--card-width', String(card.width || 1));
                box.dataset.widthFraction = String(card.width || 1);
                box.dataset.cardId = card.id;
                // Spacer doesn't need updates, just stays empty
            }
        };
    }
};