import { MarkdownRenderer } from "obsidian";
import type { NotifierCard } from "./types";
import type { CardTypeDefinition, CardView, CardViewContext } from "../cards/registry";
import { createId } from "./codec";

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

export const notifierCardType: CardTypeDefinition<NotifierCard> = {
    type: "notifier",
    displayName: "Notifier card",
    editor: {
        title: "Edit notifier card",
        fields: [
            { kind: "text", key: "title", label: "Title" },
            { kind: "markdown", key: "text", label: "Text" },
            {
                kind: "select",
                key: "icon",
                label: "Icon",
                options: [
                    { label: "Warning (⚠️)", value: "⚠️" },
                    { label: "Info (ℹ️)", value: "ℹ️" },
                    { label: "Check (✅)", value: "✅" },
                    { label: "Error (❌)", value: "❌" },
                    { label: "Bell (🔔)", value: "🔔" },
                    { label: "Lightbulb (💡)", value: "💡" },
                    { label: "Stop (🛑)", value: "🛑" },
                    { label: "None", value: "" }
                ]
            },
            {
                kind: "select",
                key: "alignment",
                label: "Alignment",
                options: [
                    { label: "Top Left", value: "top-left" },
                    { label: "Top Center", value: "top-center" }
                ]
            },
            { kind: "number", key: "titleSize", label: "Title size (px)", defaultValue: 28 },
            { kind: "number", key: "textSize", label: "Text size (px)", defaultValue: 16 },
            { kind: "color", key: "backgroundColor", label: "Background color", defaultValue: "#1a237e" },
            { kind: "color", key: "textColor", label: "Text color", defaultValue: "#ffffff" },
            { kind: "number", key: "width", label: "Width (columns)", defaultValue: 1 }
        ]
    },
    normalize(raw: unknown): NotifierCard {
        if (!isRecord(raw)) {
            return { id: createId("card"), type: "notifier", title: "Notification", text: "" };
        }
        const id = typeof raw.id === "string" ? raw.id : createId("card");
        return {
            id,
            type: "notifier",
            title: typeof raw.title === "string" ? raw.title : "Notification",
            text: typeof raw.text === "string" ? raw.text : "",
            icon: typeof raw.icon === "string" ? raw.icon : "⚠️",
            alignment: (raw.alignment === "top-left" || raw.alignment === "top-center") ? raw.alignment : "top-center",
            titleSize: typeof raw.titleSize === "number" ? raw.titleSize : 28,
            textSize: typeof raw.textSize === "number" ? raw.textSize : 16,
            backgroundColor: typeof raw.backgroundColor === "string" ? raw.backgroundColor : "#1a237e",
            textColor: typeof raw.textColor === "string" ? raw.textColor : "#ffffff",
            width: typeof raw.width === "number" ? raw.width : 1
        };
    },
    createView(ctx: CardViewContext): CardView<NotifierCard> {
        const box = document.createElement("div");
        box.className = "card-grid-card card-type-notifier";

        // Setup internal layout
        box.style.display = "flex";
        box.style.flexDirection = "column";
        box.style.padding = "30px";

        const titleEl = box.createEl("h2");
        titleEl.style.margin = "0 0 10px 0";
        titleEl.style.lineHeight = "1.2";

        const textEl = box.createDiv("notifier-text");
        textEl.style.margin = "0";
        textEl.style.opacity = "0.95";

        async function renderMarkdown(el: HTMLElement, markdown: string) {
            el.empty();
            await MarkdownRenderer.render(ctx.app, markdown || " ", el, ctx.sourcePath, ctx.plugin);
        }

        return {
            el: box,
            update(card: NotifierCard) {
                box.style.setProperty('--card-width', String(card.width || 1));
                box.dataset.widthFraction = String(card.width || 1);
                box.dataset.cardId = card.id;

                // Apply Colors
                box.style.backgroundColor = card.backgroundColor || "#1a237e";
                box.style.color = card.textColor || "#ffffff";
                titleEl.style.color = card.textColor || "#ffffff";

                // Apply Alignment
                if (card.alignment === "top-left") {
                    box.style.textAlign = "left";
                    box.style.alignItems = "flex-start";
                } else {
                    box.style.textAlign = "center";
                    box.style.alignItems = "center";
                }

                // Apply Sizes
                titleEl.style.fontSize = `${card.titleSize || 28}px`;
                textEl.style.fontSize = `${card.textSize || 16}px`;

                // Render Content
                const fullTitle = card.icon ? `${card.icon} ${card.title}` : (card.title || "");
                titleEl.setText(fullTitle);

                void renderMarkdown(textEl, card.text || "");
            }
        };
    }
};