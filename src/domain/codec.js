"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createId = createId;
exports.parseCardGridObject = parseCardGridObject;
exports.serializeCardGridData = serializeCardGridData;
const defaults_1 = require("./defaults");
function isRecord(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
}
function createId(prefix = "") {
    var _a, _b;
    const uuid = (_b = (_a = globalThis.crypto) === null || _a === void 0 ? void 0 : _a.randomUUID) === null || _b === void 0 ? void 0 : _b.call(_a);
    if (uuid)
        return prefix ? `${prefix}_${uuid}` : uuid;
    // Fallback for older environments.
    return ((prefix ? `${prefix}_` : "") +
        Math.random().toString(16).slice(2) +
        Date.now().toString(16));
}
function toNumber(value, fallback) {
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : fallback;
}
function toStringOrUndefined(value) {
    return typeof value === "string" ? value : undefined;
}
function toBooleanOrUndefined(value) {
    return typeof value === "boolean" ? value : undefined;
}
function normalizeCardType(raw) {
    const explicit = toStringOrUndefined(raw.type);
    if (explicit)
        return explicit;
    // Legacy inference.
    if (typeof raw.image === "string" && raw.image.length > 0)
        return "image";
    if (typeof raw.imageEnabled === "boolean")
        return "image";
    return "text";
}
function parseCardGridObject(raw, registry) {
    var _a, _b, _c, _d;
    const obj = isRecord(raw) ? raw : {};
    const id = (typeof obj.id === "string" && obj.id.trim().length > 0
        ? obj.id.trim()
        : createId("grid"));
    const base = (0, defaults_1.defaultGridData)(id);
    const grid = Object.assign(Object.assign({}, base), { version: toNumber(obj.version, defaults_1.CURRENT_GRID_VERSION), columns: Math.max(1, Math.floor(toNumber(obj.columns, base.columns))), gap: Math.max(0, toNumber(obj.gap, base.gap)), imageFit: (_a = toStringOrUndefined(obj.imageFit)) !== null && _a !== void 0 ? _a : base.imageFit, imageHeight: Math.max(0, toNumber(obj.imageHeight, (_b = base.imageHeight) !== null && _b !== void 0 ? _b : 0)), imagePosition: (_c = toStringOrUndefined(obj.imagePosition)) !== null && _c !== void 0 ? _c : base.imagePosition, imageRadius: Math.max(0, toNumber(obj.imageRadius, (_d = base.imageRadius) !== null && _d !== void 0 ? _d : 0)), cards: [] });
    const cardsRaw = Array.isArray(obj.cards) ? obj.cards : [];
    const cards = [];
    for (const item of cardsRaw) {
        if (!isRecord(item))
            continue;
        if (typeof item.id !== "string" || item.id.trim().length === 0) {
            item.id = createId("card");
        }
        const type = normalizeCardType(item);
        const def = registry.get(type);
        const normalized = def.normalize(item);
        cards.push(normalized);
    }
    grid.cards = cards;
    return grid;
}
function serializeCardGridData(data) {
    return {
        id: data.id,
        version: data.version,
        columns: data.columns,
        gap: data.gap,
        imageFit: data.imageFit,
        imageHeight: data.imageHeight,
        imagePosition: data.imagePosition,
        imageRadius: data.imageRadius,
        cards: data.cards.map((card) => serializeCard(card))
    };
}
function serializeCard(card) {
    const anyCard = card;
    if (anyCard.raw && typeof anyCard.raw === "object") {
        // Preserve unknown properties for round-tripping.
        return Object.assign(Object.assign({}, anyCard.raw), { id: card.id, type: card.type });
    }
    const _a = anyCard, { id, type } = _a, rest = __rest(_a, ["id", "type"]);
    return Object.assign({ id: id !== null && id !== void 0 ? id : card.id, type: type !== null && type !== void 0 ? type : card.type }, rest);
}
