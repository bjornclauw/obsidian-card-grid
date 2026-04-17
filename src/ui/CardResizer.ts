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
            //console.log("cardEl:", cardEl);

            if (!cardEl) return;

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
        const card1Rect = card1El.getBoundingClientRect();
        const card1Width = card1Rect.width;

        const widthDelta = deltaX / card1Width;

        const newWidth1 = Math.max(0.5, this.startWidth1 + widthDelta);
        const newWidth2 = Math.max(0.5, this.startWidth2 - widthDelta);

        //console.log("dragging", { deltaX, widthDelta, newWidth1, newWidth2 });

        card1El.style.flex = String(newWidth1);
        card2El.style.flex = String(newWidth2);
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

        const newWidth1 = parseFloat(card1El.style.flex || "1");
        const newWidth2 = parseFloat(card2El.style.flex || "1");

        //console.log("resize finished", { newWidth1, newWidth2 });

        this.controller.updateCardWidth(this.card1Id, newWidth1);
        this.controller.updateCardWidth(this.card2Id, newWidth2);
    }



    destroy(): void {
        this.isDragging = false;
    }
}