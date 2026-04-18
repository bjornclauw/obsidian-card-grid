import type { CardGridData } from "./types";

export const CURRENT_GRID_VERSION = 1;
export const DEFAULT_GAP = 10;

export function defaultGridData(id: string): CardGridData {
  return {
    id,
    version: CURRENT_GRID_VERSION,
    columns: 3,
    gap: DEFAULT_GAP,
    imageFit: "cover",
    imageHeight: 180,
    imagePosition: "center",
    imageRadius: 0,
    cards: []
  };
}
