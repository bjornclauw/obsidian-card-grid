import { MarkdownRenderer, TFile } from "obsidian";
import type { HorizontalFlashCard } from "../../domain/types";
import type { CardTypeDefinition, CardView, CardViewContext } from "../registry";
import { createId } from "../../domain/codec";
import { applyImageStyle } from "../shared/imageStyle";

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

export const horizontalFlashCardType: CardTypeDefinition<HorizontalFlashCard> = {
    type: "horizontalFlashCard",
    displayName: "Horizontal Flash card",
    description: "Side-by-side layout with an image on one side and content on the other.",
    editor: {
        title: "Edit horizontal flash card",
        fields: [
            { kind: "text", key: "title", label: "Title" },
            { kind: "toggle", key: "titleEnabled", label: "Show title", defaultValue: true },
            { kind: "markdown", key: "text", label: "Text" },
            { kind: "image-file", key: "image", label: "Image" },
            { kind: "toggle", key: "imageEnabled", label: "Show image", defaultValue: true },
            {
                kind: "select",
                key: "imageSide",
                label: "Image side",
                options: [
                    { label: "Left", value: "left" },
                    { label: "Right", value: "right" }
                ],
                defaultValue: "left"
            },
            {
                kind: "select",
                key: "alignment",
                label: "Text alignment",
                options: [
                    { label: "Left", value: "left" },
                    { label: "Center", value: "center" },
                    { label: "Right", value: "right" }
                ],
                defaultValue: "center"
            },
            { kind: "number", key: "width", label: "Width (columns)", defaultValue: 1 },
            { kind: "number", key: "imageHeight", label: "Image height", min: 0, step: 10 },
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
            { kind: "number", key: "imageRadius", label: "Image radius", min: 0, step: 1 },
            { kind: "color", key: "backgroundColor", label: "Border/Header color", defaultValue: "var(--background-modifier-border)" },
            { kind: "color", key: "textColor", label: "Title color", defaultValue: "var(--text-normal)" }
        ]
    },
    normalize(raw: unknown): HorizontalFlashCard {
        if (!isRecord(raw)) {
            return { id: createId("card"), type: "horizontalFlashCard", title: "Untitled", text: "" };
        }
        const id = typeof raw.id === "string" ? raw.id : createId("card");
        return {
            id,
            type: "horizontalFlashCard",
            title: typeof raw.title === "string" ? raw.title : "Untitled",
            text: typeof raw.text === "string" ? raw.text : "",
            titleEnabled: typeof raw.titleEnabled === "boolean" ? raw.titleEnabled : undefined,
            backgroundColor: typeof raw.backgroundColor === "string" ? raw.backgroundColor : undefined,
            textColor: typeof raw.textColor === "string" ? raw.textColor : undefined,
            image: typeof raw.image === "string" ? raw.image : undefined,
            imageEnabled: typeof raw.imageEnabled === "boolean" ? raw.imageEnabled : undefined,
            imageSide: (raw.imageSide === "left" || raw.imageSide === "right") ? raw.imageSide : "left",
            alignment: (raw.alignment === "left" || raw.alignment === "center" || raw.alignment === "right") ? raw.alignment : "center",
            imageFit: (typeof raw.imageFit === "string" ? raw.imageFit : undefined) as HorizontalFlashCard["imageFit"],
            imageHeight: typeof raw.imageHeight === "number" ? raw.imageHeight : undefined,
            imagePosition: typeof raw.imagePosition === "string" ? raw.imagePosition : undefined,
            imageRadius: typeof raw.imageRadius === "number" ? raw.imageRadius : undefined,
            width: typeof raw.width === "number" ? raw.width : 1
        };
    },
    createView(ctx: CardViewContext): CardView<HorizontalFlashCard> {
        const box = document.createElement("div");
        box.className = "card-grid-card card-type-horizontalFlashCard";

        const imageBox = box.createDiv("flash-image-box");
        const img = imageBox.createEl("img");

        const textBox = box.createDiv("flash-text-box");
        const titleEl = textBox.createEl("h4");
        const textEl = textBox.createDiv("card-text");

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
            update(card: HorizontalFlashCard, viewCtx: CardViewContext) {
                box.style.setProperty("--card-width", String(card.width || 1));
                box.dataset.widthFraction = String(card.width || 1);
                box.dataset.cardId = card.id;
                box.style.border = `2px solid ${card.backgroundColor || "var(--background-modifier-border)"}`;
                box.style.flexDirection = card.imageSide === "right" ? "row-reverse" : "row";
                const h = card.imageHeight ?? viewCtx.grid.imageHeight;

                // Text Block Styling
                textBox.style.textAlign = card.alignment || "center";
                textBox.style.alignItems = card.alignment === "left" ? "flex-start" : card.alignment === "right" ? "flex-end" : "center";

                titleEl.style.display = card.titleEnabled !== false ? "" : "none";
                titleEl.style.color = card.textColor || "var(--text-normal)";
                titleEl.style.backgroundColor = card.backgroundColor || "transparent";
                titleEl.style.width = "100%";
                titleEl.style.boxSizing = "border-box";

                if (card.imageEnabled !== false && card.image) {
                    imageBox.style.display = "flex";
                    imageBox.style.minHeight = h ? `${h}px` : "0px";

                    img.src = resolveImagePath(card.image);
                    applyImageStyle(img, card as any, viewCtx.grid);

                    img.style.position = "absolute";
                    img.style.top = "0";
                    img.style.left = "0";
                    img.style.height = "100%";
                    img.style.width = "100%";
                    img.style.minHeight = "0";
                    img.style.maxHeight = "none";
                    img.style.objectFit = card.imageFit || viewCtx.grid.imageFit || "cover";
                    img.style.objectPosition = card.imagePosition || viewCtx.grid.imagePosition || "center";
                } else {
                    imageBox.style.display = "none";
                    imageBox.style.minHeight = "0px";
                }

                void renderMarkdown(titleEl, card.title || "Untitled");
                void renderMarkdown(textEl, card.text || "");
            }
        };
    }
};