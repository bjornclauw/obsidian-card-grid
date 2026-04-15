import type { CardGridData } from "../domain/types";
import type { GridAction } from "./actions";

export type GridListener = (next: CardGridData, prev: CardGridData) => void;

export class GridStore {
  private state: CardGridData;
  private listeners = new Set<GridListener>();

  constructor(initial: CardGridData) {
    this.state = initial;
  }

  getState(): CardGridData {
    return this.state;
  }

  subscribe(listener: GridListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  dispatch(action: GridAction): void {
    const prev = this.state;
    const next = reduce(prev, action);
    if (next === prev) return;
    this.state = next;
    for (const l of this.listeners) l(next, prev);
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function reduce(state: CardGridData, action: GridAction): CardGridData {
  switch (action.type) {
    case "grid/set-options": {
      const patch = action.patch;
      const next: CardGridData = { ...state, ...patch };
      if (patch.columns !== undefined) next.columns = Math.max(1, Math.floor(patch.columns));
      if (patch.gap !== undefined) next.gap = Math.max(0, patch.gap);
      return next;
    }
    case "card/insert": {
      const cards = state.cards.slice();
      const at =
        action.atIndex === undefined
          ? cards.length
          : clamp(action.atIndex, 0, cards.length);
      cards.splice(at, 0, action.card);
      return { ...state, cards };
    }
    case "card/delete": {
      const idx = state.cards.findIndex((c) => c.id === action.id);
      if (idx === -1) return state;
      const cards = state.cards.slice();
      cards.splice(idx, 1);
      return { ...state, cards };
    }
    case "card/replace": {
      const idx = state.cards.findIndex((c) => c.id === action.card.id);
      if (idx === -1) return state;
      const cards = state.cards.slice();
      cards[idx] = action.card;
      return { ...state, cards };
    }
    case "card/patch": {
      const idx = state.cards.findIndex((c) => c.id === action.id);
      if (idx === -1) return state;
      const existing = state.cards[idx];
      const updated = { ...existing, ...action.patch } as any;
      const cards = state.cards.slice();
      cards[idx] = updated;
      return { ...state, cards };
    }
    case "card/move": {
      const fromIndex = state.cards.findIndex((c) => c.id === action.id);
      if (fromIndex === -1) return state;
      const toIndex = clamp(action.toIndex, 0, state.cards.length - 1);
      if (toIndex === fromIndex) return state;
      const cards = state.cards.slice();
      const [item] = cards.splice(fromIndex, 1);
      cards.splice(toIndex, 0, item);
      return { ...state, cards };
    }
  }
}
