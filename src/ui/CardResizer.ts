import type { App } from "obsidian";
import type { GridController } from "../controller/GridController";

export class CardResizer {
    private isDragging = false;
    private startX = 0;
    private startWidth1 = 0;
    private startWidth2 = 0;
    private card1Id: string = "";
    private card2Id: string = "";
    private maxUnbalancedWidth: number = 0;
    private cachedColumns: number = 3;

    private boundMouseMove!: (evt: MouseEvent) => void;
    private boundMouseDown!: (evt: MouseEvent) => void;
    private activeMoveListener: ((e: MouseEvent) => void) | null = null;
    private activeUpListener: ((e: MouseEvent) => void) | null = null;

    constructor(
        private app: App,
        private container: HTMLElement,
        private controller: GridController
    ) {
        this.setupDividerListeners();
        this.setupCursorHandler();
    }

    private setupCursorHandler(): void {
        this.boundMouseMove = (evt: MouseEvent) => {
            if (this.isDragging) return;

            const target = evt.target as HTMLElement;
            const cardEl = target.closest(".card-grid-card, .card-grid-spacer") as HTMLElement;

            if (!cardEl) {
                this.container.style.cursor = "";
                return;
            }

            const columns = parseFloat(getComputedStyle(this.container).getPropertyValue('--grid-columns') || "3");
            const allCards = Array.from(this.container.querySelectorAll(".card-grid-card, .card-grid-spacer"));
            const myIndex = allCards.indexOf(cardEl);
            const indexInRow = (myIndex % columns) + 1;

            const rect = cardEl.getBoundingClientRect();
            const isNearRightEdge = Math.abs(evt.clientX - rect.right) <= 15;

            // Change icon only if it's a resizable edge (not the last column)
            if (isNearRightEdge && indexInRow < columns) {
                this.container.style.cursor = "col-resize";
            } else {
                this.container.style.cursor = "";
            }
        };
        this.container.addEventListener("mousemove", this.boundMouseMove);
    }

    private setupDividerListeners(): void {
        this.boundMouseDown = (evt: MouseEvent) => {
            if (!(evt instanceof MouseEvent)) return;

            // Accept both card-grid-card and card-grid-spacer
            const cardEl = (evt.target as HTMLElement).closest(".card-grid-card, .card-grid-spacer") as HTMLElement;
            if (!cardEl) return;

            // Respect the "highest truth": cards in the last column cannot be resized.
            const columns = parseFloat(getComputedStyle(this.container).getPropertyValue('--grid-columns') || "3");
            const allCards = Array.from(this.container.querySelectorAll(".card-grid-card, .card-grid-spacer"));
            const myIndex = allCards.indexOf(cardEl);
            const indexInRow = (myIndex % columns) + 1;

            if (indexInRow === columns) {
                return;
            }

            // Only start resize if clicking near the right edge (where the handle is)
            const rect = cardEl.getBoundingClientRect();
            const isNearRightEdge = Math.abs(evt.clientX - rect.right) <= 15;
            if (!isNearRightEdge) {
                return;
            }

            const nextCardEl = cardEl.nextElementSibling as HTMLElement;

            // Determine if we have a neighbor on the same row to resize against
            let neighbor: HTMLElement | null = null;
            if (nextCardEl &&
                (nextCardEl.classList.contains("card-grid-card") || nextCardEl.classList.contains("card-grid-spacer"))) {
                const rectNext = nextCardEl.getBoundingClientRect();
                // Vertical check to ensure they are on the same row
                if (Math.abs(rect.top - rectNext.top) <= 10) {
                    neighbor = nextCardEl;
                }
            }

            // We allow resizing if there's a neighbor (Balanced) 
            // OR if there's empty space in the row (Unbalanced).
            this.startResize(evt as MouseEvent, cardEl, neighbor);
        };
        this.container.addEventListener("mousedown", this.boundMouseDown);
    }

