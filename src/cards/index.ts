import { CardTypeRegistry } from "./registry";
import { textCardType } from "./types/textCard";
import { flashCardType } from "./types/flashCard";
import { imageCardType } from "./types/imageCard";
import { spacerCardType } from "./types/spacerCard";
import { unknownCardType } from "./types/unknownCard";
import { procedureCardType } from "./types/procedureCard";
import { notifierCardType } from "../domain/notifierCard";

export function createDefaultRegistry(): CardTypeRegistry {
  const registry = new CardTypeRegistry();
  registry.register(textCardType);
  registry.register(flashCardType);
  registry.register(imageCardType);
  registry.register(procedureCardType);
  registry.register(notifierCardType);
  registry.register(unknownCardType);
  registry.register(spacerCardType);
  return registry;
}
