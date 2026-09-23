import { MarkdownRenderer } from "obsidian";
import type { BannerCard } from "../../domain/types";
import type { CardTypeDefinition, CardView, CardViewContext } from "../registry";
import { createId } from "../../domain/codec";

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

export const bannerCardType: CardTypeDefinition<BannerCard> = {
    type: "bannerCard",
    displayName: "Banner card",
    description: "Wide, high-visibility banner for alerts, headers, or important notices.",
    editor: {
        title: "Edit banner card",
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
                    { label: "Left", value: "left" },
                    { label: "Center", value: "center" },
                    { label: "Right", value: "right" }
                ]
            },
            { kind: "number", key: "titleSize", label: "Title size (px)", defaultValue: 28 },
            { kind: "number", key: "textSize", label: "Text size (px)", defaultValue: 16 },
            { kind: "color", key: "backgroundColor", label: "Background color", defaultValue: "var(--background-modifier-border)" },
            { kind: "color", key: "textColor", label: "Text color", defaultValue: "var(--text-normal)" },
            { kind: "number", key: "width", label: "Width (columns)", defaultValue: 1 }
        ]
    },
    normalize(raw: unknown): BannerCard {
        if (!isRecord(raw)) {
            return { id: createId("card"), type: "bannerCard", title: "Notification", text: "" };
        }
        const id = typeof raw.id === "string" ? raw.id : createId("card");
        return {
            id,
            type: "bannerCard",
            title: typeof raw.title === "string" ? raw.title : "Notification",
            text: typeof raw.text === "string" ? raw.text : "",
            icon: typeof raw.icon === "string" ? raw.icon : "⚠️",
            alignment: (raw.alignment === "left" || raw.alignment === "center" || raw.alignment === "right") ? raw.alignment : "center",
            titleSize: typeof raw.titleSize === "number" ? Math.max(1, raw.titleSize) : 28,
            textSize: typeof raw.textSize === "number" ? Math.max(1, raw.textSize) : 16,
            backgroundColor: typeof raw.backgroundColor === "string" ? raw.backgroundColor : "var(--background-modifier-border)",
            textColor: typeof raw.textColor === "string" ? raw.textColor : "var(--text-normal)",
            width: typeof raw.width === "number" ? Math.max(0.1, raw.width) : 1,
            imageHeight: typeof raw.imageHeight === "number" ? Math.max(0, raw.imageHeight) : undefined
        };
    },
    createView(ctx: CardViewContext): CardView<BannerCard> {
        const box = document.createElement("div");
        box.className = "card-grid-card card-type-bannerCard";

        box.style.display = "flex";
        box.style.flexDirection = "column";
        box.style.padding = "30px";

        const titleEl = box.createEl("h2");
        titleEl.addClass("card-title", "banner-title");
        titleEl.style.margin = "0 0 10px 0";
        titleEl.style.lineHeight = "1.2";

        const textEl = box.createDiv("banner-text");

        async function renderMarkdown(el: HTMLElement, markdown: string) {
            el.empty();
            await MarkdownRenderer.render(ctx.app, markdown || " ", el, ctx.sourcePath, ctx.plugin);
        }

        return {
            el: box,
            update(card: BannerCard) {
                box.style.setProperty('--card-width', String(card.width || 1));
                box.dataset.widthFraction = String(card.width || 1);
                box.dataset.cardId = card.id;
                const textColor = card.textColor || "var(--text-normal)";
                const titleSize =
                    typeof card.titleSize === "number" ? card.titleSize : 28;
                const textSize =
                    typeof card.textSize === "number" ? card.textSize : 16;

                box.style.backgroundColor = card.backgroundColor || "var(--background-modifier-border)";
                box.style.color = textColor;

                // Expose the text styling as CSS variables on the card root.
                // styles.css re-applies these with !important to the title and
                // body descendants, so the styling survives any external plugin
                // that rewrites or replaces the inner nodes.
                box.style.setProperty("--card-title-color", textColor);
                box.style.setProperty("--card-title-size", `${titleSize}px`);
                box.style.setProperty("--card-text-color", textColor);
                box.style.setProperty("--card-text-size", `${textSize}px`);

                titleEl.style.color = textColor;
                textEl.style.color = textColor;

                titleEl.style.fontSize = `${titleSize}px`;
                textEl.style.fontSize = `${textSize}px`;

                if (card.alignment === "left") {
                    box.style.textAlign = "left";
                    box.style.alignItems = "flex-start";
                } else if (card.alignment === "right") {
                    box.style.textAlign = "right";
                    box.style.alignItems = "flex-end";
                } else {
                    box.style.textAlign = "center";
                    box.style.alignItems = "center";
                }

                const fullTitle = card.icon ? `${card.icon} ${card.title}` : (card.title || "");
                void renderMarkdown(titleEl, fullTitle);
                void renderMarkdown(textEl, card.text || "");
            }
        };
    }
};