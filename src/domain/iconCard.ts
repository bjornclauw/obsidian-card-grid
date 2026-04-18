import { MarkdownRenderer, setIcon } from "obsidian";
import type { IconCard } from "./types";
import type { CardTypeDefinition, CardView, CardViewContext } from "../cards/registry";
import { createId } from "./codec";

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

export const iconCardType: CardTypeDefinition<IconCard> = {
    type: "icon",
    displayName: "Icon card",
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
            { kind: "number", key: "iconSize", label: "Icon size (px)", defaultValue: 48 },
            { kind: "number", key: "textSize", label: "Text size (px)", defaultValue: 14 },
            { kind: "color", key: "backgroundColor", label: "Background color", defaultValue: "transparent" },
            { kind: "color", key: "iconColor", label: "Icon color", defaultValue: "var(--text-normal)" },
            { kind: "color", key: "textColor", label: "Color", defaultValue: "var(--text-normal)" },
            { kind: "number", key: "width", label: "Width (columns)", defaultValue: 1 }
        ]
    },
    normalize(raw: unknown): IconCard {
        if (!isRecord(raw)) {
            return { id: createId("card"), type: "icon", icon: "arrow-right" };
        }
        return {
            id: typeof raw.id === "string" ? raw.id : createId("card"),
            type: "icon",
            icon: typeof raw.icon === "string" ? raw.icon : "arrow-right",
            text: typeof raw.text === "string" ? raw.text : "",
            iconSize: typeof raw.iconSize === "number" ? raw.iconSize : 48,
            textSize: typeof raw.textSize === "number" ? raw.textSize : 14,
            iconColor: typeof raw.iconColor === "string" ? raw.iconColor : undefined,
            backgroundColor: typeof raw.backgroundColor === "string" ? raw.backgroundColor : "transparent",
            textColor: typeof raw.textColor === "string" ? raw.textColor : "var(--text-normal)",
            width: typeof raw.width === "number" ? raw.width : 1
        };
    },
    createView(ctx: CardViewContext): CardView<IconCard> {
        const box = document.createElement("div");
        box.className = "card-grid-card card-type-icon";

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

                // Update Icon
                iconContainer.empty();
                if (card.icon) {
                    setIcon(iconContainer, card.icon);
                    const svg = iconContainer.querySelector("svg");
                    if (svg) {
                        svg.style.width = `${card.iconSize || 48}px`;
                        svg.style.height = `${card.iconSize || 48}px`;
                        svg.style.stroke = card.iconColor || card.textColor || "currentColor";
                    }
                }

                // Update Text
                textEl.style.fontSize = `${card.textSize || 14}px`;
                void renderMarkdown(textEl, card.text || "");
            }
        };
    }
};