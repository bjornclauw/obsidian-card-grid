import { CardTypeRegistry } from "./registry";
import { textCardType } from "./types/textCard";
import { imageCardType } from "./types/imageCard";
import { spacerCardType } from "./types/spacerCard";
import { unknownCardType } from "./types/unknownCard";

export function createDefaultRegistry(): CardTypeRegistry {
  const registry = new CardTypeRegistry();
  registry.register(textCardType);
  registry.register(imageCardType);
  registry.register(unknownCardType);
  registry.register(spacerCardType);
  return registry;
}

