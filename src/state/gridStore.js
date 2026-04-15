"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GridStore = void 0;
class GridStore {
    constructor(initial) {
        this.listeners = new Set();
        this.state = initial;
    }
    getState() {
        return this.state;
    }
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    dispatch(action) {
        const prev = this.state;
        const next = reduce(prev, action);
        if (next === prev)
            return;
        this.state = next;
        for (const l of this.listeners)
            l(next, prev);
    }
}
exports.GridStore = GridStore;
function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}
function reduce(state, action) {
    switch (action.type) {
        case "grid/set-options": {
            const patch = action.patch;
            const next = Object.assign(Object.assign({}, state), patch);
            if (patch.columns !== undefined)
                next.columns = Math.max(1, Math.floor(patch.columns));
            if (patch.gap !== undefined)
                next.gap = Math.max(0, patch.gap);
            return next;
        }
        case "card/insert": {
            const cards = state.cards.slice();
            const at = action.atIndex === undefined
                ? cards.length
                : clamp(action.atIndex, 0, cards.length);
            cards.splice(at, 0, action.card);
            return Object.assign(Object.assign({}, state), { cards });
        }
        case "card/delete": {
            const idx = state.cards.findIndex((c) => c.id === action.id);
            if (idx === -1)
                return state;
            const cards = state.cards.slice();
            cards.splice(idx, 1);
            return Object.assign(Object.assign({}, state), { cards });
        }
        case "card/replace": {
            const idx = state.cards.findIndex((c) => c.id === action.card.id);
            if (idx === -1)
                return state;
            const cards = state.cards.slice();
            cards[idx] = action.card;
            return Object.assign(Object.assign({}, state), { cards });
        }
        case "card/patch": {
            const idx = state.cards.findIndex((c) => c.id === action.id);
            if (idx === -1)
                return state;
            const existing = state.cards[idx];
            const updated = Object.assign(Object.assign({}, existing), action.patch);
            const cards = state.cards.slice();
            cards[idx] = updated;
            return Object.assign(Object.assign({}, state), { cards });
        }
        case "card/move": {
            const fromIndex = state.cards.findIndex((c) => c.id === action.id);
            if (fromIndex === -1)
                return state;
            const toIndex = clamp(action.toIndex, 0, state.cards.length - 1);
            if (toIndex === fromIndex)
                return state;
            const cards = state.cards.slice();
            const [item] = cards.splice(fromIndex, 1);
            cards.splice(toIndex, 0, item);
            return Object.assign(Object.assign({}, state), { cards });
        }
    }
}
