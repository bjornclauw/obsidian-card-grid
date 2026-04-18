export type CardId = string;
export type GridId = string;

// Intentionally open-ended: new card types can be added via the registry
// without changing core logic.
export type CardTypeId = string;

export interface CardGridData {
  id: GridId;
  version: number;
  columns: number;
  gap: number;

  // Optional grid-level defaults used by some card types.
  imageFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  imageHeight?: number;
  imagePosition?: string;
  imageRadius?: number;

  cards: CardInstance[];
}

export interface BaseCard {
  id: CardId;
  type: CardTypeId;

  // Shared optional styling.
  backgroundColor?: string;
  textColor?: string;
  width?: number;

  // Allow card types to add arbitrary fields without changing core types.
  [key: string]: unknown;
}

export type CardInstance = BaseCard;

export interface TextCard extends CardInstance {
  type: "text";
  title: string;
  text: string;
}

export interface FlashCard extends BaseCard {
  type: "flashcard";
  title?: string;
  text?: string;
  image?: string;
  imageEnabled?: boolean;

  // Optional per-card overrides (fallback to grid defaults).
  imageFit?: CardGridData["imageFit"];
  imageHeight?: number;
  imagePosition?: string;
  imageRadius?: number;
}

export interface UnknownCard extends BaseCard {
  // For forward-compatibility, preserve the original type string even if
  // the type isn't registered (yet).
  type: CardTypeId;
  raw: Record<string, unknown>;
}

export interface ImageCard extends BaseCard {
  type: "image";
  image?: string;
  imageEnabled?: boolean;

  // Optional per-card overrides (fallback to grid defaults).
  imageFit?: CardGridData["imageFit"];
  imageHeight?: number;
  imagePosition?: string;
  imageRadius?: number;
}

export type BuiltInCard = TextCard | FlashCard | ImageCard | UnknownCard;

export interface GridBlockRef {
  sourcePath: string;
  lineStart?: number;
  lineEnd?: number;
}
