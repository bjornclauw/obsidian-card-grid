import { CardTypeRegistry } from "./registry";
import { textCardType } from "./types/textCard";
import { verticalFlashCardType } from "./types/verticalFlashCard";
import { galleryCardType } from "./types/galleryCard";
import { spacerCardType } from "./types/spacerCard";
import { unknownCardType } from "./types/unknownCard";
import { procedureCardType } from "./types/procedureCard";
import { bannerCardType } from "./types/bannerCard";
import { iconCardType } from "./types/iconCard";

export function createDefaultRegistry(): CardTypeRegistry {
  const registry = new CardTypeRegistry();
  registry.register(textCardType);
  registry.register(verticalFlashCardType);
  registry.register(galleryCardType);
  registry.register(procedureCardType);
  registry.register(iconCardType);
  registry.register(bannerCardType);
  registry.register(unknownCardType);
  registry.register(spacerCardType);
  return registry;
}
