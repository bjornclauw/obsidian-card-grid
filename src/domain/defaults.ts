import type { CardGridData } from "./types";

export const CURRENT_GRID_VERSION = 1;

export function defaultGridData(id: string): CardGridData {
  return {
    id,
    version: CURRENT_GRID_VERSION,
    columns: 3,
    gap: 10,
    imageFit: "cover",
    imageHeight: 180,
    imagePosition: "center",
    imageRadius: 0,
    cards: []
  };
}

