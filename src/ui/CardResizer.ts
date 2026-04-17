import type { App } from "obsidian";
import type { GridController } from "../controller/GridController";

export class CardResizer {
    private isDragging = false;
    private startX = 0;
    private startWidth1 = 0;
    private startWidth2 = 0;
    private card1Id: string = "";
    private card2Id: string = "";

    constructor(
        private app: App,
        private container: HTMLElement,
        private controller: GridController
    ) {
        this.setupDividerListeners();
    }

    private setupDividerListeners(): void {
        this.container.addEventListener("mousedown", (evt) => {
            //console.log("mousedown triggered", evt.target);

            // Accept both card-grid-card and card-grid-spacer
            const cardEl = (evt.target as HTMLElement).closest(".card-grid-card, .card-grid-spacer") as HTMLElement;
            if (!cardEl) return;

            // Only start resize if clicking near the right edge (where the handle is)
            const rect = cardEl.getBoundingClientRect();
            const isNearRightEdge = Math.abs(evt.clientX - rect.right) <= 15;
            if (!isNearRightEdge) {
                return;
            }

            const nextCardEl = cardEl.nextElementSibling as HTMLElement;
            //console.log("nextCardEl:", nextCardEl);

            // Accept both .card-grid-card AND .card-grid-spacer for next element
            if (!nextCardEl || (!nextCardEl.classList.contains("card-grid-card") && !nextCardEl.classList.contains("card-grid-spacer"))) {
                //console.log("no next card");
                return;
            }

            //console.log("starting resize");
            this.startResize(evt as MouseEvent, cardEl, nextCardEl);
        });
    }

    private onMouseMove(evt: MouseEvent, card1El: HTMLElement, card2El: HTMLElement): void {
        if (!this.isDragging) return;

        const deltaX = evt.clientX - this.startX;

        // Calculate units based on container width and total columns for consistent sensitivity
        const containerRect = this.container.getBoundingClientRect();
        const columns = parseFloat(getComputedStyle(this.container).getPropertyValue('--grid-columns') || "3");
        const unitDelta = (deltaX / containerRect.width) * columns;

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

    private startResize(evt: MouseEvent, card1El: HTMLElement, card2El: HTMLElement): void {
        evt.preventDefault();
        this.isDragging = true;
        this.controller.setResizing(true);  // Add this

        this.startX = evt.clientX;
        this.card1Id = card1El.dataset.cardId || "";
        this.card2Id = card2El.dataset.cardId || "";
        this.startWidth1 = parseFloat(card1El.dataset.widthFraction || "1");
        this.startWidth2 = parseFloat(card2El.dataset.widthFraction || "1");

        //console.log("resize started", { card1Id: this.card1Id, card2Id: this.card2Id, startWidth1: this.startWidth1, startWidth2: this.startWidth2 });

        card1El.classList.add("card-grid-resizing");
        card2El.classList.add("card-grid-resizing");

        const onMouseMove = (e: MouseEvent) => this.onMouseMove(e, card1El, card2El);
        const onMouseUp = () => this.onMouseUp(card1El, card2El, onMouseMove);

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp, { once: true });
    }

    private onMouseUp(
        card1El: HTMLElement,
        card2El: HTMLElement,
        onMouseMove: (e: MouseEvent) => void
    ): void {
        document.removeEventListener("mousemove", onMouseMove);

        if (!this.isDragging) return;
        this.isDragging = false;
        this.controller.setResizing(false);  // Add this

        card1El.classList.remove("card-grid-resizing");
        card2El.classList.remove("card-grid-resizing");

        const newWidth1 = parseFloat(getComputedStyle(card1El).getPropertyValue('--card-width') || "1");
        const newWidth2 = parseFloat(getComputedStyle(card2El).getPropertyValue('--card-width') || "1");

        //console.log("resize finished", { newWidth1, newWidth2 });

        this.controller.updateCardWidths([
            { id: this.card1Id, width: newWidth1 },
            { id: this.card2Id, width: newWidth2 }
        ]);
    }



    destroy(): void {
        this.isDragging = false;
    }
}