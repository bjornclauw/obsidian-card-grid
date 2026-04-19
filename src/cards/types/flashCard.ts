import { MarkdownRenderer, TFile } from "obsidian";
import type { FlashCard } from "../../domain/types";
import type { CardTypeDefinition, CardView, CardViewContext } from "../registry";
import { createId } from "../../domain/codec";
import { applyImageStyle } from "../shared/imageStyle";

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

export const flashCardType: CardTypeDefinition<FlashCard> = {
    type: "flashcard",
    displayName: "Flash card",

    editor: {
        title: "Edit flash card",
        fields: [
            // Primary
            { kind: "text", key: "title", label: "Title" },
            { kind: "toggle", key: "titleEnabled", label: "Show title", defaultValue: true },
            { kind: "markdown", key: "text", label: "Text" },

            // Image Controls
            { kind: "image-file", key: "image", label: "Image" },
            { kind: "toggle", key: "imageEnabled", label: "Show image", defaultValue: true },

            // Layout
            { kind: "number", key: "width", label: "Width (columns)", defaultValue: 1 },
            { kind: "number", key: "imageHeight", label: "Image height", min: 0, step: 10 },

            // Styling
            {
                kind: "select",
                key: "imageFit",
                label: "Image fit",
                options: [
                    { label: "Cover", value: "cover" },
                    { label: "Contain", value: "contain" },
                    { label: "Stretch", value: "fill" },
                    { label: "None", value: "none" }
                ]
            },
            {
                kind: "select",
                key: "imagePosition",
                label: "Image position",
                options: [
                    { label: "Center", value: "center" },
                    { label: "Top", value: "top" },
                    { label: "Bottom", value: "bottom" },
                    { label: "Left", value: "left" },
                    { label: "Right", value: "right" }
                ]
            },
            { kind: "number", key: "imageRadius", label: "Image radius", min: 0, step: 1 },
            {
                kind: "color",
                key: "backgroundColor",
                label: "Border color",
                defaultValue: "var(--background-modifier-border)"
            },
            {
                kind: "color",
                key: "textColor",
                label: "Title color",
                defaultValue: "var(--text-normal)"
            }
        ]
    },

    normalize(raw: unknown): FlashCard {
        if (!isRecord(raw)) {
            return { id: createId("card"), type: "flashcard", title: "Untitled", text: "" };
        }

        const id =
            typeof raw.id === "string" && raw.id.trim().length > 0
                ? raw.id.trim()
                : createId("card");

        return {
            id,
            type: "flashcard",
            title: typeof raw.title === "string" ? raw.title : "Untitled",
            text: typeof raw.text === "string" ? raw.text : "",
            titleEnabled: typeof raw.titleEnabled === "boolean" ? raw.titleEnabled : undefined,
            backgroundColor: typeof raw.backgroundColor === "string" ? raw.backgroundColor : undefined,
            textColor: typeof raw.textColor === "string" ? raw.textColor : undefined,
            image: typeof raw.image === "string" ? raw.image : undefined,
            imageEnabled: typeof raw.imageEnabled === "boolean" ? raw.imageEnabled : undefined,
            imageFit: (typeof raw.imageFit === "string" ? raw.imageFit : undefined) as FlashCard["imageFit"],
            imageHeight: typeof raw.imageHeight === "number" ? raw.imageHeight : undefined,
            imagePosition: typeof raw.imagePosition === "string" ? raw.imagePosition : undefined,
            imageRadius: typeof raw.imageRadius === "number" ? raw.imageRadius : undefined,
            width: typeof raw.width === "number" ? raw.width : 1
        };
    },

    createView(ctx: CardViewContext): CardView<FlashCard> {
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
            update(card: FlashCard, viewCtx: CardViewContext) {
                box.style.setProperty("--card-width", String(card.width || 1));
                box.dataset.widthFraction = String(card.width || 1);
                box.dataset.cardId = card.id;

                box.style.border = `2px solid ${card.backgroundColor || "var(--background-modifier-border)"}`;

                const enabled = card.imageEnabled !== false;

                if (enabled && card.image) {
                    img.style.display = "";
                    img.src = resolveImagePath(card.image);

                    applyImageStyle(img, card as any, viewCtx.grid);

                    const h = card.imageHeight ?? viewCtx.grid.imageHeight;
                    img.style.height = h ? `${h}px` : "auto";
                    img.style.objectFit = card.imageFit || viewCtx.grid.imageFit || "cover";
                } else {
                    img.style.display = "none";
                }

                titleEl.style.display = card.titleEnabled !== false ? "" : "none";

                titleEl.style.color = card.textColor || "var(--text-normal)";
                titleEl.style.backgroundColor = card.backgroundColor || "transparent";

                void renderMarkdown(titleEl, card.title || "Untitled");
                void renderMarkdown(textEl, card.text || "");
            }
        };
    }
};