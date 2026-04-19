import { MarkdownRenderer, TFile, setIcon } from "obsidian";
import type { ProcedureCard } from "../../domain/types";
import type { CardTypeDefinition, CardView, CardViewContext } from "../registry";
import { createId } from "../../domain/codec";
import { applyImageStyle } from "../shared/imageStyle";

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

export const procedureCardType: CardTypeDefinition<ProcedureCard> = {
    type: "procedureCard",
    displayName: "Procedure card",
    description: "Step-by-step workflow card with side-by-side text and media.",
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
    normalize(raw: unknown): ProcedureCard {
        if (!isRecord(raw)) {
            return { id: createId("card"), type: "procedureCard", title: "Untitled", text: "" };
        }
        const id =
            typeof raw.id === "string" && raw.id.trim().length > 0
                ? raw.id.trim()
                : createId("card");
        return {
            id,
            type: "procedureCard",
            title: typeof raw.title === "string" ? raw.title : "Untitled",
            text: typeof raw.text === "string" ? raw.text : "",
            backgroundColor:
                typeof raw.backgroundColor === "string" ? raw.backgroundColor : undefined,
            textColor: typeof raw.textColor === "string" ? raw.textColor : undefined,
            image: typeof raw.image === "string" ? raw.image : undefined,
            imageEnabled: typeof raw.imageEnabled === "boolean" ? raw.imageEnabled : undefined,
            imageFit: (typeof raw.imageFit === "string" ? raw.imageFit : undefined) as ProcedureCard["imageFit"],
            imageHeight: typeof raw.imageHeight === "number" ? Math.max(0, raw.imageHeight) : undefined,
            imagePosition: typeof raw.imagePosition === "string" ? raw.imagePosition : undefined,
            imageRadius: typeof raw.imageRadius === "number" ? Math.max(0, raw.imageRadius) : undefined,
            width: typeof raw.width === "number" ? Math.max(0.1, raw.width) : 1,
            arrows: Array.isArray((raw as any).arrows)
                ? (raw as any).arrows.map((a: any) => ({
                    id: typeof a.id === "string" ? a.id : createId("arrow"),
                    x: typeof a.x === "number" ? a.x : 50,
                    y: typeof a.y === "number" ? a.y : 50,
                    rotation: typeof a.rotation === "number" ? a.rotation : 0
                }))
                : undefined
        };
    },
    createView(ctx: CardViewContext): CardView<ProcedureCard> {
        const box = document.createElement("div");
        box.className = "card-grid-card card-type-procedureCard";

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
        imageBox.classList.add("procedure-image-container");
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

        const updateArrows = (card: ProcedureCard, arrowId: string, patch: Partial<{ x: number, y: number, rotation: number }>) => {
            if (!card.arrows) return;
            const newArrows = card.arrows.map(a => a.id === arrowId ? { ...a, ...patch } : a);
            if (ctx.controller) {
                ctx.controller.updateCardProperties(card.id, { arrows: newArrows });
            }
        };

        return {
            el: box,
            update(card: ProcedureCard, viewCtx: CardViewContext) {
                box.style.setProperty('--card-width', String(card.width || 1));
                box.dataset.widthFraction = String(card.width || 1);
                box.dataset.cardId = card.id;
                box.style.border = `2px solid ${card.backgroundColor || "var(--background-modifier-border)"}`;

                // Interactive Annotation: Right-click anywhere on the image area to add a new arrow.
                // This provides precise placement and bypasses the editor UI limitation.
                imageBox.oncontextmenu = (e: MouseEvent) => {
                    if ((e.target as HTMLElement).closest(".procedure-arrow-marker")) return;
                    e.preventDefault();
                    e.stopPropagation();
                    const rect = imageBox.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    const newArrows = [...(card.arrows || []), { id: createId("arrow"), x, y, rotation: 0 }];
                    if (ctx.controller) ctx.controller.updateCardProperties(card.id, { arrows: newArrows });
                };

                titleBox.style.backgroundColor = card.backgroundColor || "var(--background-modifier-border)";
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

                    // Clear existing arrows
                    imageBox.querySelectorAll(".procedure-arrow-marker").forEach(el => el.remove());

                    // Render arrows
                    if (card.arrows) {
                        card.arrows.forEach(arrow => {
                            const marker = imageBox.createDiv("procedure-arrow-marker");
                            marker.style.setProperty("--arrow-x", String(arrow.x));
                            marker.style.setProperty("--arrow-y", String(arrow.y));
                            marker.style.setProperty("--arrow-rotation", String(arrow.rotation));

                            setIcon(marker, "arrow-right");

                            const handle = marker.createDiv("procedure-rotation-handle");

                            // Dragging logic
                            marker.addEventListener("mousedown", (e: MouseEvent) => {
                                if (e.target === handle) return;
                                e.preventDefault();
                                e.stopPropagation();

                                const startX = e.clientX;
                                const startY = e.clientY;
                                const rect = imageBox.getBoundingClientRect();
                                const startXPercent = arrow.x;
                                const startYPercent = arrow.y;

                                const onMouseMove = (moveEvent: MouseEvent) => {
                                    const deltaX = ((moveEvent.clientX - startX) / rect.width) * 100;
                                    const deltaY = ((moveEvent.clientY - startY) / rect.height) * 100;

                                    const newX = Math.max(0, Math.min(100, startXPercent + deltaX));
                                    const newY = Math.max(0, Math.min(100, startYPercent + deltaY));

                                    marker.style.setProperty("--arrow-x", String(newX));
                                    marker.style.setProperty("--arrow-y", String(newY));
                                };

                                const onMouseUp = () => {
                                    window.removeEventListener("mousemove", onMouseMove);
                                    window.removeEventListener("mouseup", onMouseUp);

                                    const finalX = parseFloat(marker.style.getPropertyValue("--arrow-x"));
                                    const finalY = parseFloat(marker.style.getPropertyValue("--arrow-y"));
                                    updateArrows(card, arrow.id, { x: finalX, y: finalY });
                                };

                                window.addEventListener("mousemove", onMouseMove);
                                window.addEventListener("mouseup", onMouseUp);
                            });

                            // Rotation logic
                            handle.addEventListener("mousedown", (e: MouseEvent) => {
                                e.preventDefault();
                                e.stopPropagation();

                                const rect = marker.getBoundingClientRect();
                                const centerX = rect.left + rect.width / 2;
                                const centerY = rect.top + rect.height / 2;

                                const onMouseMove = (moveEvent: MouseEvent) => {
                                    const angle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
                                    const rotation = (angle * 180) / Math.PI;
                                    marker.style.setProperty("--arrow-rotation", String(rotation));
                                };

                                const onMouseUp = () => {
                                    window.removeEventListener("mousemove", onMouseMove);
                                    window.removeEventListener("mouseup", onMouseUp);

                                    const finalRotation = parseFloat(marker.style.getPropertyValue("--arrow-rotation"));
                                    updateArrows(card, arrow.id, { rotation: finalRotation });
                                };

                                window.addEventListener("mousemove", onMouseMove);
                                window.addEventListener("mouseup", onMouseUp);
                            });

                            // Context menu for deletion
                            marker.addEventListener("contextmenu", (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (card.arrows && ctx.controller) {
                                    const newArrows = card.arrows.filter(a => a.id !== arrow.id);
                                    ctx.controller.updateCardProperties(card.id, { arrows: newArrows });
                                }
                            });
                        });
                    }

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