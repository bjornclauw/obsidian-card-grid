import { MarkdownRenderer, setIcon } from "obsidian";
import type { IconCard } from "../../domain/types";
import type { CardTypeDefinition, CardView, CardViewContext } from "../registry";
import { createId } from "../../domain/codec";

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

export const iconCardType: CardTypeDefinition<IconCard> = {
    type: "iconCard",
    displayName: "Icon card",
    description: "Small card for shortcuts, links, or status indicators using Lucide icons.",
    editor: {
        title: "Edit icon card",
        fields: [
            {
                kind: "select",
                key: "icon",
                label: "Icon",
                options: [
                    { label: "Arrow Right (→)", value: "arrow-right" },
                    { label: "Arrow Left (←)", value: "arrow-left" },
                    { label: "Arrow Up (↑)", value: "arrow-up" },
                    { label: "Arrow Down (↓)", value: "arrow-down" },
                    { label: "Double Arrow Right (»)", value: "chevrons-right" },
                    { label: "Double Arrow Left («)", value: "chevrons-left" },
                    { label: "Chevrons Up", value: "chevrons-up" },
                    { label: "Chevrons Down", value: "chevrons-down" },
                    { label: "Check", value: "check" },
                    { label: "Alert", value: "alert-triangle" },
                    { label: "Info", value: "info" },
                    { label: "Help", value: "help-circle" },
                    { label: "Plus", value: "plus" },
                    { label: "Minus", value: "minus" },
                    { label: "Star", value: "star" },
                    { label: "Heart", value: "heart" },
                    { label: "Link", value: "link" },
                    { label: "External Link", value: "external-link" },
                    { label: "Search", value: "search" },
                    { label: "Settings", value: "settings" },
                    { label: "File", value: "file" },
                    { label: "Folder", value: "folder" },
                    { label: "Refresh", value: "refresh-cw" },
                    { label: "Play", value: "play" }
                ],
                defaultValue: "arrow-right"
            },
            { kind: "markdown", key: "text", label: "Text (Optional)" },
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
            { kind: "number", key: "iconSize", label: "Icon size (px)", defaultValue: 48 },
            { kind: "number", key: "textSize", label: "Text size (px)", defaultValue: 14 },
            { kind: "number", key: "width", label: "Width (columns)", defaultValue: 1 },
            { kind: "color", key: "backgroundColor", label: "Background color", defaultValue: "transparent" },
            { kind: "color", key: "iconColor", label: "Icon color", defaultValue: "var(--text-normal)" },
            { kind: "color", key: "textColor", label: "Text color", defaultValue: "var(--text-normal)" }
        ]
    },
    normalize(raw: unknown): IconCard {
        if (!isRecord(raw)) {
            return { id: createId("card"), type: "iconCard", icon: "arrow-right" };
        }
        return {
            id: typeof raw.id === "string" ? raw.id : createId("card"),
            type: "iconCard",
            icon: typeof raw.icon === "string" ? raw.icon : "arrow-right",
            text: typeof raw.text === "string" ? raw.text : "",
            alignment: (raw.alignment === "left" || raw.alignment === "center" || raw.alignment === "right") ? raw.alignment : "center",
            iconSize: typeof raw.iconSize === "number" ? Math.max(1, raw.iconSize) : 48,
            textSize: typeof raw.textSize === "number" ? Math.max(1, raw.textSize) : 14,
            iconColor: typeof raw.iconColor === "string" ? raw.iconColor : "var(--text-normal)",
            backgroundColor: typeof raw.backgroundColor === "string" ? raw.backgroundColor : "transparent",
            textColor: typeof raw.textColor === "string" ? raw.textColor : "var(--text-normal)",
            width: typeof raw.width === "number" ? Math.max(0.1, raw.width) : 1,
            imageHeight: typeof raw.imageHeight === "number" ? Math.max(0, raw.imageHeight) : undefined
        };
    },
    createView(ctx: CardViewContext): CardView<IconCard> {
        const box = document.createElement("div");
        box.className = "card-grid-card card-type-iconCard";

        box.style.display = "flex";
        box.style.flexDirection = "column";
        box.style.justifyContent = "center";
        box.style.alignItems = "center";
        box.style.padding = "20px";

        const iconContainer = box.createDiv("icon-container");
        const textEl = box.createDiv("icon-text");
        textEl.style.marginTop = "10px";

        async function renderMarkdown(el: HTMLElement, markdown: string) {
            el.empty();
            if (!markdown) return;
            await MarkdownRenderer.render(ctx.app, markdown, el, ctx.sourcePath, ctx.plugin);
        }

        return {
            el: box,
            update(card: IconCard) {
                box.style.setProperty('--card-width', String(card.width || 1));
                box.dataset.widthFraction = String(card.width || 1);
                box.dataset.cardId = card.id;

                box.style.backgroundColor = card.backgroundColor || "transparent";
                box.style.color = card.textColor || "var(--text-normal)";

                // Apply Alignment
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

                // Update Icon
                iconContainer.empty();
                if (card.icon) {
                    setIcon(iconContainer, card.icon);
                    const svg = iconContainer.querySelector("svg");
                    if (svg) {
                        svg.style.width = `${card.iconSize || 48}px`;
                        svg.style.height = `${card.iconSize || 48}px`;
                        svg.style.stroke = card.iconColor || card.textColor || "var(--text-normal)";
                    }
                }

                // Update Text
                textEl.style.fontSize = `${card.textSize || 14}px`;
                void renderMarkdown(textEl, card.text || "");
            }
        };
    }
};