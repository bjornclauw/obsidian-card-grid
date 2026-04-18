import { MarkdownRenderer, TFile } from "obsidian";
import type { ProcedureCard } from "../../domain/types";
import type { CardTypeDefinition, CardView, CardViewContext } from "../registry";
import { createId } from "../../domain/codec";
import { applyImageStyle } from "../shared/imageStyle";

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

export const procedureCardType: CardTypeDefinition<ProcedureCard> = {
    type: "procedure",
    displayName: "Procedure card",
    editor: {
        title: "Edit procedure card",
        fields: [
            // Group 1: Primary Content
            { kind: "text", key: "title", label: "Title" },
            { kind: "markdown", key: "text", label: "Text" },
            { kind: "toggle", key: "imageEnabled", label: "Show image", defaultValue: true },
            { kind: "image-file", key: "image", label: "Image" },

            // Group 2: Layout
            { kind: "number", key: "width", label: "Width (columns)", defaultValue: 1 },
            { kind: "number", key: "imageHeight", label: "Image height", min: 0, step: 10 },

            // Group 3: Styling Overrides
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
            }
        ]
    },
    normalize(raw: unknown): ProcedureCard {
        if (!isRecord(raw)) {
            return { id: createId("card"), type: "procedure", title: "Untitled", text: "" };
        }
        const id =
            typeof raw.id === "string" && raw.id.trim().length > 0
                ? raw.id.trim()
                : createId("card");
        return {
            id,
            type: "procedure",
            title: typeof raw.title === "string" ? raw.title : "Untitled",
            text: typeof raw.text === "string" ? raw.text : "",
            backgroundColor:
                typeof raw.backgroundColor === "string" ? raw.backgroundColor : undefined,
            textColor: typeof raw.textColor === "string" ? raw.textColor : undefined,
            image: typeof raw.image === "string" ? raw.image : undefined,
            imageEnabled: typeof raw.imageEnabled === "boolean" ? raw.imageEnabled : undefined,
            imageFit: (typeof raw.imageFit === "string" ? raw.imageFit : undefined) as ProcedureCard["imageFit"],
            imageHeight: typeof raw.imageHeight === "number" ? raw.imageHeight : undefined,
            imagePosition: typeof raw.imagePosition === "string" ? raw.imagePosition : undefined,
            imageRadius: typeof raw.imageRadius === "number" ? raw.imageRadius : undefined,
            width: typeof raw.width === "number" ? raw.width : 1
        };
    },
    createView(ctx: CardViewContext): CardView<ProcedureCard> {
        const box = document.createElement("div");
        box.className = "card-grid-card card-type-procedure";

        // Setup horizontal flex layout
        box.style.display = "flex";
        box.style.flexDirection = "row";
        box.style.alignItems = "stretch";
        box.style.padding = "0";
        box.style.overflow = "hidden";

        const titleBox = box.createDiv("procedure-title-box");
        titleBox.style.flex = "0 0 24%";
        titleBox.style.padding = "10px";
        titleBox.style.borderRight = "1px solid var(--background-modifier-border)";
        titleBox.style.display = "flex";
        titleBox.style.alignItems = "flex-start";
        const titleEl = titleBox.createEl("h4");

        const textBox = box.createDiv("procedure-text-box");
        textBox.style.flex = "1";
        textBox.style.padding = "10px";

        const imageBox = box.createDiv("procedure-image-box");
        imageBox.style.flex = "0 0 38%";
        imageBox.style.display = "flex";
        imageBox.style.position = "relative";
        imageBox.style.flexDirection = "column";
        imageBox.style.overflow = "hidden";
        const img = imageBox.createEl("img");

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
            update(card: ProcedureCard, viewCtx: CardViewContext) {
                box.style.setProperty('--card-width', String(card.width || 1));
                box.dataset.widthFraction = String(card.width || 1);
                box.dataset.cardId = card.id;
                box.style.border = `2px solid ${card.backgroundColor || "#ccc"}`;

                titleBox.style.backgroundColor = card.backgroundColor || "transparent";
                titleEl.style.color = card.textColor || "";
                void renderMarkdown(titleEl, card.title || "Untitled");


                void renderMarkdown(textBox, card.text || "");

                const h = card.imageHeight ?? viewCtx.grid.imageHeight;
                const enabled = card.imageEnabled !== false;
                if (enabled && card.image) {
                    textBox.style.borderRight = "1px solid var(--background-modifier-border)";
                    imageBox.style.display = "flex";
                    imageBox.style.minHeight = h ? `${h}px` : "0px";

                    img.src = resolveImagePath(card.image);
                    applyImageStyle(img, card as any, viewCtx.grid);

                    img.style.position = "absolute";
                    img.style.top = "0";
                    img.style.left = "0";
                    img.style.height = "100%";
                    img.style.width = "100%";
                    img.style.minHeight = "0"; // Override browser defaults
                    img.style.maxHeight = "none";
                    img.style.flex = "1 1 auto";
                    img.style.objectFit = card.imageFit || viewCtx.grid.imageFit || "cover";
                    img.style.objectPosition = card.imagePosition || viewCtx.grid.imagePosition || "center";
                } else {
                    textBox.style.borderRight = "none";
                    imageBox.style.display = "none";
                    imageBox.style.minHeight = "0px";
                    img.style.minHeight = "0px";
                }
            }
        };
    }

};