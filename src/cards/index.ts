import { CardTypeRegistry } from "./registry";
import { textCardType } from "./types/textCard";
import { imageCardType } from "./types/imageCard";
import { unknownCardType } from "./types/unknownCard";

export function createDefaultRegistry(): CardTypeRegistry {
  const registry = new CardTypeRegistry();
  registry.register(textCardType);
  registry.register(imageCardType);
  registry.register(unknownCardType);
  return registry;
}

