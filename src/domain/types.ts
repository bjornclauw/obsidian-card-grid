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
  borderRadius: number;

  // Optional grid-level defaults used by some card types.
  imageFit?: "cover" | "contain" | "fill" | "none";
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
  imageHeight?: number;

  // Allow card types to add arbitrary fields without changing core types.
  [key: string]: unknown;
}

export type CardInstance = BaseCard;

export interface TextCard extends CardInstance {
  type: "textCard";
  title: string;
  text: string;
  titleEnabled?: boolean;
  alignment?: "left" | "center" | "right";
}

export interface VerticalFlashCard extends BaseCard {
  type: "verticalFlashCard";
  title?: string;
  text?: string;
  titleEnabled?: boolean;
  image?: string;
  imageEnabled?: boolean;

  // Optional per-card overrides (fallback to grid defaults).
  imageFit?: CardGridData["imageFit"];
  imageHeight?: number;
  imagePosition?: string;
  imageRadius?: number;
}

export interface HorizontalFlashCard extends BaseCard {
  type: "horizontalFlashCard";
  title?: string;
  text?: string;
  titleEnabled?: boolean;
  image?: string;
  imageEnabled?: boolean;
  imageSide?: "left" | "right";
  alignment?: "left" | "center" | "right";
  verticalAlignment?: "top" | "center" | "bottom";

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

export interface GalleryCard extends BaseCard {
  type: "galleryCard";
  image?: string;
  imageEnabled?: boolean;

  // Optional per-card overrides (fallback to grid defaults).
  imageFit?: CardGridData["imageFit"];
  imageHeight?: number;
  imagePosition?: string;
  imageRadius?: number;
}

export interface ProcedureCard extends BaseCard {
  type: "procedureCard";
  title?: string;
  text?: string;
  image?: string;
  imageEnabled?: boolean;
  annotationsEnabled?: boolean;
  arrows?: Array<{ x: number; y: number; rotation: number; id: string; color?: string }>;

  // Optional per-card overrides (fallback to grid defaults).
  imageFit?: CardGridData["imageFit"];
  imageHeight?: number;
  imagePosition?: string;
  imageRadius?: number;
}

export interface BannerCard extends BaseCard {
  type: "bannerCard";
  title?: string;
  text?: string;
  alignment?: "left" | "center" | "right";
  titleSize?: number;
  textSize?: number;
  icon?: string;

  // Overrides for inherited styling
  backgroundColor?: string;
  textColor?: string;
}

export interface IconCard extends BaseCard {
  type: "iconCard";
  icon?: string;
  text?: string;
  link?: string;
  iconSize?: number;
  textSize?: number;
  iconColor?: string;
  alignment?: "left" | "center" | "right";
  openInNewWindow?: boolean;
}

export interface SpacerCard extends BaseCard {
  type: "spacerCard";
  width: number;
}

export type BuiltInCard =
  | TextCard
  | VerticalFlashCard
  | HorizontalFlashCard
  | GalleryCard
  | UnknownCard
  | ProcedureCard
  | BannerCard
  | IconCard
  | SpacerCard;

export interface GridBlockRef {
  sourcePath: string;
  lineStart?: number;
  lineEnd?: number;
  /** Original raw YAML source of the code block (between the fences), used as a
   *  content-based fallback when line numbers are stale (e.g. after the file was
   *  modified by another save, or when the "Collapsed Codeblocks" plugin remounts
   *  the block with different getSectionInfo() values). */
  codeBlockSource?: string;
}
