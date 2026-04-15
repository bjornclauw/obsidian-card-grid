import type { CardInstance, CardTypeId, CardGridData, CardId } from "../domain/types";

export type GridAction =
  | { type: "grid/set-options"; patch: Partial<Omit<CardGridData, "cards">> }
  | { type: "card/delete"; id: CardId }
  | { type: "card/insert"; card: CardInstance; atIndex?: number }
  | { type: "card/replace"; card: CardInstance }
  | { type: "card/patch"; id: CardId; patch: Partial<CardInstance> }
  | { type: "card/move"; id: CardId; toIndex: number };
