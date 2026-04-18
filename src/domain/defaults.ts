import type { CardGridData } from "./types";



export function defaultGridData(id: string): CardGridData {
  return {
    id,
    version: 1,
    columns: 3,
    gap: 10,
    borderRadius: 8,
    imageFit: "cover",
    imageHeight: 180,
    imagePosition: "center",
    imageRadius: 5,
    cards: []
  };
}
