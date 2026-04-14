export interface CardData {
    title?: string;
    backgroundColor?: string;
    textColor?: string;
    text?: string;
    image?: string;
}

export interface GridData {
    columns?: number;
    gap?: number;
    cards: CardData[];
}

export interface DragState {
    gridKey?: string;
    cardId?: string;
    ghost?: HTMLElement;
    el?: HTMLElement;
    offsetX?: number;
    offsetY?: number;
    lastToIndex?: number | undefined;
}