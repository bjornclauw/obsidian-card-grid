import type { CardGridData, ImageCard } from "../../domain/types";

export function applyImageStyle(
  img: HTMLImageElement,
  card: ImageCard,
  grid: CardGridData
): void {
  const fit = card.imageFit ?? grid.imageFit ?? "cover";
  const height = card.imageHeight ?? grid.imageHeight ?? 180;
  const position = card.imagePosition ?? grid.imagePosition ?? "center";
  const radius = card.imageRadius ?? grid.imageRadius ?? 0;

  img.style.objectFit = fit;
  img.style.width = "100%";
	img.style.maxHeight = `${height}px`;
  img.style.objectPosition = position;
  img.style.borderRadius = `${radius}px`;
  img.style.width = "100%";
}