    private onMouseMove(evt: MouseEvent, card1El: HTMLElement, card2El?: HTMLElement): void {
        if (!this.isDragging) return;

        const deltaX = evt.clientX - this.startX;

        // Calculate units based on container width and total columns for consistent sensitivity
        const containerRect = this.container.getBoundingClientRect();
        const unitDelta = (deltaX / containerRect.width) * this.cachedColumns;

        if (!card2El) {
            // Unbalanced resize: grow/shrink while respecting the row's column limit
            let w = this.startWidth1 + unitDelta;
            w = Math.round(Math.min(this.maxUnbalancedWidth, Math.max(0.3, w)) * 1000) / 1000;
            card1El.style.setProperty('--card-width', String(w));
            return;
        }

        let w1 = this.startWidth1 + unitDelta;
        let w2 = this.startWidth2 - unitDelta;
        const totalWidth = this.startWidth1 + this.startWidth2;

        // Balanced clamping: if one card hits minimum, the other stops growing.
        // This prevents the total row width from exceeding the grid capacity.
        const MIN_WIDTH = 0.3;
        if (w1 < MIN_WIDTH) {
            w1 = MIN_WIDTH;
            w2 = totalWidth - MIN_WIDTH;
        } else if (w2 < MIN_WIDTH) {
            w2 = MIN_WIDTH;
            w1 = totalWidth - MIN_WIDTH;
        }

        // Round to 3 decimals to prevent floating point precision errors from causing row wraps
        const round = (n: number) => Math.round(n * 1000) / 1000;

        card1El.style.setProperty('--card-width', String(round(w1)));
        card2El.style.setProperty('--card-width', String(round(w2)));
    }

    private startResize(evt: MouseEvent, card1El: HTMLElement, card2El: HTMLElement | null): void {
        evt.preventDefault();
        this.isDragging = true;
        this.controller.setResizing(true);

        this.startX = evt.clientX;
        this.card1Id = card1El.dataset.cardId || "";
        this.card2Id = card2El?.dataset.cardId || "";
        this.startWidth1 = parseFloat(card1El.dataset.widthFraction || "1");
        this.startWidth2 = card2El ? parseFloat(card2El.dataset.widthFraction || "1") : 0;
        this.cachedColumns = parseFloat(getComputedStyle(this.container).getPropertyValue('--grid-columns') || "3");

        // Calculate the maximum allowed width for unbalanced resizing (last card in incomplete row)
        if (!card2El) {
            const allCards = Array.from(this.container.querySelectorAll(".card-grid-card, .card-grid-spacer"));
            const myIndex = allCards.indexOf(card1El);
            const rowIndex = Math.floor(myIndex / this.cachedColumns);
            const startOfRow = rowIndex * this.cachedColumns;

            let sumOfPreviousInRow = 0;
            for (let i = startOfRow; i < myIndex; i++) {
                sumOfPreviousInRow += parseFloat((allCards[i] as HTMLElement).dataset.widthFraction || "1");
            }
            this.maxUnbalancedWidth = this.cachedColumns - sumOfPreviousInRow;
        }

        card1El.classList.add("card-grid-resizing");
        if (card2El) {
            card2El.classList.add("card-grid-resizing");
        }

        const onMouseMove = (e: MouseEvent) => this.onMouseMove(e, card1El, card2El || undefined);
        const onMouseUp = () => this.onMouseUp(card1El, card2El, onMouseMove);

        this.activeMoveListener = onMouseMove;
        this.activeUpListener = onMouseUp;

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp, { once: true });
    }

    private onMouseUp(
        card1El: HTMLElement,
        card2El: HTMLElement | null,
        onMouseMove: (e: MouseEvent) => void
    ): void {
        document.removeEventListener("mousemove", onMouseMove);
        this.activeMoveListener = null;
        this.activeUpListener = null;

        if (!this.isDragging) return;
        this.isDragging = false;
        this.controller.setResizing(false);

        card1El.classList.remove("card-grid-resizing");
        if (card2El) {
            card2El.classList.remove("card-grid-resizing");
        }

        const newWidth1 = parseFloat(getComputedStyle(card1El).getPropertyValue('--card-width') || "1");
        const updates = [{ id: this.card1Id, width: newWidth1 }];

        if (this.card2Id && card2El) {
            const newWidth2 = parseFloat(getComputedStyle(card2El).getPropertyValue('--card-width') || "1");
            updates.push({ id: this.card2Id, width: newWidth2 });
        }

        this.controller.updateCardWidths(updates);
    }

    destroy(): void {
        this.isDragging = false;
        this.container.removeEventListener("mousemove", this.boundMouseMove);
        this.container.removeEventListener("mousedown", this.boundMouseDown);
        this.container.style.cursor = "";

        if (this.activeMoveListener) {
            document.removeEventListener("mousemove", this.activeMoveListener);
            this.activeMoveListener = null;
        }
        if (this.activeUpListener) {
            document.removeEventListener("mouseup", this.activeUpListener);
            this.activeUpListener = null;
        }
    }
}