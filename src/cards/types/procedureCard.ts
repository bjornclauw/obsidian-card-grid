import { MarkdownRenderer, TFile, setIcon } from "obsidian";
import type { ProcedureCard } from "../../domain/types";
import type { CardTypeDefinition, CardView, CardViewContext } from "../registry";
import { createId } from "../../domain/codec";
import { applyImageStyle } from "../shared/imageStyle";

// Module-level selection state shared across all view instances of the same card.
// This survives view recreation by the controller.
const selectedArrowIds = new Map<string, string | null>();

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
            { kind: "toggle", key: "annotationsEnabled", label: "Enable annotations", defaultValue: false },

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
            annotationsEnabled: typeof raw.annotationsEnabled === "boolean" ? raw.annotationsEnabled : false,
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
                    rotation: typeof a.rotation === "number" ? a.rotation : 0,
                    color: typeof a.color === "string" ? a.color : undefined
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
        const addArrowBtn = imageBox.createDiv("procedure-add-arrow-btn");
        setIcon(addArrowBtn, "plus-circle");

        // Track the currently selected arrow — stored in the module-level map so it
        // survives view recreation. Card id is available via box.dataset.cardId at runtime.
        const getSelected = (): string | null => selectedArrowIds.get(box.dataset.cardId ?? "") ?? null;
        const setSelected = (id: string | null): void => {
            selectedArrowIds.set(box.dataset.cardId ?? "", id);
        };

        // Track active global listeners for cleanup.
        const pendingCleanups = new Set<() => void>();

        // ── Image-rect-aware arrow positioning ──────────────────────────
        // Arrow x/y are stored as % of the image's NATURAL dimensions.
        // On render we convert to pixel offsets inside imageBox, accounting
        // for the current object-fit / object-position so they track the
        // exact content point even when the container aspect ratio changes.

        /**
         * Compute where the image content actually renders inside imageBox,
         * accounting for object-fit and object-position.
         */
        function getRenderedImageRect() {
            const nw = img.naturalWidth;
            const nh = img.naturalHeight;
            const cw = imageBox.clientWidth;
            const ch = imageBox.clientHeight;
            if (!nw || !nh || !cw || !ch) return { x: 0, y: 0, w: cw || 0, h: ch || 0 };

            const fit = img.style.objectFit || "cover";
            const ia = nw / nh, ca = cw / ch;
            let rw: number, rh: number;
            switch (fit) {
                case "contain":
                case "scale-down":
                    if (ia > ca) { rw = cw; rh = cw / ia; } else { rh = ch; rw = ch * ia; }
                    if (fit === "scale-down") { rw = Math.min(rw, nw); rh = Math.min(rh, nh); }
                    break;
                case "cover":
                    if (ia > ca) { rh = ch; rw = ch * ia; } else { rw = cw; rh = cw / ia; }
                    break;
                case "none": rw = nw; rh = nh; break;
                default: rw = cw; rh = ch; break; // fill
            }

            const pos = (img.style.objectPosition || "center center").trim().split(/\s+/);
            const p = (s: string) => {
                if (s === "left" || s === "top") return 0;
                if (s === "center") return 0.5;
                if (s === "right" || s === "bottom") return 1;
                if (s.endsWith("%")) return parseFloat(s) / 100;
                return 0.5;
            };
            return {
                x: (cw - rw) * p(pos[0]),
                y: (ch - rh) * p(pos[1] || "center"),
                w: rw, h: rh
            };
        }

        /** Set a marker's left/top in pixels from its data-img-x/y image-% coords */
        function positionMarker(marker: HTMLElement): void {
            const ix = parseFloat(marker.dataset.imgX || "50");
            const iy = parseFloat(marker.dataset.imgY || "50");
            const r = getRenderedImageRect();
            marker.style.left = `${r.x + (ix / 100) * r.w}px`;
            marker.style.top = `${r.y + (iy / 100) * r.h}px`;
        }

        function repositionAllArrows(): void {
            imageBox.querySelectorAll<HTMLElement>(".procedure-arrow-marker").forEach(positionMarker);
        }

        const resizeObserver = new ResizeObserver(() => repositionAllArrows());
        resizeObserver.observe(imageBox);
        img.addEventListener("load", () => repositionAllArrows());

        // ────────────────────────────────────────────────────────────────

        async function renderMarkdown(el: HTMLElement, markdown: string): Promise<void> {
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

        const updateArrows = (card: ProcedureCard, arrowId: string, patch: Partial<{ x: number, y: number, rotation: number, color: string }>) => {
            if (!card.arrows) return;
            const newArrows = card.arrows.map(a => a.id === arrowId ? { ...a, ...patch } : a);
            if (viewCtxRef.current?.controller) {
                viewCtxRef.current.controller.updateCardProperties(card.id, { arrows: newArrows });
            }
        };

        let suppressNextDeselect = false;
        const viewCtxRef: { current: CardViewContext | null } = { current: null };

        imageBox.addEventListener("click", (e) => {
            if (suppressNextDeselect) {
                suppressNextDeselect = false;
                return;
            }
            if ((e.target as HTMLElement).closest(".procedure-arrow-marker")) return;
            if (getSelected() !== null) {
                imageBox.querySelectorAll(".procedure-arrow-marker.is-active")
                    .forEach(el => el.classList.remove("is-active"));
                setSelected(null);
            }
        });

        return {
            el: box,
            update(card: ProcedureCard, viewCtx: CardViewContext) {
                viewCtxRef.current = viewCtx;
                box.style.setProperty('--card-width', String(card.width || 1));
                box.dataset.widthFraction = String(card.width || 1);
                box.dataset.cardId = card.id;
                box.style.border = `2px solid ${card.backgroundColor || "var(--background-modifier-border)"}`;

                // Interactive Annotation: Overlay button adds a new arrow at the center.
                imageBox.oncontextmenu = null;
                if (card.annotationsEnabled) {
                    addArrowBtn.style.display = "flex";
                    addArrowBtn.onclick = (e: MouseEvent) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Spawns a new arrow at the center of the image area
                        const newArrows = [...(card.arrows || []), { id: createId("arrow"), x: 50, y: 50, rotation: 0 }];
                        if (viewCtx.controller) viewCtx.controller.updateCardProperties(card.id, { arrows: newArrows });
                    };
                } else {
                    addArrowBtn.style.display = "none";
                    setSelected(null);
                }

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
                    if (card.annotationsEnabled && card.arrows) {
                        card.arrows.forEach(arrow => {
                            const marker = imageBox.createDiv("procedure-arrow-marker");
                            marker.dataset.arrowId = arrow.id;
                            // Store image-space coords for ResizeObserver repositioning
                            marker.dataset.imgX = String(arrow.x);
                            marker.dataset.imgY = String(arrow.y);
                            marker.style.setProperty("--arrow-rotation", String(arrow.rotation));
                            positionMarker(marker);

                            if (getSelected() === arrow.id) {
                                marker.classList.add("is-active");
                            }

                            marker.style.color = arrow.color || "var(--text-accent)";
                            if (getSelected() === arrow.id) {
                                marker.style.setProperty("--arrow-selection-color", arrow.color || "var(--interactive-accent)");
                            }

                            setIcon(marker, "arrow-right");

                            const handle = marker.createDiv("procedure-rotation-handle");
                            const trash = marker.createDiv("procedure-trash-button");
                            const colorPickerBtn = marker.createDiv("procedure-color-button");
                            setIcon(trash, "trash-2");
                            setIcon(colorPickerBtn, "palette");

                            // Selection & Dragging logic
                            marker.addEventListener("mousedown", (e: MouseEvent) => {
                                if (e.target === handle) return;
                                if ((e.target as HTMLElement).closest(".procedure-trash-button")) return;
                                if ((e.target as HTMLElement).closest(".procedure-color-button")) return;
                                e.preventDefault();
                                e.stopPropagation();

                                // Select this arrow
                                if (getSelected() !== arrow.id) {
                                    imageBox.querySelectorAll(".procedure-arrow-marker.is-active")
                                        .forEach(el => el.classList.remove("is-active"));
                                    setSelected(arrow.id);
                                    marker.classList.add("is-active");
                                    marker.style.setProperty(
                                        "--arrow-selection-color",
                                        arrow.color || "var(--interactive-accent)"
                                    );
                                }

                                const startX = e.clientX;
                                const startY = e.clientY;
                                const startImgX = arrow.x;
                                const startImgY = arrow.y;

                                const onMouseMove = (moveEvent: MouseEvent) => {
                                    // Recompute image rect each frame so mid-drag resizes work
                                    const r = getRenderedImageRect();
                                    const dx = ((moveEvent.clientX - startX) / r.w) * 100;
                                    const dy = ((moveEvent.clientY - startY) / r.h) * 100;
                                    // No clamping — arrows follow image content off-screen
                                    const newX = startImgX + dx;
                                    const newY = startImgY + dy;
                                    marker.dataset.imgX = String(newX);
                                    marker.dataset.imgY = String(newY);
                                    positionMarker(marker);
                                };

                                const onMouseUp = () => {
                                    window.removeEventListener("mousemove", onMouseMove);
                                    window.removeEventListener("mouseup", onMouseUp);
                                    pendingCleanups.delete(cleanup);

                                    const finalX = parseFloat(marker.dataset.imgX || "50");
                                    const finalY = parseFloat(marker.dataset.imgY || "50");

                                    setSelected(arrow.id);
                                    suppressNextDeselect = true;
                                    updateArrows(card, arrow.id, { x: finalX, y: finalY });
                                };

                                const cleanup = () => {
                                    window.removeEventListener("mousemove", onMouseMove);
                                    window.removeEventListener("mouseup", onMouseUp);
                                };

                                window.addEventListener("mousemove", onMouseMove);
                                window.addEventListener("mouseup", onMouseUp);
                                pendingCleanups.add(cleanup);
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
                                    pendingCleanups.delete(cleanup);

                                    const finalRotation = parseFloat(marker.style.getPropertyValue("--arrow-rotation"));
                                    setSelected(arrow.id);
                                    suppressNextDeselect = true;
                                    updateArrows(card, arrow.id, { rotation: finalRotation });
                                };

                                const cleanup = () => {
                                    window.removeEventListener("mousemove", onMouseMove);
                                    window.removeEventListener("mouseup", onMouseUp);
                                };

                                window.addEventListener("mousemove", onMouseMove);
                                window.addEventListener("mouseup", onMouseUp);
                                pendingCleanups.add(cleanup);
                            });

                            // Prevent the card context menu from showing when right-clicking the arrow
                            marker.addEventListener("contextmenu", (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            });

                            // Deletion logic
                            trash.onclick = (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (card.arrows && viewCtx.controller) {
                                    const newArrows = card.arrows.filter(a => a.id !== arrow.id);
                                    if (selectedArrowIds.get(card.id) === arrow.id) setSelected(null);
                                    viewCtx.controller.updateCardProperties(card.id, { arrows: newArrows });
                                }
                            };

                            // Color picking logic
                            colorPickerBtn.addEventListener("mousedown", (e) => {
                                e.stopPropagation();
                                let colorInput = colorPickerBtn.querySelector<HTMLInputElement>("input[type=color]");
                                if (colorInput) {
                                    colorInput.click();
                                    return;
                                }

                                colorInput = document.createElement("input");
                                colorInput.type = "color";
                                colorInput.value = arrow.color || "#705dcf";

                                Object.assign(colorInput.style, {
                                    position: "absolute",
                                    inset: "0",
                                    width: "100%",
                                    height: "100%",
                                    padding: "0",
                                    border: "none",
                                    opacity: "0",
                                    cursor: "pointer",
                                });
                                colorPickerBtn.appendChild(colorInput);

                                colorInput.addEventListener("change", () => {
                                    updateArrows(card, arrow.id, { color: colorInput!.value });
                                    marker.style.color = colorInput!.value;
                                    marker.style.setProperty("--arrow-selection-color", colorInput!.value);
                                    colorInput!.remove();
                                });

                                setTimeout(() => {
                                    const onOutside = (ev: PointerEvent) => {
                                        if (!colorPickerBtn.contains(ev.target as Node)) {
                                            colorInput!.remove();
                                            cleanup();
                                        }
                                    };
                                    const cleanup = () => {
                                        document.removeEventListener("pointerdown", onOutside, true);
                                        pendingCleanups.delete(cleanup);
                                    };
                                    document.addEventListener("pointerdown", onOutside, true);
                                    pendingCleanups.add(cleanup);
                                }, 0);

                                colorInput.click();
                            });
                        });
                    }

                    img.style.position = "absolute";
                    img.style.top = "0";
                    img.style.left = "0";
                    img.style.height = "100%";
                    img.style.width = "100%";
                    img.style.minHeight = "0";
                    img.style.maxHeight = "none";
                    img.style.flex = "1 1 auto";
                    img.style.objectFit = card.imageFit || viewCtx.grid.imageFit || "cover";
                    img.style.objectPosition = card.imagePosition || viewCtx.grid.imagePosition || "center";

                    // Reposition arrows now that styles are applied
                    repositionAllArrows();
                } else {
                    textBox.style.borderRight = "none";
                    imageBox.style.display = "none";
                    imageBox.style.minHeight = "0px";
                    img.style.minHeight = "0px";
                }
            },
            destroy() {
                // Remove all pending global listeners
                pendingCleanups.forEach(cleanup => cleanup());
                pendingCleanups.clear();
                resizeObserver.disconnect();

                // Note: We deliberately do NOT delete entries from selectedArrowIds here.
                // This Map allows selection state to survive view recreation (filtering, sorting, etc).
                // Since it only stores arrow IDs, the memory impact is negligible.
            }
        };
    }
};