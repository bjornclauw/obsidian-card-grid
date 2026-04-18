import type { CardGridData, CardInstance, CardTypeId, GridId } from "./types";
import { defaultGridData } from "./defaults";
import type { CardTypeRegistry } from "../cards/registry";

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function createId(prefix = ""): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return prefix ? `${prefix}_${uuid}` : uuid;
  // Fallback for older environments.
  return (
    (prefix ? `${prefix}_` : "") +
    Math.random().toString(16).slice(2) +
    Date.now().toString(16)
  );
}

function toNumber(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toStringOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function toBooleanOrUndefined(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function normalizeCardType(raw: Record<string, unknown>): CardTypeId {
  const explicit = toStringOrUndefined(raw.type);
  if (explicit) return explicit;

  // Legacy inference.
  if (typeof raw.image === "string" && raw.image.length > 0) return "image";
  if (typeof raw.imageEnabled === "boolean") return "image";
  return "text";
}

export function parseCardGridObject(
  raw: unknown,
  registry: CardTypeRegistry
): CardGridData {
  const obj = isRecord(raw) ? raw : {};

  const id = (typeof obj.id === "string" && obj.id.trim().length > 0
    ? obj.id.trim()
    : createId("grid")) as GridId;

  const base = defaultGridData(id);

  const grid: CardGridData = {
    ...base,
    version: toNumber(obj.version, base.version),
    columns: Math.max(1, Math.floor(toNumber(obj.columns, base.columns))),
    gap: Math.max(0, toNumber(obj.gap, base.gap)),
    borderRadius: Math.max(0, toNumber(obj.borderRadius, base.borderRadius)),
    imageFit:
      (toStringOrUndefined(obj.imageFit) as CardGridData["imageFit"]) ??
      base.imageFit,
    imageHeight: Math.max(0, toNumber(obj.imageHeight, base.imageHeight ?? 0)),
    imagePosition: toStringOrUndefined(obj.imagePosition) ?? base.imagePosition,
    imageRadius: Math.max(0, toNumber(obj.imageRadius, base.imageRadius ?? 0)),
    cards: []
  };

  const cardsRaw = Array.isArray(obj.cards) ? obj.cards : [];
  const cards: CardInstance[] = [];

  for (const item of cardsRaw) {
    if (!isRecord(item)) continue;
    if (typeof item.id !== "string" || item.id.trim().length === 0) {
      item.id = createId("card");
    }

    const type = normalizeCardType(item);
    const def = registry.get(type);
    const normalized = def.normalize(item) as unknown as CardInstance;
    cards.push(normalized);
  }

  grid.cards = cards;
  return grid;
}

export function serializeCardGridData(data: CardGridData): Record<string, unknown> {
  return {
    id: data.id,
    version: data.version,
    columns: data.columns,
    gap: data.gap,
    borderRadius: data.borderRadius,

    imageFit: data.imageFit,
    imageHeight: data.imageHeight,
    imagePosition: data.imagePosition,
    imageRadius: data.imageRadius,

    cards: data.cards.map((card) => serializeCard(card))
  };
}

function serializeCard(card: CardInstance): Record<string, unknown> {
  const anyCard = card as any;
  if (anyCard.raw && typeof anyCard.raw === "object") {
    // Preserve unknown properties for round-tripping.
    return { ...(anyCard.raw as Record<string, unknown>), id: card.id, type: card.type };
  }
  const { id, type, ...rest } = anyCard as Record<string, unknown>;
  return { id: id ?? card.id, type: type ?? card.type, ...rest };
}
