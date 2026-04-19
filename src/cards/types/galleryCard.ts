import { TFile } from "obsidian";
import type { GalleryCard } from "../../domain/types";
import type { CardTypeDefinition, CardView, CardViewContext } from "../registry";
import { createId } from "../../domain/codec";
import { applyImageStyle } from "../shared/imageStyle";

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

export const galleryCardType: CardTypeDefinition<GalleryCard> = {
    type: "galleryCard",
    displayName: "Gallery card",
    description: "Visual-first card optimized for displaying high-quality images and photographs.",
    editor: {
        title: "Edit gallery card",
        fields: [
            // Content
            { kind: "toggle", key: "imageEnabled", label: "Show image", defaultValue: true },
            { kind: "image-file", key: "image", label: "Image" },

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
                defaultValue: "var(--background-modifier-border)"
            }
        ]
    },
    normalize(raw: unknown): GalleryCard {
        if (!isRecord(raw)) {
            return { id: createId("card"), type: "galleryCard" };
        }
        const id =
            typeof raw.id === "string" && raw.id.trim().length > 0
                ? raw.id.trim()
                : createId("card");
        return {
            id,
            type: "galleryCard",
            backgroundColor:
                typeof raw.backgroundColor === "string" ? raw.backgroundColor : undefined,
            image: typeof raw.image === "string" ? raw.image : undefined,
            imageEnabled: typeof raw.imageEnabled === "boolean" ? raw.imageEnabled : undefined,
            imageFit: (typeof raw.imageFit === "string" ? raw.imageFit : undefined) as GalleryCard["imageFit"],
            imageHeight: typeof raw.imageHeight === "number" ? raw.imageHeight : undefined,
            imagePosition: typeof raw.imagePosition === "string" ? raw.imagePosition : undefined,
            imageRadius: typeof raw.imageRadius === "number" ? raw.imageRadius : undefined,
            width: typeof raw.width === "number" ? raw.width : 1
        };
    },
    createView(ctx: CardViewContext): CardView<GalleryCard> {
        const box = document.createElement("div");
        box.className = "card-grid-card card-type-galleryCard";
        box.style.padding = "0";
        box.style.overflow = "hidden";

        const img = box.createEl("img");

        function resolveImagePath(path: string): string {
            const file = ctx.app.vault.getAbstractFileByPath(path);
            if (file instanceof TFile) {
                return ctx.app.vault.getResourcePath(file);
            }
            return path;
        }

        return {
            el: box,
            update(card: GalleryCard, viewCtx: CardViewContext) {
                box.style.setProperty('--card-width', String(card.width || 1));
                box.dataset.widthFraction = String(card.width || 1);
                box.dataset.cardId = card.id;
                box.style.border = `2px solid ${card.backgroundColor || "var(--background-modifier-border)"}`;

                const enabled = card.imageEnabled !== false;
                if (enabled && card.image) {
                    img.style.display = "";
                    img.src = resolveImagePath(card.image);
                    applyImageStyle(img, card, viewCtx.grid);
                } else {
                    img.style.display = "none";
                }
            }
        };
    }
};