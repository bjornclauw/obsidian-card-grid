
export interface CardGridSettings {
  defaultColumns: number;
  defaultGap: number;
  defaultBorderRadius: number;
  defaultImageFit: "cover" | "contain" | "fill" | "none" | "scale-down";
  defaultImageHeight: number;
  defaultImagePosition: string;
  defaultImageRadius: number;
}

export const DEFAULT_SETTINGS: CardGridSettings = {
  defaultColumns: 3,
  defaultGap: 10,
  defaultBorderRadius: 8,
  defaultImageFit: "cover",
  defaultImageHeight: 180,
  defaultImagePosition: "center",
  defaultImageRadius: 5,
};
