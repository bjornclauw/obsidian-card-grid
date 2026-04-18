"use strict";
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => main_default
});
module.exports = __toCommonJS(main_exports);

// src/plugin/CardGridPlugin.ts
var import_obsidian15 = require("obsidian");

// src/cards/registry.ts
var CardTypeRegistry = class {
  constructor() {
    this.defs = /* @__PURE__ */ new Map();
  }
  register(def) {
    this.defs.set(def.type, def);
  }
  get(type) {
    var _a;
    return (_a = this.defs.get(type)) != null ? _a : this.defs.get("unknown");
  }
  has(type) {
    return this.defs.has(type);
  }
  list() {
    return Array.from(this.defs.values());
  }
};

// src/cards/types/textCard.ts
var import_obsidian = require("obsidian");

// src/domain/defaults.ts
var CURRENT_GRID_VERSION = 1;
var DEFAULT_GAP = 10;
var DEFAULT_RADIUS = 8;
function defaultGridData(id) {
  return {
    id,
    version: CURRENT_GRID_VERSION,
    columns: 3,
    gap: DEFAULT_GAP,
    borderRadius: DEFAULT_RADIUS,
    imageFit: "cover",
    imageHeight: 180,
    imagePosition: "center",
    imageRadius: 0,
    cards: []
  };
}

// src/domain/codec.ts
function isRecord(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function createId(prefix = "") {
  var _a, _b;
  const uuid = (_b = (_a = globalThis.crypto) == null ? void 0 : _a.randomUUID) == null ? void 0 : _b.call(_a);
  if (uuid) return prefix ? `${prefix}_${uuid}` : uuid;
  return (prefix ? `${prefix}_` : "") + Math.random().toString(16).slice(2) + Date.now().toString(16);
}
function toNumber(value, fallback) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function toStringOrUndefined(value) {
  return typeof value === "string" ? value : void 0;
}
function normalizeCardType(raw) {
  const explicit = toStringOrUndefined(raw.type);
  if (explicit) return explicit;
  if (typeof raw.image === "string" && raw.image.length > 0) return "image";
  if (typeof raw.imageEnabled === "boolean") return "image";
  return "text";
}
function parseCardGridObject(raw, registry) {
  var _a, _b, _c, _d;
  const obj = isRecord(raw) ? raw : {};
  const id = typeof obj.id === "string" && obj.id.trim().length > 0 ? obj.id.trim() : createId("grid");
  const base = defaultGridData(id);
  const grid = __spreadProps(__spreadValues({}, base), {
    version: toNumber(obj.version, CURRENT_GRID_VERSION),
    columns: Math.max(1, Math.floor(toNumber(obj.columns, base.columns))),
    gap: Math.max(0, toNumber(obj.gap, base.gap)),
    borderRadius: Math.max(0, toNumber(obj.borderRadius, base.borderRadius)),
    imageFit: (_a = toStringOrUndefined(obj.imageFit)) != null ? _a : base.imageFit,
    imageHeight: Math.max(0, toNumber(obj.imageHeight, (_b = base.imageHeight) != null ? _b : 0)),
    imagePosition: (_c = toStringOrUndefined(obj.imagePosition)) != null ? _c : base.imagePosition,
    imageRadius: Math.max(0, toNumber(obj.imageRadius, (_d = base.imageRadius) != null ? _d : 0)),
    cards: []
  });
  const cardsRaw = Array.isArray(obj.cards) ? obj.cards : [];
  const cards = [];
  for (const item of cardsRaw) {
    if (!isRecord(item)) continue;
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
    borderRadius: data.borderRadius,
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
    return __spreadProps(__spreadValues({}, anyCard.raw), { id: card.id, type: card.type });
  }
  const _a = anyCard, { id, type } = _a, rest = __objRest(_a, ["id", "type"]);
  return __spreadValues({ id: id != null ? id : card.id, type: type != null ? type : card.type }, rest);
}

// src/cards/types/textCard.ts
function isRecord2(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
var textCardType = {
  type: "text",
  displayName: "Text card",
  editor: {
    title: "Edit text card",
    fields: [
      { kind: "text", key: "title", label: "Title" },
      { kind: "markdown", key: "text", label: "Text" },
      {
        kind: "select",
        key: "alignment",
        label: "Alignment",
        options: [
          { label: "Left", value: "left" },
          { label: "Center", value: "center" }
        ]
      },
      {
        kind: "color",
        key: "backgroundColor",
        label: "Border color",
        defaultValue: "#cccccc"
      },
      {
        kind: "color",
        key: "textColor",
        label: "Title color",
        defaultValue: "#000000"
      },
      {
        kind: "number",
        key: "width",
        label: "Width (columns)",
        defaultValue: 1
        // Default to 1 column
      }
    ]
  },
  normalize(raw) {
    if (!isRecord2(raw)) {
      return { id: createId("card"), type: "text", title: "Untitled", text: "" };
    }
    const id = typeof raw.id === "string" && raw.id.trim().length > 0 ? raw.id.trim() : createId("card");
    return {
      id,
      type: "text",
      title: typeof raw.title === "string" ? raw.title : "Untitled",
      text: typeof raw.text === "string" ? raw.text : "",
      alignment: raw.alignment === "left" || raw.alignment === "center" ? raw.alignment : "center",
      backgroundColor: typeof raw.backgroundColor === "string" ? raw.backgroundColor : void 0,
      textColor: typeof raw.textColor === "string" ? raw.textColor : void 0,
      width: typeof raw.width === "number" ? raw.width : 1
    };
  },
  createView(ctx) {
    const box = document.createElement("div");
    box.className = "card-grid-card";
    box.style.padding = "0";
    box.style.overflow = "hidden";
    box.style.display = "flex";
    box.style.flexDirection = "column";
    const titleEl = box.createEl("h4");
    titleEl.style.margin = "0";
    titleEl.style.padding = "10px";
    const textEl = box.createDiv("card-text");
    textEl.style.padding = "10px";
    function renderMarkdown(el, markdown) {
      return __async(this, null, function* () {
        el.empty();
        yield import_obsidian.MarkdownRenderer.render(ctx.app, markdown || " ", el, ctx.sourcePath, ctx.plugin);
      });
    }
    return {
      el: box,
      update(card, viewCtx) {
        box.style.setProperty("--card-width", String(card.width || 1));
        box.dataset.widthFraction = String(card.width || 1);
        box.dataset.cardId = card.id;
        box.style.border = `2px solid ${card.backgroundColor || "#ccc"}`;
        titleEl.style.color = card.textColor || "#000000";
        titleEl.style.backgroundColor = card.backgroundColor || "transparent";
        box.style.textAlign = card.alignment === "left" ? "left" : "center";
        if (card.alignment === "left") {
          titleEl.style.alignItems = "flex-start";
        } else {
        }
        void renderMarkdown(titleEl, card.title || "Untitled");
        void renderMarkdown(textEl, card.text || "");
      }
    };
  }
};

// src/cards/types/flashCard.ts
var import_obsidian2 = require("obsidian");

// src/cards/shared/imageStyle.ts
function applyImageStyle(img, card, grid) {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  const fit = (_b = (_a = card.imageFit) != null ? _a : grid.imageFit) != null ? _b : "cover";
  const height = (_d = (_c = card.imageHeight) != null ? _c : grid.imageHeight) != null ? _d : 180;
  const position = (_f = (_e = card.imagePosition) != null ? _e : grid.imagePosition) != null ? _f : "center";
  const radius = (_h = (_g = card.imageRadius) != null ? _g : grid.imageRadius) != null ? _h : 0;
  img.style.objectFit = fit;
  img.style.width = "100%";
  img.style.maxHeight = `${height}px`;
  img.style.objectPosition = position;
  img.style.borderRadius = `${radius}px`;
  img.style.width = "100%";
}

// src/cards/types/flashCard.ts
function isRecord3(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
var flashCardType = {
  type: "flashcard",
  displayName: "Flash card",
  editor: {
    title: "Edit flash card",
    fields: [
      // Group 1: Primary Content
      { kind: "text", key: "title", label: "Title" },
      { kind: "markdown", key: "text", label: "Text" },
      { kind: "toggle", key: "imageEnabled", label: "Show image", defaultValue: true },
      { kind: "image-file", key: "image", label: "Image" },
      // Group 2: Layout
      { kind: "number", key: "width", label: "Width (columns)", defaultValue: 1 },
      { kind: "number", key: "imageHeight", label: "Image height", min: 0, step: 10 },
      // Group 3: Styling Overrides
      {
        kind: "select",
        key: "imageFit",
        label: "Image fit",
        options: [
          { label: "Cover", value: "cover" },
          { label: "Contain", value: "contain" },
          { label: "Fill", value: "fill" },
          { label: "None", value: "none" },
          { label: "Scale-down", value: "scale-down" }
        ]
      },
      { kind: "text", key: "imagePosition", label: "Image position", placeholder: "e.g. center" },
      { kind: "number", key: "imageRadius", label: "Image radius", min: 0, step: 1 },
      {
        kind: "color",
        key: "backgroundColor",
        label: "Border color",
        defaultValue: "#cccccc"
      },
      {
        kind: "color",
        key: "textColor",
        label: "Title color",
        defaultValue: "#000000"
      }
    ]
  },
  normalize(raw) {
    if (!isRecord3(raw)) {
      return { id: createId("card"), type: "flashcard", title: "Untitled", text: "" };
    }
    const id = typeof raw.id === "string" && raw.id.trim().length > 0 ? raw.id.trim() : createId("card");
    return {
      id,
      type: "flashcard",
      title: typeof raw.title === "string" ? raw.title : "Untitled",
      text: typeof raw.text === "string" ? raw.text : "",
      backgroundColor: typeof raw.backgroundColor === "string" ? raw.backgroundColor : void 0,
      textColor: typeof raw.textColor === "string" ? raw.textColor : void 0,
      image: typeof raw.image === "string" ? raw.image : void 0,
      imageEnabled: typeof raw.imageEnabled === "boolean" ? raw.imageEnabled : void 0,
      imageFit: typeof raw.imageFit === "string" ? raw.imageFit : void 0,
      imageHeight: typeof raw.imageHeight === "number" ? raw.imageHeight : void 0,
      imagePosition: typeof raw.imagePosition === "string" ? raw.imagePosition : void 0,
      imageRadius: typeof raw.imageRadius === "number" ? raw.imageRadius : void 0,
      width: typeof raw.width === "number" ? raw.width : 1
    };
  },
  createView(ctx) {
    const box = document.createElement("div");
    box.className = "card-grid-card";
    const img = box.createEl("img");
    const titleEl = box.createEl("h4");
    const textEl = box.createDiv("card-text");
    function renderMarkdown(el, markdown) {
      return __async(this, null, function* () {
        el.empty();
        yield import_obsidian2.MarkdownRenderer.render(ctx.app, markdown || " ", el, ctx.sourcePath, ctx.plugin);
      });
    }
    function resolveImagePath(path) {
      const file = ctx.app.vault.getAbstractFileByPath(path);
      if (file instanceof import_obsidian2.TFile) {
        return ctx.app.vault.getResourcePath(file);
      }
      return path;
    }
    return {
      el: box,
      update(card, viewCtx) {
        var _a;
        box.style.setProperty("--card-width", String(card.width || 1));
        box.dataset.widthFraction = String(card.width || 1);
        box.dataset.cardId = card.id;
        box.style.border = `2px solid ${card.backgroundColor || "#ccc"}`;
        const enabled = card.imageEnabled !== false;
        if (enabled && card.image) {
          img.style.display = "";
          img.src = resolveImagePath(card.image);
          applyImageStyle(img, card, viewCtx.grid);
          const h = (_a = card.imageHeight) != null ? _a : viewCtx.grid.imageHeight;
          img.style.height = h ? `${h}px` : "auto";
          img.style.flex = "1 1 auto";
          img.style.maxHeight = "none";
          img.style.objectFit = card.imageFit || viewCtx.grid.imageFit || "cover";
        } else {
          img.style.display = "none";
        }
        titleEl.style.color = card.textColor || "#000000";
        titleEl.style.backgroundColor = card.backgroundColor || "transparent";
        void renderMarkdown(titleEl, card.title || "Untitled");
        void renderMarkdown(textEl, card.text || "");
      }
    };
  }
};

// src/cards/types/imageCard.ts
var import_obsidian3 = require("obsidian");
function isRecord4(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
var imageCardType = {
  type: "image",
  displayName: "Image card",
  editor: {
    title: "Edit image card",
    fields: [
      // Content
      { kind: "toggle", key: "imageEnabled", label: "Show image", defaultValue: true },
      { kind: "image-file", key: "image", label: "Image" },
      // Layout
      { kind: "number", key: "width", label: "Width (columns)", defaultValue: 1 },
      { kind: "number", key: "imageHeight", label: "Image height", min: 0, step: 10 },
      // Styling
      {
        kind: "select",
        key: "imageFit",
        label: "Image fit",
        options: [
          { label: "Cover", value: "cover" },
          { label: "Contain", value: "contain" },
          { label: "Fill", value: "fill" },
          { label: "None", value: "none" },
          { label: "Scale-down", value: "scale-down" }
        ]
      },
      { kind: "text", key: "imagePosition", label: "Image position", placeholder: "e.g. center" },
      { kind: "number", key: "imageRadius", label: "Image radius", min: 0, step: 1 },
      {
        kind: "color",
        key: "backgroundColor",
        label: "Border color",
        defaultValue: "#cccccc"
      }
    ]
  },
  normalize(raw) {
    if (!isRecord4(raw)) {
      return { id: createId("card"), type: "image" };
    }
    const id = typeof raw.id === "string" && raw.id.trim().length > 0 ? raw.id.trim() : createId("card");
    return {
      id,
      type: "image",
      backgroundColor: typeof raw.backgroundColor === "string" ? raw.backgroundColor : void 0,
      image: typeof raw.image === "string" ? raw.image : void 0,
      imageEnabled: typeof raw.imageEnabled === "boolean" ? raw.imageEnabled : void 0,
      imageFit: typeof raw.imageFit === "string" ? raw.imageFit : void 0,
      imageHeight: typeof raw.imageHeight === "number" ? raw.imageHeight : void 0,
      imagePosition: typeof raw.imagePosition === "string" ? raw.imagePosition : void 0,
      imageRadius: typeof raw.imageRadius === "number" ? raw.imageRadius : void 0,
      width: typeof raw.width === "number" ? raw.width : 1
    };
  },
  createView(ctx) {
    const box = document.createElement("div");
    box.className = "card-grid-card";
    box.style.padding = "0";
    box.style.overflow = "hidden";
    const img = box.createEl("img");
    function resolveImagePath(path) {
      const file = ctx.app.vault.getAbstractFileByPath(path);
      if (file instanceof import_obsidian3.TFile) {
        return ctx.app.vault.getResourcePath(file);
      }
      return path;
    }
    return {
      el: box,
      update(card, viewCtx) {
        var _a;
        box.style.setProperty("--card-width", String(card.width || 1));
        box.dataset.widthFraction = String(card.width || 1);
        box.dataset.cardId = card.id;
        box.style.border = `2px solid ${card.backgroundColor || "#ccc"}`;
        const enabled = card.imageEnabled !== false;
        if (enabled && card.image) {
          img.style.display = "";
          img.src = resolveImagePath(card.image);
          applyImageStyle(img, card, viewCtx.grid);
          const h = (_a = card.imageHeight) != null ? _a : viewCtx.grid.imageHeight;
          img.style.height = h ? `${h}px` : "auto";
          img.style.flex = "1 1 auto";
          img.style.maxHeight = "none";
          img.style.objectFit = card.imageFit || viewCtx.grid.imageFit || "cover";
        } else {
          img.style.display = "none";
        }
      }
    };
  }
};

// src/cards/types/spacerCard.ts
function isRecord5(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
var spacerCardType = {
  type: "spacer",
  displayName: "Spacer card",
  editor: {
    title: "Edit spacer",
    fields: [
      {
        kind: "number",
        key: "width",
        label: "Width (columns)",
        defaultValue: 1
      }
    ]
  },
  normalize(raw) {
    if (!isRecord5(raw)) {
      return { id: createId("card"), type: "spacer" };
    }
    const id = typeof raw.id === "string" && raw.id.trim().length > 0 ? raw.id.trim() : createId("card");
    return {
      id,
      type: "spacer",
      width: typeof raw.width === "number" ? raw.width : 1
    };
  },
  createView(ctx) {
    const box = document.createElement("div");
    box.className = "card-grid-spacer";
    box.addClass("card-grid-spacer-print-hide");
    return {
      el: box,
      update(card) {
        box.style.setProperty("--card-width", String(card.width || 1));
        box.dataset.widthFraction = String(card.width || 1);
        box.dataset.cardId = card.id;
      }
    };
  }
};

// src/cards/types/unknownCard.ts
function isRecord6(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
var unknownCardType = {
  type: "unknown",
  displayName: "Unknown card",
  editor: {
    title: "Unknown card",
    fields: [
      {
        kind: "number",
        key: "width",
        label: "Width (columns)",
        defaultValue: 1
        // Default to 1 column
      }
    ]
  },
  normalize(raw) {
    const obj = isRecord6(raw) ? raw : {};
    const id = typeof obj.id === "string" && obj.id.trim().length > 0 ? obj.id.trim() : createId("card");
    const type = typeof obj.type === "string" && obj.type.trim().length > 0 ? obj.type.trim() : "unknown";
    const width = typeof obj.width === "number" ? obj.width : 1;
    return {
      id,
      type,
      raw: obj,
      width
    };
  },
  createView(ctx) {
    const box = document.createElement("div");
    box.className = "card-grid-card";
    const title = box.createEl("h4", { text: "Unknown card type" });
    const pre = box.createEl("pre");
    pre.style.whiteSpace = "pre-wrap";
    pre.style.textAlign = "left";
    return {
      el: box,
      update(card, viewCtx) {
        box.style.setProperty("--card-width", String(card.width || 1));
        box.dataset.widthFraction = String(card.width || 1);
        box.dataset.cardId = card.id;
        title.style.color = "#000000";
        box.style.border = "2px solid #ccc";
        title.setText(`Unknown card type: ${card.type}`);
        pre.textContent = JSON.stringify(card.raw, null, 2);
      }
    };
  }
};

// src/cards/types/procedureCard.ts
var import_obsidian4 = require("obsidian");
function isRecord7(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
var procedureCardType = {
  type: "procedure",
  displayName: "Procedure card",
  editor: {
    title: "Edit procedure card",
    fields: [
      // Group 1: Primary Content
      { kind: "text", key: "title", label: "Title" },
      { kind: "markdown", key: "text", label: "Text" },
      { kind: "toggle", key: "imageEnabled", label: "Show image", defaultValue: true },
      { kind: "image-file", key: "image", label: "Image" },
      // Group 2: Layout
      { kind: "number", key: "width", label: "Width (columns)", defaultValue: 1 },
      { kind: "number", key: "imageHeight", label: "Image height", min: 0, step: 10 },
      // Group 3: Styling Overrides
      {
        kind: "select",
        key: "imageFit",
        label: "Image fit",
        options: [
          { label: "Cover", value: "cover" },
          { label: "Contain", value: "contain" },
          { label: "Fill", value: "fill" },
          { label: "None", value: "none" },
          { label: "Scale-down", value: "scale-down" }
        ]
      },
      { kind: "text", key: "imagePosition", label: "Image position", placeholder: "e.g. center" },
      { kind: "number", key: "imageRadius", label: "Image radius", min: 0, step: 1 },
      {
        kind: "color",
        key: "backgroundColor",
        label: "Border color",
        defaultValue: "#cccccc"
      },
      {
        kind: "color",
        key: "textColor",
        label: "Title color",
        defaultValue: "#000000"
      }
    ]
  },
  normalize(raw) {
    if (!isRecord7(raw)) {
      return { id: createId("card"), type: "procedure", title: "Untitled", text: "" };
    }
    const id = typeof raw.id === "string" && raw.id.trim().length > 0 ? raw.id.trim() : createId("card");
    return {
      id,
      type: "procedure",
      title: typeof raw.title === "string" ? raw.title : "Untitled",
      text: typeof raw.text === "string" ? raw.text : "",
      backgroundColor: typeof raw.backgroundColor === "string" ? raw.backgroundColor : void 0,
      textColor: typeof raw.textColor === "string" ? raw.textColor : void 0,
      image: typeof raw.image === "string" ? raw.image : void 0,
      imageEnabled: typeof raw.imageEnabled === "boolean" ? raw.imageEnabled : void 0,
      imageFit: typeof raw.imageFit === "string" ? raw.imageFit : void 0,
      imageHeight: typeof raw.imageHeight === "number" ? raw.imageHeight : void 0,
      imagePosition: typeof raw.imagePosition === "string" ? raw.imagePosition : void 0,
      imageRadius: typeof raw.imageRadius === "number" ? raw.imageRadius : void 0,
      width: typeof raw.width === "number" ? raw.width : 1
    };
  },
  createView(ctx) {
    const box = document.createElement("div");
    box.className = "card-grid-card card-type-procedure";
    box.style.display = "flex";
    box.style.flexDirection = "row";
    box.style.alignItems = "stretch";
    box.style.padding = "0";
    box.style.overflow = "hidden";
    const titleBox = box.createDiv("procedure-title-box");
    titleBox.style.flex = "0 0 24%";
    titleBox.style.padding = "10px";
    titleBox.style.borderRight = "1px solid var(--background-modifier-border)";
    titleBox.style.display = "flex";
    titleBox.style.alignItems = "flex-start";
    const titleEl = titleBox.createEl("h4");
    const textBox = box.createDiv("procedure-text-box");
    textBox.style.flex = "1";
    textBox.style.padding = "10px";
    const imageBox = box.createDiv("procedure-image-box");
    imageBox.style.flex = "0 0 38%";
    imageBox.style.display = "flex";
    imageBox.style.position = "relative";
    imageBox.style.flexDirection = "column";
    imageBox.style.overflow = "hidden";
    const img = imageBox.createEl("img");
    function renderMarkdown(el, markdown) {
      return __async(this, null, function* () {
        el.empty();
        yield import_obsidian4.MarkdownRenderer.render(ctx.app, markdown || " ", el, ctx.sourcePath, ctx.plugin);
      });
    }
    function resolveImagePath(path) {
      const file = ctx.app.vault.getAbstractFileByPath(path);
      if (file instanceof import_obsidian4.TFile) {
        return ctx.app.vault.getResourcePath(file);
      }
      return path;
    }
    return {
      el: box,
      update(card, viewCtx) {
        var _a;
        box.style.setProperty("--card-width", String(card.width || 1));
        box.dataset.widthFraction = String(card.width || 1);
        box.dataset.cardId = card.id;
        box.style.border = `2px solid ${card.backgroundColor || "#ccc"}`;
        titleBox.style.backgroundColor = card.backgroundColor || "transparent";
        titleEl.style.color = card.textColor || "";
        void renderMarkdown(titleEl, card.title || "Untitled");
        void renderMarkdown(textBox, card.text || "");
        const h = (_a = card.imageHeight) != null ? _a : viewCtx.grid.imageHeight;
        const enabled = card.imageEnabled !== false;
        if (enabled && card.image) {
          textBox.style.borderRight = "1px solid var(--background-modifier-border)";
          imageBox.style.display = "flex";
          imageBox.style.minHeight = h ? `${h}px` : "0px";
          img.src = resolveImagePath(card.image);
          applyImageStyle(img, card, viewCtx.grid);
          img.style.position = "absolute";
          img.style.top = "0";
          img.style.left = "0";
          img.style.height = "100%";
          img.style.width = "100%";
          img.style.minHeight = "0";
          img.style.maxHeight = "none";
          img.style.flex = "1 1 auto";
          img.style.objectFit = card.imageFit || viewCtx.grid.imageFit || "cover";
          img.style.objectPosition = card.imagePosition || viewCtx.grid.imagePosition || "center";
        } else {
          textBox.style.borderRight = "none";
          imageBox.style.display = "none";
          imageBox.style.minHeight = "0px";
          img.style.minHeight = "0px";
        }
      }
    };
  }
};

// src/domain/notifierCard.ts
var import_obsidian5 = require("obsidian");
function isRecord8(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
var notifierCardType = {
  type: "notifier",
  displayName: "Notifier card",
  editor: {
    title: "Edit notifier card",
    fields: [
      { kind: "text", key: "title", label: "Title" },
      { kind: "markdown", key: "text", label: "Text" },
      {
        kind: "select",
        key: "icon",
        label: "Icon",
        options: [
          { label: "Warning (\u26A0\uFE0F)", value: "\u26A0\uFE0F" },
          { label: "Info (\u2139\uFE0F)", value: "\u2139\uFE0F" },
          { label: "Check (\u2705)", value: "\u2705" },
          { label: "Error (\u274C)", value: "\u274C" },
          { label: "Bell (\u{1F514})", value: "\u{1F514}" },
          { label: "Lightbulb (\u{1F4A1})", value: "\u{1F4A1}" },
          { label: "Stop (\u{1F6D1})", value: "\u{1F6D1}" },
          { label: "None", value: "" }
        ]
      },
      {
        kind: "select",
        key: "alignment",
        label: "Alignment",
        options: [
          { label: "Left", value: "left" },
          { label: "Center", value: "center" }
        ]
      },
      { kind: "number", key: "titleSize", label: "Title size (px)", defaultValue: 28 },
      { kind: "number", key: "textSize", label: "Text size (px)", defaultValue: 16 },
      { kind: "color", key: "backgroundColor", label: "Background color", defaultValue: "#1a237e" },
      { kind: "color", key: "textColor", label: "Text color", defaultValue: "#ffffff" },
      { kind: "number", key: "width", label: "Width (columns)", defaultValue: 1 }
    ]
  },
  normalize(raw) {
    if (!isRecord8(raw)) {
      return { id: createId("card"), type: "notifier", title: "Notification", text: "" };
    }
    const id = typeof raw.id === "string" ? raw.id : createId("card");
    return {
      id,
      type: "notifier",
      title: typeof raw.title === "string" ? raw.title : "Notification",
      text: typeof raw.text === "string" ? raw.text : "",
      icon: typeof raw.icon === "string" ? raw.icon : "\u26A0\uFE0F",
      alignment: raw.alignment === "left" || raw.alignment === "center" ? raw.alignment : "center",
      titleSize: typeof raw.titleSize === "number" ? raw.titleSize : 28,
      textSize: typeof raw.textSize === "number" ? raw.textSize : 16,
      backgroundColor: typeof raw.backgroundColor === "string" ? raw.backgroundColor : "#1a237e",
      textColor: typeof raw.textColor === "string" ? raw.textColor : "#ffffff",
      width: typeof raw.width === "number" ? raw.width : 1
    };
  },
  createView(ctx) {
    const box = document.createElement("div");
    box.className = "card-grid-card card-type-notifier";
    box.style.display = "flex";
    box.style.flexDirection = "column";
    box.style.padding = "30px";
    const titleEl = box.createEl("h2");
    titleEl.style.margin = "0 0 10px 0";
    titleEl.style.lineHeight = "1.2";
    const textEl = box.createDiv("notifier-text");
    textEl.style.margin = "0";
    textEl.style.opacity = "0.95";
    function renderMarkdown(el, markdown) {
      return __async(this, null, function* () {
        el.empty();
        yield import_obsidian5.MarkdownRenderer.render(ctx.app, markdown || " ", el, ctx.sourcePath, ctx.plugin);
      });
    }
    return {
      el: box,
      update(card) {
        box.style.setProperty("--card-width", String(card.width || 1));
        box.dataset.widthFraction = String(card.width || 1);
        box.dataset.cardId = card.id;
        box.style.backgroundColor = card.backgroundColor || "#1a237e";
        box.style.color = card.textColor || "#ffffff";
        titleEl.style.color = card.textColor || "#ffffff";
        if (card.alignment === "left") {
          box.style.textAlign = "left";
          box.style.alignItems = "flex-start";
        } else {
          box.style.textAlign = "center";
          box.style.alignItems = "center";
        }
        titleEl.style.fontSize = `${card.titleSize || 28}px`;
        textEl.style.fontSize = `${card.textSize || 16}px`;
        const fullTitle = card.icon ? `${card.icon} ${card.title}` : card.title || "";
        titleEl.setText(fullTitle);
        void renderMarkdown(textEl, card.text || "");
      }
    };
  }
};

// src/domain/iconCard.ts
var import_obsidian6 = require("obsidian");
function isRecord9(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
var iconCardType = {
  type: "icon",
  displayName: "Icon card",
  editor: {
    title: "Edit icon card",
    fields: [
      {
        kind: "select",
        key: "icon",
        label: "Icon",
        options: [
          { label: "Arrow Right (\u2192)", value: "arrow-right" },
          { label: "Arrow Left (\u2190)", value: "arrow-left" },
          { label: "Arrow Up (\u2191)", value: "arrow-up" },
          { label: "Arrow Down (\u2193)", value: "arrow-down" },
          { label: "Double Arrow Right (\xBB)", value: "chevrons-right" },
          { label: "Double Arrow Left (\xAB)", value: "chevrons-left" },
          { label: "Chevrons Up", value: "chevrons-up" },
          { label: "Chevrons Down", value: "chevrons-down" },
          { label: "Check", value: "check" },
          { label: "Alert", value: "alert-triangle" },
          { label: "Info", value: "info" },
          { label: "Help", value: "help-circle" },
          { label: "Plus", value: "plus" },
          { label: "Minus", value: "minus" },
          { label: "Star", value: "star" },
          { label: "Heart", value: "heart" },
          { label: "Link", value: "link" },
          { label: "External Link", value: "external-link" },
          { label: "Search", value: "search" },
          { label: "Settings", value: "settings" },
          { label: "File", value: "file" },
          { label: "Folder", value: "folder" },
          { label: "Refresh", value: "refresh-cw" },
          { label: "Play", value: "play" }
        ],
        defaultValue: "arrow-right"
      },
      { kind: "markdown", key: "text", label: "Text (Optional)" },
      {
        kind: "select",
        key: "alignment",
        label: "Alignment",
        options: [
          { label: "Left", value: "left" },
          { label: "Center", value: "center" }
        ]
      },
      { kind: "number", key: "iconSize", label: "Icon size (px)", defaultValue: 48 },
      { kind: "number", key: "textSize", label: "Text size (px)", defaultValue: 14 },
      { kind: "color", key: "backgroundColor", label: "Background color", defaultValue: "transparent" },
      { kind: "color", key: "iconColor", label: "Icon color", defaultValue: "var(--text-normal)" },
      { kind: "color", key: "textColor", label: "Color", defaultValue: "var(--text-normal)" },
      { kind: "number", key: "width", label: "Width (columns)", defaultValue: 1 }
    ]
  },
  normalize(raw) {
    if (!isRecord9(raw)) {
      return { id: createId("card"), type: "icon", icon: "arrow-right" };
    }
    return {
      id: typeof raw.id === "string" ? raw.id : createId("card"),
      type: "icon",
      icon: typeof raw.icon === "string" ? raw.icon : "arrow-right",
      text: typeof raw.text === "string" ? raw.text : "",
      alignment: raw.alignment === "left" || raw.alignment === "center" ? raw.alignment : "center",
      iconSize: typeof raw.iconSize === "number" ? raw.iconSize : 48,
      textSize: typeof raw.textSize === "number" ? raw.textSize : 14,
      iconColor: typeof raw.iconColor === "string" ? raw.iconColor : void 0,
      backgroundColor: typeof raw.backgroundColor === "string" ? raw.backgroundColor : "transparent",
      textColor: typeof raw.textColor === "string" ? raw.textColor : "var(--text-normal)",
      width: typeof raw.width === "number" ? raw.width : 1
    };
  },
  createView(ctx) {
    const box = document.createElement("div");
    box.className = "card-grid-card card-type-icon";
    box.style.display = "flex";
    box.style.flexDirection = "column";
    box.style.justifyContent = "center";
    box.style.alignItems = "center";
    box.style.padding = "20px";
    const iconContainer = box.createDiv("icon-container");
    const textEl = box.createDiv("icon-text");
    textEl.style.marginTop = "10px";
    function renderMarkdown(el, markdown) {
      return __async(this, null, function* () {
        el.empty();
        if (!markdown) return;
        yield import_obsidian6.MarkdownRenderer.render(ctx.app, markdown, el, ctx.sourcePath, ctx.plugin);
      });
    }
    return {
      el: box,
      update(card) {
        box.style.setProperty("--card-width", String(card.width || 1));
        box.dataset.widthFraction = String(card.width || 1);
        box.dataset.cardId = card.id;
        box.style.backgroundColor = card.backgroundColor || "transparent";
        box.style.color = card.textColor || "var(--text-normal)";
        if (card.alignment === "left") {
          box.style.textAlign = "left";
          box.style.alignItems = "flex-start";
        } else {
          box.style.textAlign = "center";
          box.style.alignItems = "center";
        }
        iconContainer.empty();
        if (card.icon) {
          (0, import_obsidian6.setIcon)(iconContainer, card.icon);
          const svg = iconContainer.querySelector("svg");
          if (svg) {
            svg.style.width = `${card.iconSize || 48}px`;
            svg.style.height = `${card.iconSize || 48}px`;
            svg.style.stroke = card.iconColor || card.textColor || "currentColor";
          }
        }
        textEl.style.fontSize = `${card.textSize || 14}px`;
        void renderMarkdown(textEl, card.text || "");
      }
    };
  }
};

// src/cards/index.ts
function createDefaultRegistry() {
  const registry = new CardTypeRegistry();
  registry.register(textCardType);
  registry.register(flashCardType);
  registry.register(imageCardType);
  registry.register(procedureCardType);
  registry.register(iconCardType);
  registry.register(notifierCardType);
  registry.register(unknownCardType);
  registry.register(spacerCardType);
  return registry;
}

// src/controller/GridController.ts
var import_obsidian13 = require("obsidian");

// src/state/gridStore.ts
var GridStore = class {
  constructor(initial) {
    this.listeners = /* @__PURE__ */ new Set();
    this.state = initial;
  }
  getState() {
    return this.state;
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  dispatch(action) {
    const prev = this.state;
    const next = reduce(prev, action);
    if (next === prev) return;
    this.state = next;
    for (const l of this.listeners) l(next, prev);
  }
};
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function reduce(state, action) {
  switch (action.type) {
    case "grid/set-options": {
      const patch = action.patch;
      const next = __spreadValues(__spreadValues({}, state), patch);
      if (patch.columns !== void 0) next.columns = Math.max(1, Math.floor(patch.columns));
      if (patch.gap !== void 0) next.gap = Math.max(0, patch.gap);
      return next;
    }
    case "card/insert": {
      const cards = state.cards.slice();
      const at = action.atIndex === void 0 ? cards.length : clamp(action.atIndex, 0, cards.length);
      cards.splice(at, 0, action.card);
      return __spreadProps(__spreadValues({}, state), { cards });
    }
    case "card/delete": {
      const idx = state.cards.findIndex((c) => c.id === action.id);
      if (idx === -1) return state;
      const cards = state.cards.slice();
      cards.splice(idx, 1);
      return __spreadProps(__spreadValues({}, state), { cards });
    }
    case "card/replace": {
      const idx = state.cards.findIndex((c) => c.id === action.card.id);
      if (idx === -1) return state;
      const cards = state.cards.slice();
      cards[idx] = action.card;
      return __spreadProps(__spreadValues({}, state), { cards });
    }
    case "card/patch": {
      const idx = state.cards.findIndex((c) => c.id === action.id);
      if (idx === -1) return state;
      const existing = state.cards[idx];
      const updated = __spreadValues(__spreadValues({}, existing), action.patch);
      const cards = state.cards.slice();
      cards[idx] = updated;
      return __spreadProps(__spreadValues({}, state), { cards });
    }
    case "card/move": {
      const fromIndex = state.cards.findIndex((c) => c.id === action.id);
      if (fromIndex === -1) return state;
      const toIndex = clamp(action.toIndex, 0, state.cards.length - 1);
      if (toIndex === fromIndex) return state;
      const cards = state.cards.slice();
      const [item] = cards.splice(fromIndex, 1);
      cards.splice(toIndex, 0, item);
      return __spreadProps(__spreadValues({}, state), { cards });
    }
  }
}

// src/ui/menus/cardMenu.ts
var import_obsidian8 = require("obsidian");

// src/ui/modals/CardTypeSuggestModal.ts
var import_obsidian7 = require("obsidian");
var CardTypeSuggestModal = class extends import_obsidian7.SuggestModal {
  constructor(app, registry, onPick) {
    super(app);
    this.registry = registry;
    this.onPick = onPick;
    this.setPlaceholder("Choose card type\u2026");
  }
  getSuggestions(query) {
    const q = query.toLowerCase().trim();
    const defs = this.registry.list().filter((d) => d.type !== "unknown").map((d) => ({ type: d.type, name: d.displayName }));
    if (!q) return defs;
    return defs.filter(
      (d) => d.name.toLowerCase().includes(q) || d.type.toLowerCase().includes(q)
    );
  }
  renderSuggestion(item, el) {
    el.createDiv({ text: item.name });
    el.createDiv({ text: item.type, cls: "card-grid-suggest-sub" });
  }
  onChooseSuggestion(item) {
    this.onPick(item.type);
  }
};

// src/ui/menus/cardMenu.ts
function showCardMenu(evt, app, grid, registry, cardId, handlers) {
  evt.preventDefault();
  const menu = new import_obsidian8.Menu();
  menu.addItem((i) => i.setTitle("Edit card").setIcon("pencil").onClick(() => handlers.onEditCard(cardId)));
  menu.addSeparator();
  menu.addItem((i) => i.setTitle("Add card before").setIcon("plus-circle").onClick(() => handlers.onAddCardBefore(cardId)));
  menu.addItem((i) => i.setTitle("Add card after").setIcon("plus-circle").onClick(() => handlers.onAddCardAfter(cardId)));
  menu.addSeparator();
  menu.addItem((i) => i.setTitle("Clone card").setIcon("copy").onClick(() => handlers.onCloneCard(cardId)));
  menu.addItem((i) => i.setTitle("Move up").setIcon("arrow-up").onClick(() => handlers.onMoveCard(cardId, "up")));
  menu.addItem((i) => i.setTitle("Move down").setIcon("arrow-down").onClick(() => handlers.onMoveCard(cardId, "down")));
  menu.addSeparator();
  menu.addItem((i) => i.setTitle("Change card type...").setIcon("type").onClick(() => {
    new CardTypeSuggestModal(app, registry, (type) => {
      handlers.onChangeType(cardId, type);
    }).open();
  }));
  menu.addItem((item) => {
    item.setTitle("Columns").setIcon("layout-columns");
    const submenu = item.setSubmenu();
    [1, 2, 3, 4].forEach((num) => {
      submenu.addItem((subItem) => {
        subItem.setTitle(`${num} column${num > 1 ? "s" : ""}`).setChecked(grid.columns === num).onClick(() => handlers.onChangeColumns(num));
      });
    });
  });
  menu.addItem((item) => item.setTitle("Reset dimensions").setIcon("rotate-ccw").onClick(() => {
    var _a;
    return (_a = handlers.onResetGridWidths) == null ? void 0 : _a.call(handlers);
  }));
  menu.addSeparator();
  menu.addItem((i) => i.setTitle("Remove card").setIcon("trash").onClick(() => handlers.onDeleteCard(cardId)));
  menu.showAtMouseEvent(evt);
}

// src/ui/GridView.ts
var GridView = class {
  constructor(opts) {
    this.cardDom = /* @__PURE__ */ new Map();
    this.app = opts.app;
    this.plugin = opts.plugin;
    this.registry = opts.registry;
    this.sourcePath = opts.sourcePath;
    this.hostEl = opts.hostEl;
    this.onMenu = opts.onMenu;
    this.controller = opts.controller;
    this.container = this.hostEl.querySelector(".card-grid-container");
    if (!this.container) this.container = this.hostEl.createDiv("card-grid-container");
  }
  destroy() {
    this.cardDom.clear();
    this.container.empty();
  }
  update(grid) {
    var _a, _b;
    if ((_a = this.controller) == null ? void 0 : _a.isCurrentlyResizing()) {
      return;
    }
    this.container.style.display = "flex";
    this.container.style.flexDirection = "row";
    this.container.style.gap = `${grid.gap}px`;
    this.container.style.flexWrap = "wrap";
    this.hostEl.dataset.cardGridId = grid.id;
    const viewCtx = {
      app: this.app,
      plugin: this.plugin,
      sourcePath: this.sourcePath,
      grid
    };
    const existing = new Set(this.cardDom.keys());
    for (const card of grid.cards) {
      const entry = this.ensureCard(card, viewCtx);
      const cardWithWidth = card;
      const widthFraction = (_b = cardWithWidth.width) != null ? _b : 1;
      entry.view.el.style.setProperty("--card-width", String(widthFraction));
      entry.view.el.dataset.widthFraction = String(widthFraction);
      this.container.appendChild(entry.view.el);
      entry.view.update(card, viewCtx);
      entry.view.el.style.borderRadius = `${grid.borderRadius}px`;
      entry.view.el.style.overflow = "hidden";
      existing.delete(card.id);
    }
    for (const id of existing) {
      const entry = this.cardDom.get(id);
      entry == null ? void 0 : entry.view.el.remove();
      this.cardDom.delete(id);
    }
  }
  ensureCard(card, ctx) {
    var _a;
    const existing = this.cardDom.get(card.id);
    if (existing && existing.type === card.type) return existing;
    existing == null ? void 0 : existing.view.el.remove();
    const def = this.registry.get(card.type);
    const view = def.createView(ctx);
    view.el.dataset.cardId = card.id;
    const cardWithWidth = card;
    const widthFraction = (_a = cardWithWidth.width) != null ? _a : 1;
    view.el.style.setProperty("--card-width", String(widthFraction));
    view.el.dataset.widthFraction = String(widthFraction);
    view.el.style.minWidth = "0";
    view.el.addEventListener("contextmenu", (evt) => {
      showCardMenu(
        evt,
        this.app,
        ctx.grid,
        this.registry,
        card.id,
        this.onMenu
      );
    });
    const entry = { type: card.type, view };
    this.cardDom.set(card.id, entry);
    return entry;
  }
  getContainer() {
    return this.container;
  }
};

// src/infrastructure/CardGridRepository.ts
var import_obsidian10 = require("obsidian");

// src/infrastructure/yaml.ts
var import_obsidian9 = require("obsidian");
function cleanYamlSource(source) {
  return source.replace(/\u00a0/g, " ").replace(/\t/g, "  ").replace(/[^\S\r\n]+$/gm, "");
}
function parseYamlObject(source) {
  const cleaned = cleanYamlSource(source);
  return (0, import_obsidian9.parseYaml)(cleaned);
}
function stringifyYamlObject(value) {
  return (0, import_obsidian9.stringifyYaml)(value);
}

// src/infrastructure/CardGridRepository.ts
function isFenceStart(line) {
  return line.trimEnd() === "```card-grid";
}
function isFenceEnd(line) {
  return line.trimEnd() === "```";
}
function findCardGridBlocks(lines) {
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    if (!isFenceStart(lines[i])) continue;
    let j = i + 1;
    while (j < lines.length && !isFenceEnd(lines[j])) j++;
    if (j >= lines.length) break;
    const rawYaml = lines.slice(i + 1, j).join("\n");
    let parsedId;
    try {
      const parsed = parseYamlObject(cleanYamlSource(rawYaml));
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const id = parsed.id;
        if (typeof id === "string") parsedId = id;
      }
    } catch (e) {
    }
    blocks.push({ lineStart: i, lineEnd: j, rawYaml, parsedId });
    i = j;
  }
  return blocks;
}
var CardGridRepository = class {
  constructor(app) {
    this.app = app;
  }
  save(ref, data) {
    return __async(this, null, function* () {
      const file = this.app.vault.getAbstractFileByPath(ref.sourcePath);
      if (!(file instanceof import_obsidian10.TFile)) return;
      const raw = yield this.app.vault.read(file);
      const lines = raw.split("\n");
      const yamlObj = serializeCardGridData(data);
      const yaml = stringifyYamlObject(yamlObj).trimEnd();
      const newBlock = ["```card-grid", yaml, "```"].join("\n");
      const blocks = findCardGridBlocks(lines);
      const byId = blocks.find((b) => b.parsedId === data.id);
      const target = byId != null ? byId : this.resolveByRef(lines, ref, blocks);
      if (!target) return;
      const newLines = [
        ...lines.slice(0, target.lineStart),
        newBlock,
        ...lines.slice(target.lineEnd + 1)
      ];
      yield this.app.vault.modify(file, newLines.join("\n"));
    });
  }
  resolveByRef(lines, ref, blocks) {
    const { lineStart, lineEnd } = ref;
    if (lineStart !== void 0 && lineEnd !== void 0 && lineStart >= 0 && lineEnd >= lineStart && lineEnd < lines.length && isFenceStart(lines[lineStart]) && isFenceEnd(lines[lineEnd])) {
      return { lineStart, lineEnd, rawYaml: lines.slice(lineStart + 1, lineEnd).join("\n") };
    }
    if (blocks.length === 1) return blocks[0];
    return null;
  }
};

// src/ui/modals/CardEditorModal.ts
var import_obsidian12 = require("obsidian");

// node_modules/svelte/src/runtime/internal/utils.js
function noop() {
}
function run(fn) {
  return fn();
}
function blank_object() {
  return /* @__PURE__ */ Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function is_function(thing) {
  return typeof thing === "function";
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || a && typeof a === "object" || typeof a === "function";
}
function is_empty(obj) {
  return Object.keys(obj).length === 0;
}

// node_modules/svelte/src/runtime/internal/globals.js
var globals = typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : (
  // @ts-ignore Node typings have this
  global
);

// node_modules/svelte/src/runtime/internal/ResizeObserverSingleton.js
var ResizeObserverSingleton = class _ResizeObserverSingleton {
  /** @param {ResizeObserverOptions} options */
  constructor(options) {
    /**
     * @private
     * @readonly
     * @type {WeakMap<Element, import('./private.js').Listener>}
     */
    __publicField(this, "_listeners", "WeakMap" in globals ? /* @__PURE__ */ new WeakMap() : void 0);
    /**
     * @private
     * @type {ResizeObserver}
     */
    __publicField(this, "_observer");
    /** @type {ResizeObserverOptions} */
    __publicField(this, "options");
    this.options = options;
  }
  /**
   * @param {Element} element
   * @param {import('./private.js').Listener} listener
   * @returns {() => void}
   */
  observe(element2, listener) {
    this._listeners.set(element2, listener);
    this._getObserver().observe(element2, this.options);
    return () => {
      this._listeners.delete(element2);
      this._observer.unobserve(element2);
    };
  }
  /**
   * @private
   */
  _getObserver() {
    var _a;
    return (_a = this._observer) != null ? _a : this._observer = new ResizeObserver((entries) => {
      var _a2;
      for (const entry of entries) {
        _ResizeObserverSingleton.entries.set(entry.target, entry);
        (_a2 = this._listeners.get(entry.target)) == null ? void 0 : _a2(entry);
      }
    });
  }
};
ResizeObserverSingleton.entries = "WeakMap" in globals ? /* @__PURE__ */ new WeakMap() : void 0;

// node_modules/svelte/src/runtime/internal/dom.js
var is_hydrating = false;
function start_hydrating() {
  is_hydrating = true;
}
function end_hydrating() {
  is_hydrating = false;
}
function append(target, node) {
  target.appendChild(node);
}
function append_styles(target, style_sheet_id, styles) {
  const append_styles_to = get_root_for_style(target);
  if (!append_styles_to.getElementById(style_sheet_id)) {
    const style = element("style");
    style.id = style_sheet_id;
    style.textContent = styles;
    append_stylesheet(append_styles_to, style);
  }
}
function get_root_for_style(node) {
  if (!node) return document;
  const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
  if (root && /** @type {ShadowRoot} */
  root.host) {
    return (
      /** @type {ShadowRoot} */
      root
    );
  }
  return node.ownerDocument;
}
function append_stylesheet(node, style) {
  append(
    /** @type {Document} */
    node.head || node,
    style
  );
  return style.sheet;
}
function insert(target, node, anchor) {
  target.insertBefore(node, anchor || null);
}
function detach(node) {
  if (node.parentNode) {
    node.parentNode.removeChild(node);
  }
}
function destroy_each(iterations, detaching) {
  for (let i = 0; i < iterations.length; i += 1) {
    if (iterations[i]) iterations[i].d(detaching);
  }
}
function element(name) {
  return document.createElement(name);
}
function text(data) {
  return document.createTextNode(data);
}
function space() {
  return text(" ");
}
function empty() {
  return text("");
}
function listen(node, event, handler, options) {
  node.addEventListener(event, handler, options);
  return () => node.removeEventListener(event, handler, options);
}
function attr(node, attribute, value) {
  if (value == null) node.removeAttribute(attribute);
  else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value);
}
function to_number(value) {
  return value === "" ? null : +value;
}
function children(element2) {
  return Array.from(element2.childNodes);
}
function set_data(text2, data) {
  data = "" + data;
  if (text2.data === data) return;
  text2.data = /** @type {string} */
  data;
}
function set_input_value(input, value) {
  input.value = value == null ? "" : value;
}
function set_style(node, key, value, important) {
  if (value == null) {
    node.style.removeProperty(key);
  } else {
    node.style.setProperty(key, value, important ? "important" : "");
  }
}
function select_option(select, value, mounting) {
  for (let i = 0; i < select.options.length; i += 1) {
    const option = select.options[i];
    if (option.__value === value) {
      option.selected = true;
      return;
    }
  }
  if (!mounting || value !== void 0) {
    select.selectedIndex = -1;
  }
}
function select_value(select) {
  const selected_option = select.querySelector(":checked");
  return selected_option && selected_option.__value;
}
function toggle_class(element2, name, toggle) {
  element2.classList.toggle(name, !!toggle);
}
function get_custom_elements_slots(element2) {
  const result = {};
  element2.childNodes.forEach(
    /** @param {Element} node */
    (node) => {
      result[node.slot || "default"] = true;
    }
  );
  return result;
}

// node_modules/svelte/src/runtime/internal/lifecycle.js
var current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component) throw new Error("Function called outside component initialization");
  return current_component;
}
function onMount(fn) {
  get_current_component().$$.on_mount.push(fn);
}

// node_modules/svelte/src/runtime/internal/scheduler.js
var dirty_components = [];
var binding_callbacks = [];
var render_callbacks = [];
var flush_callbacks = [];
var resolved_promise = /* @__PURE__ */ Promise.resolve();
var update_scheduled = false;
function schedule_update() {
  if (!update_scheduled) {
    update_scheduled = true;
    resolved_promise.then(flush);
  }
}
function add_render_callback(fn) {
  render_callbacks.push(fn);
}
var seen_callbacks = /* @__PURE__ */ new Set();
var flushidx = 0;
function flush() {
  if (flushidx !== 0) {
    return;
  }
  const saved_component = current_component;
  do {
    try {
      while (flushidx < dirty_components.length) {
        const component = dirty_components[flushidx];
        flushidx++;
        set_current_component(component);
        update(component.$$);
      }
    } catch (e) {
      dirty_components.length = 0;
      flushidx = 0;
      throw e;
    }
    set_current_component(null);
    dirty_components.length = 0;
    flushidx = 0;
    while (binding_callbacks.length) binding_callbacks.pop()();
    for (let i = 0; i < render_callbacks.length; i += 1) {
      const callback = render_callbacks[i];
      if (!seen_callbacks.has(callback)) {
        seen_callbacks.add(callback);
        callback();
      }
    }
    render_callbacks.length = 0;
  } while (dirty_components.length);
  while (flush_callbacks.length) {
    flush_callbacks.pop()();
  }
  update_scheduled = false;
  seen_callbacks.clear();
  set_current_component(saved_component);
}
function update($$) {
  if ($$.fragment !== null) {
    $$.update();
    run_all($$.before_update);
    const dirty = $$.dirty;
    $$.dirty = [-1];
    $$.fragment && $$.fragment.p($$.ctx, dirty);
    $$.after_update.forEach(add_render_callback);
  }
}
function flush_render_callbacks(fns) {
  const filtered = [];
  const targets = [];
  render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
  targets.forEach((c) => c());
  render_callbacks = filtered;
}

// node_modules/svelte/src/runtime/internal/transitions.js
var outroing = /* @__PURE__ */ new Set();
function transition_in(block, local) {
  if (block && block.i) {
    outroing.delete(block);
    block.i(local);
  }
}

// node_modules/svelte/src/runtime/internal/each.js
function ensure_array_like(array_like_or_iterator) {
  return (array_like_or_iterator == null ? void 0 : array_like_or_iterator.length) !== void 0 ? array_like_or_iterator : Array.from(array_like_or_iterator);
}

// node_modules/svelte/src/shared/boolean_attributes.js
var _boolean_attributes = (
  /** @type {const} */
  [
    "allowfullscreen",
    "allowpaymentrequest",
    "async",
    "autofocus",
    "autoplay",
    "checked",
    "controls",
    "default",
    "defer",
    "disabled",
    "formnovalidate",
    "hidden",
    "inert",
    "ismap",
    "loop",
    "multiple",
    "muted",
    "nomodule",
    "novalidate",
    "open",
    "playsinline",
    "readonly",
    "required",
    "reversed",
    "selected"
  ]
);
var boolean_attributes = /* @__PURE__ */ new Set([..._boolean_attributes]);

// node_modules/svelte/src/runtime/internal/Component.js
function mount_component(component, target, anchor) {
  const { fragment, after_update } = component.$$;
  fragment && fragment.m(target, anchor);
  add_render_callback(() => {
    const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
    if (component.$$.on_destroy) {
      component.$$.on_destroy.push(...new_on_destroy);
    } else {
      run_all(new_on_destroy);
    }
    component.$$.on_mount = [];
  });
  after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
  const $$ = component.$$;
  if ($$.fragment !== null) {
    flush_render_callbacks($$.after_update);
    run_all($$.on_destroy);
    $$.fragment && $$.fragment.d(detaching);
    $$.on_destroy = $$.fragment = null;
    $$.ctx = [];
  }
}
function make_dirty(component, i) {
  if (component.$$.dirty[0] === -1) {
    dirty_components.push(component);
    schedule_update();
    component.$$.dirty.fill(0);
  }
  component.$$.dirty[i / 31 | 0] |= 1 << i % 31;
}
function init(component, options, instance2, create_fragment2, not_equal, props, append_styles2 = null, dirty = [-1]) {
  const parent_component = current_component;
  set_current_component(component);
  const $$ = component.$$ = {
    fragment: null,
    ctx: [],
    // state
    props,
    update: noop,
    not_equal,
    bound: blank_object(),
    // lifecycle
    on_mount: [],
    on_destroy: [],
    on_disconnect: [],
    before_update: [],
    after_update: [],
    context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
    // everything else
    callbacks: blank_object(),
    dirty,
    skip_bound: false,
    root: options.target || parent_component.$$.root
  };
  append_styles2 && append_styles2($$.root);
  let ready = false;
  $$.ctx = instance2 ? instance2(component, options.props || {}, (i, ret, ...rest) => {
    const value = rest.length ? rest[0] : ret;
    if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
      if (!$$.skip_bound && $$.bound[i]) $$.bound[i](value);
      if (ready) make_dirty(component, i);
    }
    return ret;
  }) : [];
  $$.update();
  ready = true;
  run_all($$.before_update);
  $$.fragment = create_fragment2 ? create_fragment2($$.ctx) : false;
  if (options.target) {
    if (options.hydrate) {
      start_hydrating();
      const nodes = children(options.target);
      $$.fragment && $$.fragment.l(nodes);
      nodes.forEach(detach);
    } else {
      $$.fragment && $$.fragment.c();
    }
    if (options.intro) transition_in(component.$$.fragment);
    mount_component(component, options.target, options.anchor);
    end_hydrating();
    flush();
  }
  set_current_component(parent_component);
}
var SvelteElement;
if (typeof HTMLElement === "function") {
  SvelteElement = class extends HTMLElement {
    constructor($$componentCtor, $$slots, use_shadow_dom) {
      super();
      /** The Svelte component constructor */
      __publicField(this, "$$ctor");
      /** Slots */
      __publicField(this, "$$s");
      /** The Svelte component instance */
      __publicField(this, "$$c");
      /** Whether or not the custom element is connected */
      __publicField(this, "$$cn", false);
      /** Component props data */
      __publicField(this, "$$d", {});
      /** `true` if currently in the process of reflecting component props back to attributes */
      __publicField(this, "$$r", false);
      /** @type {Record<string, CustomElementPropDefinition>} Props definition (name, reflected, type etc) */
      __publicField(this, "$$p_d", {});
      /** @type {Record<string, Function[]>} Event listeners */
      __publicField(this, "$$l", {});
      /** @type {Map<Function, Function>} Event listener unsubscribe functions */
      __publicField(this, "$$l_u", /* @__PURE__ */ new Map());
      this.$$ctor = $$componentCtor;
      this.$$s = $$slots;
      if (use_shadow_dom) {
        this.attachShadow({ mode: "open" });
      }
    }
    addEventListener(type, listener, options) {
      this.$$l[type] = this.$$l[type] || [];
      this.$$l[type].push(listener);
      if (this.$$c) {
        const unsub = this.$$c.$on(type, listener);
        this.$$l_u.set(listener, unsub);
      }
      super.addEventListener(type, listener, options);
    }
    removeEventListener(type, listener, options) {
      super.removeEventListener(type, listener, options);
      if (this.$$c) {
        const unsub = this.$$l_u.get(listener);
        if (unsub) {
          unsub();
          this.$$l_u.delete(listener);
        }
      }
      if (this.$$l[type]) {
        const idx = this.$$l[type].indexOf(listener);
        if (idx >= 0) {
          this.$$l[type].splice(idx, 1);
        }
      }
    }
    connectedCallback() {
      return __async(this, null, function* () {
        this.$$cn = true;
        if (!this.$$c) {
          let create_slot = function(name) {
            return () => {
              let node;
              const obj = {
                c: function create() {
                  node = element("slot");
                  if (name !== "default") {
                    attr(node, "name", name);
                  }
                },
                /**
                 * @param {HTMLElement} target
                 * @param {HTMLElement} [anchor]
                 */
                m: function mount(target, anchor) {
                  insert(target, node, anchor);
                },
                d: function destroy(detaching) {
                  if (detaching) {
                    detach(node);
                  }
                }
              };
              return obj;
            };
          };
          yield Promise.resolve();
          if (!this.$$cn || this.$$c) {
            return;
          }
          const $$slots = {};
          const existing_slots = get_custom_elements_slots(this);
          for (const name of this.$$s) {
            if (name in existing_slots) {
              $$slots[name] = [create_slot(name)];
            }
          }
          for (const attribute of this.attributes) {
            const name = this.$$g_p(attribute.name);
            if (!(name in this.$$d)) {
              this.$$d[name] = get_custom_element_value(name, attribute.value, this.$$p_d, "toProp");
            }
          }
          for (const key in this.$$p_d) {
            if (!(key in this.$$d) && this[key] !== void 0) {
              this.$$d[key] = this[key];
              delete this[key];
            }
          }
          this.$$c = new this.$$ctor({
            target: this.shadowRoot || this,
            props: __spreadProps(__spreadValues({}, this.$$d), {
              $$slots,
              $$scope: {
                ctx: []
              }
            })
          });
          const reflect_attributes = () => {
            this.$$r = true;
            for (const key in this.$$p_d) {
              this.$$d[key] = this.$$c.$$.ctx[this.$$c.$$.props[key]];
              if (this.$$p_d[key].reflect) {
                const attribute_value = get_custom_element_value(
                  key,
                  this.$$d[key],
                  this.$$p_d,
                  "toAttribute"
                );
                if (attribute_value == null) {
                  this.removeAttribute(this.$$p_d[key].attribute || key);
                } else {
                  this.setAttribute(this.$$p_d[key].attribute || key, attribute_value);
                }
              }
            }
            this.$$r = false;
          };
          this.$$c.$$.after_update.push(reflect_attributes);
          reflect_attributes();
          for (const type in this.$$l) {
            for (const listener of this.$$l[type]) {
              const unsub = this.$$c.$on(type, listener);
              this.$$l_u.set(listener, unsub);
            }
          }
          this.$$l = {};
        }
      });
    }
    // We don't need this when working within Svelte code, but for compatibility of people using this outside of Svelte
    // and setting attributes through setAttribute etc, this is helpful
    attributeChangedCallback(attr2, _oldValue, newValue) {
      var _a;
      if (this.$$r) return;
      attr2 = this.$$g_p(attr2);
      this.$$d[attr2] = get_custom_element_value(attr2, newValue, this.$$p_d, "toProp");
      (_a = this.$$c) == null ? void 0 : _a.$set({ [attr2]: this.$$d[attr2] });
    }
    disconnectedCallback() {
      this.$$cn = false;
      Promise.resolve().then(() => {
        if (!this.$$cn && this.$$c) {
          this.$$c.$destroy();
          this.$$c = void 0;
        }
      });
    }
    $$g_p(attribute_name) {
      return Object.keys(this.$$p_d).find(
        (key) => this.$$p_d[key].attribute === attribute_name || !this.$$p_d[key].attribute && key.toLowerCase() === attribute_name
      ) || attribute_name;
    }
  };
}
function get_custom_element_value(prop, value, props_definition, transform) {
  var _a;
  const type = (_a = props_definition[prop]) == null ? void 0 : _a.type;
  value = type === "Boolean" && typeof value !== "boolean" ? value != null : value;
  if (!transform || !props_definition[prop]) {
    return value;
  } else if (transform === "toAttribute") {
    switch (type) {
      case "Object":
      case "Array":
        return value == null ? null : JSON.stringify(value);
      case "Boolean":
        return value ? "" : null;
      case "Number":
        return value == null ? null : value;
      default:
        return value;
    }
  } else {
    switch (type) {
      case "Object":
      case "Array":
        return value && JSON.parse(value);
      case "Boolean":
        return value;
      // conversion already handled above
      case "Number":
        return value != null ? +value : value;
      default:
        return value;
    }
  }
}
var SvelteComponent = class {
  constructor() {
    /**
     * ### PRIVATE API
     *
     * Do not use, may change at any time
     *
     * @type {any}
     */
    __publicField(this, "$$");
    /**
     * ### PRIVATE API
     *
     * Do not use, may change at any time
     *
     * @type {any}
     */
    __publicField(this, "$$set");
  }
  /** @returns {void} */
  $destroy() {
    destroy_component(this, 1);
    this.$destroy = noop;
  }
  /**
   * @template {Extract<keyof Events, string>} K
   * @param {K} type
   * @param {((e: Events[K]) => void) | null | undefined} callback
   * @returns {() => void}
   */
  $on(type, callback) {
    if (!is_function(callback)) {
      return noop;
    }
    const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
    callbacks.push(callback);
    return () => {
      const index = callbacks.indexOf(callback);
      if (index !== -1) callbacks.splice(index, 1);
    };
  }
  /**
   * @param {Partial<Props>} props
   * @returns {void}
   */
  $set(props) {
    if (this.$$set && !is_empty(props)) {
      this.$$.skip_bound = true;
      this.$$set(props);
      this.$$.skip_bound = false;
    }
  }
};

// node_modules/svelte/src/shared/version.js
var PUBLIC_VERSION = "4";

// node_modules/svelte/src/runtime/internal/disclose-version/index.js
if (typeof window !== "undefined")
  (window.__svelte || (window.__svelte = { v: /* @__PURE__ */ new Set() })).v.add(PUBLIC_VERSION);

// src/ui/modals/ImagePickerModal.ts
var import_obsidian11 = require("obsidian");
var ImagePickerModal = class extends import_obsidian11.FuzzySuggestModal {
  constructor(app, onSelectFile) {
    super(app);
    this.onSelectFile = onSelectFile;
  }
  getItems() {
    return this.app.vault.getFiles().filter(
      (f) => ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(
        f.extension.toLowerCase()
      )
    );
  }
  getItemText(item) {
    return item.path;
  }
  renderSuggestion(fuzzyMatch, el) {
    const item = fuzzyMatch.item;
    const container = el.createDiv({ cls: "image-picker-suggestion" });
    const img = container.createEl("img", {
      cls: "image-picker-preview",
      attr: {
        src: this.app.vault.getResourcePath(item),
        alt: item.path
      }
    });
    container.createDiv({
      cls: "image-picker-filename",
      text: item.path
    });
  }
  onChooseItem(item) {
    this.onSelectFile(item);
  }
};

// src/ui/modals/Editor.svelte
function add_css(target) {
  append_styles(target, "svelte-tao351", '.cge-wrap.svelte-tao351.svelte-tao351{display:flex;gap:0;height:58vh;min-height:360px;margin:0 -16px -16px;overflow:hidden}.cge-left.svelte-tao351.svelte-tao351{flex:1.2;display:flex;flex-direction:column;overflow:hidden;border-right:1px solid var(--background-modifier-border)}.cge-fields.svelte-tao351.svelte-tao351{flex:1;overflow-y:auto;padding:6px 14px 0}.cge-row.svelte-tao351.svelte-tao351{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--background-modifier-border);min-height:36px}.cge-row-tall.svelte-tao351.svelte-tao351{align-items:flex-start;padding:8px 0}.cge-row.svelte-tao351.svelte-tao351:last-child{border-bottom:none}.cge-field-label.svelte-tao351.svelte-tao351{flex:0 0 100px;font-size:12px;font-weight:500;color:var(--text-muted);text-transform:capitalize;white-space:nowrap;padding-top:1px}.cge-row-tall.svelte-tao351 .cge-field-label.svelte-tao351{padding-top:6px}.cge-field-control.svelte-tao351.svelte-tao351{flex:1;min-width:0}.cge-text-input.svelte-tao351.svelte-tao351{width:100%;height:28px;padding:0 8px;font-size:13px;border:1px solid var(--background-modifier-border);border-radius:5px;background:var(--background-primary);color:var(--text-normal);box-sizing:border-box;outline:none}.cge-text-input.svelte-tao351.svelte-tao351:focus{border-color:var(--interactive-accent)}.cge-number-row.svelte-tao351.svelte-tao351{display:flex;align-items:center;gap:0;width:fit-content;border:1px solid var(--background-modifier-border);border-radius:5px;overflow:hidden;background:var(--background-primary)}.cge-stepper.svelte-tao351.svelte-tao351{width:26px;height:28px;border:none;background:var(--background-secondary);color:var(--text-normal);font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;line-height:1}.cge-stepper.svelte-tao351.svelte-tao351:hover{background:var(--background-modifier-hover)}.cge-number-input.svelte-tao351.svelte-tao351{width:52px;height:28px;border:none;border-left:1px solid var(--background-modifier-border);border-right:1px solid var(--background-modifier-border);background:var(--background-primary);color:var(--text-normal);font-size:13px;text-align:center;outline:none;padding:0;-moz-appearance:textfield}.cge-number-input.svelte-tao351.svelte-tao351::-webkit-inner-spin-button,.cge-number-input.svelte-tao351.svelte-tao351::-webkit-outer-spin-button{-webkit-appearance:none}.cge-toggle.svelte-tao351.svelte-tao351{display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none;width:fit-content}.cge-toggle.svelte-tao351.svelte-tao351::before{content:"";display:block;width:36px;height:20px;border-radius:10px;background:var(--background-modifier-border);position:relative;transition:background 0.18s;flex-shrink:0}.cge-toggle.cge-on.svelte-tao351.svelte-tao351::before{background:var(--interactive-accent)}.cge-thumb.svelte-tao351.svelte-tao351{display:none}.cge-toggle.svelte-tao351.svelte-tao351{position:relative}.cge-toggle.svelte-tao351.svelte-tao351::after{content:"";position:absolute;left:3px;top:50%;transform:translateY(-50%);width:14px;height:14px;border-radius:50%;background:white;box-shadow:0 1px 2px rgba(0, 0, 0, 0.2);transition:left 0.18s;pointer-events:none}.cge-toggle.cge-on.svelte-tao351.svelte-tao351::after{left:19px}.cge-toggle-label.svelte-tao351.svelte-tao351{font-size:12px;color:var(--text-muted);padding-left:44px}.cge-btn-group.svelte-tao351.svelte-tao351{display:flex;gap:3px;flex-wrap:wrap}.cge-opt-btn.svelte-tao351.svelte-tao351{padding:3px 10px;font-size:12px;border:1px solid var(--background-modifier-border);border-radius:4px;background:var(--background-primary);color:var(--text-muted);cursor:pointer;transition:all 0.12s;white-space:nowrap}.cge-opt-btn.svelte-tao351.svelte-tao351:hover{background:var(--background-modifier-hover);color:var(--text-normal)}.cge-opt-active.svelte-tao351.svelte-tao351{background:var(--interactive-accent) !important;color:var(--text-on-accent) !important;border-color:var(--interactive-accent) !important}.cge-select.svelte-tao351.svelte-tao351{height:28px;padding:0 8px;font-size:13px;border:1px solid var(--background-modifier-border);border-radius:5px;background:var(--background-primary);color:var(--text-normal);cursor:pointer;outline:none;max-width:200px}.cge-color-row.svelte-tao351.svelte-tao351{display:flex;align-items:center;gap:7px}.cge-color-swatch-btn.svelte-tao351.svelte-tao351{width:28px;height:28px;border-radius:5px;border:1px solid var(--background-modifier-border);cursor:pointer;flex-shrink:0;overflow:hidden;display:block}.cge-color-swatch-btn.svelte-tao351 input.svelte-tao351{opacity:0;width:100%;height:100%;cursor:pointer;padding:0;border:none}.cge-color-text.svelte-tao351.svelte-tao351{width:90px !important;font-family:var(--font-monospace);font-size:12px !important}.cge-image-row.svelte-tao351.svelte-tao351{display:flex;align-items:center;gap:6px;min-width:0}.cge-path-chip.svelte-tao351.svelte-tao351{font-size:11px;color:var(--text-muted);background:var(--background-secondary);border:1px solid var(--background-modifier-border);border-radius:4px;padding:3px 7px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px;font-family:var(--font-monospace)}.cge-action-btn.svelte-tao351.svelte-tao351{padding:3px 9px;font-size:12px;border:1px solid var(--background-modifier-border);border-radius:4px;background:var(--background-secondary);color:var(--text-normal);cursor:pointer;white-space:nowrap;flex-shrink:0}.cge-action-btn.svelte-tao351.svelte-tao351:hover{background:var(--background-modifier-hover)}.cge-danger-btn.svelte-tao351.svelte-tao351{color:var(--text-error);border-color:var(--text-error)}.cge-textarea.svelte-tao351.svelte-tao351{width:100%;padding:7px 9px;font-size:13px;font-family:var(--font-monospace);border:1px solid var(--background-modifier-border);border-radius:5px;background:var(--background-primary);color:var(--text-normal);resize:none;box-sizing:border-box;outline:none;line-height:1.5}.cge-textarea.svelte-tao351.svelte-tao351:focus{border-color:var(--interactive-accent)}.cge-footer.svelte-tao351.svelte-tao351{display:flex;justify-content:flex-end;gap:7px;padding:10px 14px;border-top:1px solid var(--background-modifier-border);flex-shrink:0}.cge-foot-btn.svelte-tao351.svelte-tao351{padding:5px 16px;font-size:13px;font-weight:500;border-radius:5px;cursor:pointer;border:1px solid var(--background-modifier-border)}.cge-cancel.svelte-tao351.svelte-tao351{background:var(--background-secondary);color:var(--text-muted)}.cge-cancel.svelte-tao351.svelte-tao351:hover{color:var(--text-normal);background:var(--background-modifier-hover)}.cge-save.svelte-tao351.svelte-tao351{background:var(--interactive-accent);color:var(--text-on-accent);border-color:transparent}.cge-save.svelte-tao351.svelte-tao351:hover{opacity:0.88}.cge-preview.svelte-tao351.svelte-tao351{flex:0.9;display:flex;flex-direction:column;background:var(--background-secondary);overflow:hidden;position:relative}.cge-preview-label.svelte-tao351.svelte-tao351{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:var(--text-faint);padding:10px 14px 6px;border-bottom:1px solid var(--background-modifier-border);background:var(--background-primary);flex-shrink:0}.cge-preview-inner.svelte-tao351.svelte-tao351{flex:1;display:flex;align-items:flex-start;justify-content:center;padding:20px 16px;overflow:hidden}');
}
function get_each_context(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[30] = list[i];
  child_ctx[31] = list;
  child_ctx[32] = i;
  return child_ctx;
}
function get_each_context_2(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[33] = list[i];
  return child_ctx;
}
function get_each_context_1(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[33] = list[i];
  return child_ctx;
}
function create_if_block_8(ctx) {
  let textarea;
  let textarea_placeholder_value;
  let mounted;
  let dispose;
  function textarea_input_handler() {
    ctx[25].call(
      textarea,
      /*field*/
      ctx[30]
    );
  }
  return {
    c() {
      var _a;
      textarea = element("textarea");
      attr(textarea, "class", "cge-textarea svelte-tao351");
      attr(textarea, "rows", "5");
      attr(textarea, "placeholder", textarea_placeholder_value = /*field*/
      (_a = ctx[30].placeholder) != null ? _a : "Markdown\u2026");
    },
    m(target, anchor) {
      insert(target, textarea, anchor);
      set_input_value(
        textarea,
        /*draft*/
        ctx[0][
          /*field*/
          ctx[30].key
        ]
      );
      if (!mounted) {
        dispose = listen(textarea, "input", textarea_input_handler);
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      var _a;
      ctx = new_ctx;
      if (dirty[0] & /*def*/
      2 && textarea_placeholder_value !== (textarea_placeholder_value = /*field*/
      (_a = ctx[30].placeholder) != null ? _a : "Markdown\u2026")) {
        attr(textarea, "placeholder", textarea_placeholder_value);
      }
      if (dirty[0] & /*draft, def*/
      3) {
        set_input_value(
          textarea,
          /*draft*/
          ctx[0][
            /*field*/
            ctx[30].key
          ]
        );
      }
    },
    d(detaching) {
      if (detaching) {
        detach(textarea);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_6(ctx) {
  let div;
  let span;
  let t0_value = (
    /*draft*/
    (ctx[0][
      /*field*/
      ctx[30].key
    ] ? (
      /*draft*/
      ctx[0][
        /*field*/
        ctx[30].key
      ].split("/").pop()
    ) : "None") + ""
  );
  let t0;
  let t1;
  let button;
  let t3;
  let mounted;
  let dispose;
  function click_handler_4() {
    return (
      /*click_handler_4*/
      ctx[23](
        /*field*/
        ctx[30]
      )
    );
  }
  let if_block = (
    /*draft*/
    ctx[0][
      /*field*/
      ctx[30].key
    ] && create_if_block_7(ctx)
  );
  return {
    c() {
      div = element("div");
      span = element("span");
      t0 = text(t0_value);
      t1 = space();
      button = element("button");
      button.textContent = "Browse";
      t3 = space();
      if (if_block) if_block.c();
      attr(span, "class", "cge-path-chip svelte-tao351");
      attr(button, "class", "cge-action-btn svelte-tao351");
      attr(div, "class", "cge-image-row svelte-tao351");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, span);
      append(span, t0);
      append(div, t1);
      append(div, button);
      append(div, t3);
      if (if_block) if_block.m(div, null);
      if (!mounted) {
        dispose = listen(button, "click", click_handler_4);
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty[0] & /*draft, def*/
      3 && t0_value !== (t0_value = /*draft*/
      (ctx[0][
        /*field*/
        ctx[30].key
      ] ? (
        /*draft*/
        ctx[0][
          /*field*/
          ctx[30].key
        ].split("/").pop()
      ) : "None") + "")) set_data(t0, t0_value);
      if (
        /*draft*/
        ctx[0][
          /*field*/
          ctx[30].key
        ]
      ) {
        if (if_block) {
          if_block.p(ctx, dirty);
        } else {
          if_block = create_if_block_7(ctx);
          if_block.c();
          if_block.m(div, null);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      if (if_block) if_block.d();
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_5(ctx) {
  let div;
  let label;
  let input0;
  let t;
  let input1;
  let mounted;
  let dispose;
  function input0_input_handler() {
    ctx[21].call(
      input0,
      /*field*/
      ctx[30]
    );
  }
  function input1_input_handler() {
    ctx[22].call(
      input1,
      /*field*/
      ctx[30]
    );
  }
  return {
    c() {
      div = element("div");
      label = element("label");
      input0 = element("input");
      t = space();
      input1 = element("input");
      attr(input0, "type", "color");
      attr(input0, "class", "svelte-tao351");
      attr(label, "class", "cge-color-swatch-btn svelte-tao351");
      set_style(
        label,
        "background",
        /*draft*/
        ctx[0][
          /*field*/
          ctx[30].key
        ] || "#cccccc"
      );
      attr(input1, "class", "cge-text-input cge-color-text svelte-tao351");
      attr(input1, "type", "text");
      attr(input1, "placeholder", "#cccccc");
      attr(input1, "maxlength", "7");
      attr(div, "class", "cge-color-row svelte-tao351");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, label);
      append(label, input0);
      set_input_value(
        input0,
        /*draft*/
        ctx[0][
          /*field*/
          ctx[30].key
        ]
      );
      append(div, t);
      append(div, input1);
      set_input_value(
        input1,
        /*draft*/
        ctx[0][
          /*field*/
          ctx[30].key
        ]
      );
      if (!mounted) {
        dispose = [
          listen(input0, "input", input0_input_handler),
          listen(input1, "input", input1_input_handler)
        ];
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty[0] & /*draft, def*/
      3) {
        set_input_value(
          input0,
          /*draft*/
          ctx[0][
            /*field*/
            ctx[30].key
          ]
        );
      }
      if (dirty[0] & /*draft, def*/
      3) {
        set_style(
          label,
          "background",
          /*draft*/
          ctx[0][
            /*field*/
            ctx[30].key
          ] || "#cccccc"
        );
      }
      if (dirty[0] & /*draft, def*/
      3 && input1.value !== /*draft*/
      ctx[0][
        /*field*/
        ctx[30].key
      ]) {
        set_input_value(
          input1,
          /*draft*/
          ctx[0][
            /*field*/
            ctx[30].key
          ]
        );
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block_3(ctx) {
  let if_block_anchor;
  function select_block_type_1(ctx2, dirty) {
    if (
      /*field*/
      ctx2[30].options.length <= 5
    ) return create_if_block_4;
    return create_else_block;
  }
  let current_block_type = select_block_type_1(ctx, [-1, -1]);
  let if_block = current_block_type(ctx);
  return {
    c() {
      if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
    },
    p(ctx2, dirty) {
      if (current_block_type === (current_block_type = select_block_type_1(ctx2, dirty)) && if_block) {
        if_block.p(ctx2, dirty);
      } else {
        if_block.d(1);
        if_block = current_block_type(ctx2);
        if (if_block) {
          if_block.c();
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      }
    },
    d(detaching) {
      if (detaching) {
        detach(if_block_anchor);
      }
      if_block.d(detaching);
    }
  };
}
function create_if_block_2(ctx) {
  let div1;
  let div0;
  let t0;
  let span;
  let t1_value = (
    /*draft*/
    ctx[0][
      /*field*/
      ctx[30].key
    ] ? "On" : "Off"
  );
  let t1;
  let div1_aria_checked_value;
  let mounted;
  let dispose;
  function click_handler_2() {
    return (
      /*click_handler_2*/
      ctx[17](
        /*field*/
        ctx[30]
      )
    );
  }
  function keydown_handler(...args) {
    return (
      /*keydown_handler*/
      ctx[18](
        /*field*/
        ctx[30],
        ...args
      )
    );
  }
  return {
    c() {
      div1 = element("div");
      div0 = element("div");
      t0 = space();
      span = element("span");
      t1 = text(t1_value);
      attr(div0, "class", "cge-thumb svelte-tao351");
      attr(span, "class", "cge-toggle-label svelte-tao351");
      attr(div1, "class", "cge-toggle svelte-tao351");
      attr(div1, "role", "checkbox");
      attr(div1, "aria-checked", div1_aria_checked_value = /*draft*/
      ctx[0][
        /*field*/
        ctx[30].key
      ]);
      attr(div1, "tabindex", "0");
      toggle_class(
        div1,
        "cge-on",
        /*draft*/
        ctx[0][
          /*field*/
          ctx[30].key
        ]
      );
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      append(div1, div0);
      append(div1, t0);
      append(div1, span);
      append(span, t1);
      if (!mounted) {
        dispose = [
          listen(div1, "click", click_handler_2),
          listen(div1, "keydown", keydown_handler)
        ];
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty[0] & /*draft, def*/
      3 && t1_value !== (t1_value = /*draft*/
      ctx[0][
        /*field*/
        ctx[30].key
      ] ? "On" : "Off")) set_data(t1, t1_value);
      if (dirty[0] & /*draft, def*/
      3 && div1_aria_checked_value !== (div1_aria_checked_value = /*draft*/
      ctx[0][
        /*field*/
        ctx[30].key
      ])) {
        attr(div1, "aria-checked", div1_aria_checked_value);
      }
      if (dirty[0] & /*draft, def*/
      3) {
        toggle_class(
          div1,
          "cge-on",
          /*draft*/
          ctx[0][
            /*field*/
            ctx[30].key
          ]
        );
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div1);
      }
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block_1(ctx) {
  let div;
  let button0;
  let t1;
  let input;
  let input_step_value;
  let input_min_value;
  let t2;
  let button1;
  let mounted;
  let dispose;
  function click_handler() {
    return (
      /*click_handler*/
      ctx[14](
        /*field*/
        ctx[30]
      )
    );
  }
  function input_input_handler_1() {
    ctx[15].call(
      input,
      /*field*/
      ctx[30]
    );
  }
  function click_handler_1() {
    return (
      /*click_handler_1*/
      ctx[16](
        /*field*/
        ctx[30]
      )
    );
  }
  return {
    c() {
      var _a, _b;
      div = element("div");
      button0 = element("button");
      button0.textContent = "\u2212";
      t1 = space();
      input = element("input");
      t2 = space();
      button1 = element("button");
      button1.textContent = "+";
      attr(button0, "class", "cge-stepper svelte-tao351");
      attr(input, "class", "cge-number-input svelte-tao351");
      attr(input, "type", "number");
      attr(input, "step", input_step_value = /*field*/
      (_a = ctx[30].step) != null ? _a : 1);
      attr(input, "min", input_min_value = /*field*/
      (_b = ctx[30].min) != null ? _b : void 0);
      attr(button1, "class", "cge-stepper svelte-tao351");
      attr(div, "class", "cge-number-row svelte-tao351");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, button0);
      append(div, t1);
      append(div, input);
      set_input_value(
        input,
        /*draft*/
        ctx[0][
          /*field*/
          ctx[30].key
        ]
      );
      append(div, t2);
      append(div, button1);
      if (!mounted) {
        dispose = [
          listen(button0, "click", click_handler),
          listen(input, "input", input_input_handler_1),
          listen(button1, "click", click_handler_1)
        ];
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      var _a, _b;
      ctx = new_ctx;
      if (dirty[0] & /*def*/
      2 && input_step_value !== (input_step_value = /*field*/
      (_a = ctx[30].step) != null ? _a : 1)) {
        attr(input, "step", input_step_value);
      }
      if (dirty[0] & /*def*/
      2 && input_min_value !== (input_min_value = /*field*/
      (_b = ctx[30].min) != null ? _b : void 0)) {
        attr(input, "min", input_min_value);
      }
      if (dirty[0] & /*draft, def*/
      3 && to_number(input.value) !== /*draft*/
      ctx[0][
        /*field*/
        ctx[30].key
      ]) {
        set_input_value(
          input,
          /*draft*/
          ctx[0][
            /*field*/
            ctx[30].key
          ]
        );
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block(ctx) {
  let input;
  let input_placeholder_value;
  let mounted;
  let dispose;
  function input_input_handler() {
    ctx[13].call(
      input,
      /*field*/
      ctx[30]
    );
  }
  return {
    c() {
      var _a;
      input = element("input");
      attr(input, "class", "cge-text-input svelte-tao351");
      attr(input, "type", "text");
      attr(input, "placeholder", input_placeholder_value = /*field*/
      (_a = ctx[30].placeholder) != null ? _a : "");
    },
    m(target, anchor) {
      insert(target, input, anchor);
      set_input_value(
        input,
        /*draft*/
        ctx[0][
          /*field*/
          ctx[30].key
        ]
      );
      if (!mounted) {
        dispose = listen(input, "input", input_input_handler);
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      var _a;
      ctx = new_ctx;
      if (dirty[0] & /*def*/
      2 && input_placeholder_value !== (input_placeholder_value = /*field*/
      (_a = ctx[30].placeholder) != null ? _a : "")) {
        attr(input, "placeholder", input_placeholder_value);
      }
      if (dirty[0] & /*draft, def*/
      3 && input.value !== /*draft*/
      ctx[0][
        /*field*/
        ctx[30].key
      ]) {
        set_input_value(
          input,
          /*draft*/
          ctx[0][
            /*field*/
            ctx[30].key
          ]
        );
      }
    },
    d(detaching) {
      if (detaching) {
        detach(input);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_7(ctx) {
  let button;
  let mounted;
  let dispose;
  function click_handler_5() {
    return (
      /*click_handler_5*/
      ctx[24](
        /*field*/
        ctx[30]
      )
    );
  }
  return {
    c() {
      button = element("button");
      button.textContent = "\u2715";
      attr(button, "class", "cge-action-btn cge-danger-btn svelte-tao351");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      if (!mounted) {
        dispose = listen(button, "click", click_handler_5);
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
    },
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_else_block(ctx) {
  let select;
  let mounted;
  let dispose;
  let each_value_2 = ensure_array_like(
    /*field*/
    ctx[30].options
  );
  let each_blocks = [];
  for (let i = 0; i < each_value_2.length; i += 1) {
    each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
  }
  function select_change_handler() {
    ctx[20].call(
      select,
      /*field*/
      ctx[30]
    );
  }
  return {
    c() {
      select = element("select");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      attr(select, "class", "cge-select svelte-tao351");
      if (
        /*draft*/
        ctx[0][
          /*field*/
          ctx[30].key
        ] === void 0
      ) add_render_callback(select_change_handler);
    },
    m(target, anchor) {
      insert(target, select, anchor);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(select, null);
        }
      }
      select_option(
        select,
        /*draft*/
        ctx[0][
          /*field*/
          ctx[30].key
        ],
        true
      );
      if (!mounted) {
        dispose = listen(select, "change", select_change_handler);
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty[0] & /*def*/
      2) {
        each_value_2 = ensure_array_like(
          /*field*/
          ctx[30].options
        );
        let i;
        for (i = 0; i < each_value_2.length; i += 1) {
          const child_ctx = get_each_context_2(ctx, each_value_2, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
            each_blocks[i] = create_each_block_2(child_ctx);
            each_blocks[i].c();
            each_blocks[i].m(select, null);
          }
        }
        for (; i < each_blocks.length; i += 1) {
          each_blocks[i].d(1);
        }
        each_blocks.length = each_value_2.length;
      }
      if (dirty[0] & /*draft, def*/
      3) {
        select_option(
          select,
          /*draft*/
          ctx[0][
            /*field*/
            ctx[30].key
          ]
        );
      }
    },
    d(detaching) {
      if (detaching) {
        detach(select);
      }
      destroy_each(each_blocks, detaching);
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_4(ctx) {
  let div;
  let each_value_1 = ensure_array_like(
    /*field*/
    ctx[30].options
  );
  let each_blocks = [];
  for (let i = 0; i < each_value_1.length; i += 1) {
    each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
  }
  return {
    c() {
      div = element("div");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      attr(div, "class", "cge-btn-group svelte-tao351");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(div, null);
        }
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*draft, def*/
      3) {
        each_value_1 = ensure_array_like(
          /*field*/
          ctx2[30].options
        );
        let i;
        for (i = 0; i < each_value_1.length; i += 1) {
          const child_ctx = get_each_context_1(ctx2, each_value_1, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
            each_blocks[i] = create_each_block_1(child_ctx);
            each_blocks[i].c();
            each_blocks[i].m(div, null);
          }
        }
        for (; i < each_blocks.length; i += 1) {
          each_blocks[i].d(1);
        }
        each_blocks.length = each_value_1.length;
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      destroy_each(each_blocks, detaching);
    }
  };
}
function create_each_block_2(ctx) {
  let option;
  let t_value = (
    /*opt*/
    ctx[33].label + ""
  );
  let t;
  let option_value_value;
  return {
    c() {
      option = element("option");
      t = text(t_value);
      option.__value = option_value_value = /*opt*/
      ctx[33].value;
      set_input_value(option, option.__value);
    },
    m(target, anchor) {
      insert(target, option, anchor);
      append(option, t);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*def*/
      2 && t_value !== (t_value = /*opt*/
      ctx2[33].label + "")) set_data(t, t_value);
      if (dirty[0] & /*def*/
      2 && option_value_value !== (option_value_value = /*opt*/
      ctx2[33].value)) {
        option.__value = option_value_value;
        set_input_value(option, option.__value);
      }
    },
    d(detaching) {
      if (detaching) {
        detach(option);
      }
    }
  };
}
function create_each_block_1(ctx) {
  let button;
  let t_value = (
    /*opt*/
    ctx[33].label + ""
  );
  let t;
  let mounted;
  let dispose;
  function click_handler_3() {
    return (
      /*click_handler_3*/
      ctx[19](
        /*field*/
        ctx[30],
        /*opt*/
        ctx[33]
      )
    );
  }
  return {
    c() {
      button = element("button");
      t = text(t_value);
      attr(button, "class", "cge-opt-btn svelte-tao351");
      toggle_class(
        button,
        "cge-opt-active",
        /*draft*/
        ctx[0][
          /*field*/
          ctx[30].key
        ] === /*opt*/
        ctx[33].value
      );
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, t);
      if (!mounted) {
        dispose = listen(button, "click", click_handler_3);
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty[0] & /*def*/
      2 && t_value !== (t_value = /*opt*/
      ctx[33].label + "")) set_data(t, t_value);
      if (dirty[0] & /*draft, def*/
      3) {
        toggle_class(
          button,
          "cge-opt-active",
          /*draft*/
          ctx[0][
            /*field*/
            ctx[30].key
          ] === /*opt*/
          ctx[33].value
        );
      }
    },
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_each_block(ctx) {
  let div2;
  let div0;
  let t0_value = (
    /*field*/
    ctx[30].label + ""
  );
  let t0;
  let t1;
  let div1;
  let t2;
  function select_block_type(ctx2, dirty) {
    if (
      /*field*/
      ctx2[30].kind === "text"
    ) return create_if_block;
    if (
      /*field*/
      ctx2[30].kind === "number"
    ) return create_if_block_1;
    if (
      /*field*/
      ctx2[30].kind === "toggle"
    ) return create_if_block_2;
    if (
      /*field*/
      ctx2[30].kind === "select"
    ) return create_if_block_3;
    if (
      /*field*/
      ctx2[30].kind === "color"
    ) return create_if_block_5;
    if (
      /*field*/
      ctx2[30].kind === "image-file"
    ) return create_if_block_6;
    if (
      /*field*/
      ctx2[30].kind === "markdown"
    ) return create_if_block_8;
  }
  let current_block_type = select_block_type(ctx, [-1, -1]);
  let if_block = current_block_type && current_block_type(ctx);
  return {
    c() {
      div2 = element("div");
      div0 = element("div");
      t0 = text(t0_value);
      t1 = space();
      div1 = element("div");
      if (if_block) if_block.c();
      t2 = space();
      attr(div0, "class", "cge-field-label svelte-tao351");
      attr(div1, "class", "cge-field-control svelte-tao351");
      attr(div2, "class", "cge-row svelte-tao351");
      toggle_class(
        div2,
        "cge-row-tall",
        /*field*/
        ctx[30].kind === "markdown"
      );
    },
    m(target, anchor) {
      insert(target, div2, anchor);
      append(div2, div0);
      append(div0, t0);
      append(div2, t1);
      append(div2, div1);
      if (if_block) if_block.m(div1, null);
      append(div2, t2);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*def*/
      2 && t0_value !== (t0_value = /*field*/
      ctx2[30].label + "")) set_data(t0, t0_value);
      if (current_block_type === (current_block_type = select_block_type(ctx2, dirty)) && if_block) {
        if_block.p(ctx2, dirty);
      } else {
        if (if_block) if_block.d(1);
        if_block = current_block_type && current_block_type(ctx2);
        if (if_block) {
          if_block.c();
          if_block.m(div1, null);
        }
      }
      if (dirty[0] & /*def*/
      2) {
        toggle_class(
          div2,
          "cge-row-tall",
          /*field*/
          ctx2[30].kind === "markdown"
        );
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div2);
      }
      if (if_block) {
        if_block.d();
      }
    }
  };
}
function create_fragment(ctx) {
  let div6;
  let div2;
  let div0;
  let t0;
  let div1;
  let button0;
  let t2;
  let button1;
  let t4;
  let div5;
  let div3;
  let t6;
  let div4;
  let mounted;
  let dispose;
  let each_value = ensure_array_like(
    /*def*/
    ctx[1].editor.fields
  );
  let each_blocks = [];
  for (let i = 0; i < each_value.length; i += 1) {
    each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
  }
  return {
    c() {
      div6 = element("div");
      div2 = element("div");
      div0 = element("div");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      t0 = space();
      div1 = element("div");
      button0 = element("button");
      button0.textContent = "Cancel";
      t2 = space();
      button1 = element("button");
      button1.textContent = "Save";
      t4 = space();
      div5 = element("div");
      div3 = element("div");
      div3.textContent = "Preview";
      t6 = space();
      div4 = element("div");
      attr(div0, "class", "cge-fields svelte-tao351");
      attr(button0, "class", "cge-foot-btn cge-cancel svelte-tao351");
      attr(button1, "class", "cge-foot-btn cge-save svelte-tao351");
      attr(div1, "class", "cge-footer svelte-tao351");
      attr(div2, "class", "cge-left svelte-tao351");
      attr(div3, "class", "cge-preview-label svelte-tao351");
      attr(div4, "class", "cge-preview-inner svelte-tao351");
      attr(div5, "class", "cge-preview svelte-tao351");
      attr(div6, "class", "cge-wrap svelte-tao351");
    },
    m(target, anchor) {
      insert(target, div6, anchor);
      append(div6, div2);
      append(div2, div0);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(div0, null);
        }
      }
      append(div2, t0);
      append(div2, div1);
      append(div1, button0);
      append(div1, t2);
      append(div1, button1);
      append(div6, t4);
      append(div6, div5);
      append(div5, div3);
      append(div5, t6);
      append(div5, div4);
      ctx[27](div4);
      ctx[28](div5);
      if (!mounted) {
        dispose = [
          listen(button0, "click", function() {
            if (is_function(
              /*onCancel*/
              ctx[3]
            )) ctx[3].apply(this, arguments);
          }),
          listen(
            button1,
            "click",
            /*click_handler_6*/
            ctx[26]
          )
        ];
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty[0] & /*def, draft, openImagePicker*/
      67) {
        each_value = ensure_array_like(
          /*def*/
          ctx[1].editor.fields
        );
        let i;
        for (i = 0; i < each_value.length; i += 1) {
          const child_ctx = get_each_context(ctx, each_value, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
            each_blocks[i] = create_each_block(child_ctx);
            each_blocks[i].c();
            each_blocks[i].m(div0, null);
          }
        }
        for (; i < each_blocks.length; i += 1) {
          each_blocks[i].d(1);
        }
        each_blocks.length = each_value.length;
      }
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching) {
        detach(div6);
      }
      destroy_each(each_blocks, detaching);
      ctx[27](null);
      ctx[28](null);
      mounted = false;
      run_all(dispose);
    }
  };
}
function instance($$self, $$props, $$invalidate) {
  let { app } = $$props;
  let { plugin } = $$props;
  let { grid } = $$props;
  let { def } = $$props;
  let { draft } = $$props;
  let { sourcePath } = $$props;
  let { onSave } = $$props;
  let { onCancel } = $$props;
  let previewContainer;
  let previewView;
  let debounceTimer;
  let previewPanelEl;
  onMount(() => {
    const ctx = { app, plugin, sourcePath, grid };
    $$invalidate(11, previewView = def.createView(ctx));
    $$invalidate(11, previewView.el.style.cssText = "", previewView);
    previewContainer.appendChild(previewView.el);
    updatePreview();
  });
  function updatePreview() {
    var _a;
    if (!previewView) return;
    const ctx = { app, plugin, sourcePath, grid };
    const gridHost = document.querySelector(`[data-card-grid-id="${grid.id}"]`);
    const gridContainer = gridHost === null || gridHost === void 0 ? void 0 : gridHost.querySelector(".card-grid-container");
    const gridWidth = (gridContainer === null || gridContainer === void 0 ? void 0 : gridContainer.offsetWidth) || 800;
    const columns = grid.columns || 3;
    const gap = (_a = grid.gap) !== null && _a !== void 0 ? _a : 10;
    const widthFraction = Number(draft.width) || 1;
    const realPixelWidth = (gridWidth + gap) / columns * widthFraction - gap;
    const normalized = def.normalize(draft);
    previewView.update(normalized, ctx);
    $$invalidate(11, previewView.el.style.width = `${realPixelWidth}px`, previewView);
    $$invalidate(11, previewView.el.style.height = "auto", previewView);
    $$invalidate(11, previewView.el.style.flex = "none", previewView);
    const ratio = widthFraction / columns;
    let zoom = ratio > 0.8 ? 0.5 : ratio > 0.4 ? 0.6 : 0.8;
    if (def.type === "procedure" && ratio > 0.4) zoom = 0.45;
    $$invalidate(11, previewView.el.style.zoom = String(zoom), previewView);
  }
  function openImagePicker(key) {
    new ImagePickerModal(
      app,
      (file) => {
        $$invalidate(0, draft[key] = file.path, draft);
        $$invalidate(0, draft = Object.assign({}, draft));
      }
    ).open();
  }
  function input_input_handler(field) {
    draft[field.key] = this.value;
    $$invalidate(0, draft);
    $$invalidate(1, def);
  }
  const click_handler = (field) => {
    var _a;
    $$invalidate(0, draft[field.key] = (Number(draft[field.key]) || 0) - ((_a = field.step) != null ? _a : 1), draft);
    $$invalidate(0, draft = __spreadValues({}, draft));
  };
  function input_input_handler_1(field) {
    draft[field.key] = to_number(this.value);
    $$invalidate(0, draft);
    $$invalidate(1, def);
  }
  const click_handler_1 = (field) => {
    var _a;
    $$invalidate(0, draft[field.key] = (Number(draft[field.key]) || 0) + ((_a = field.step) != null ? _a : 1), draft);
    $$invalidate(0, draft = __spreadValues({}, draft));
  };
  const click_handler_2 = (field) => {
    $$invalidate(0, draft[field.key] = !draft[field.key], draft);
    $$invalidate(0, draft = __spreadValues({}, draft));
  };
  const keydown_handler = (field, e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      $$invalidate(0, draft[field.key] = !draft[field.key], draft);
      $$invalidate(0, draft = __spreadValues({}, draft));
    }
  };
  const click_handler_3 = (field, opt) => {
    $$invalidate(0, draft[field.key] = opt.value, draft);
    $$invalidate(0, draft = __spreadValues({}, draft));
  };
  function select_change_handler(field) {
    draft[field.key] = select_value(this);
    $$invalidate(0, draft);
    $$invalidate(1, def);
  }
  function input0_input_handler(field) {
    draft[field.key] = this.value;
    $$invalidate(0, draft);
    $$invalidate(1, def);
  }
  function input1_input_handler(field) {
    draft[field.key] = this.value;
    $$invalidate(0, draft);
    $$invalidate(1, def);
  }
  const click_handler_4 = (field) => openImagePicker(field.key);
  const click_handler_5 = (field) => {
    $$invalidate(0, draft[field.key] = "", draft);
    $$invalidate(0, draft = __spreadValues({}, draft));
  };
  function textarea_input_handler(field) {
    draft[field.key] = this.value;
    $$invalidate(0, draft);
    $$invalidate(1, def);
  }
  const click_handler_6 = () => onSave(draft);
  function div4_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      previewContainer = $$value;
      $$invalidate(4, previewContainer);
    });
  }
  function div5_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      previewPanelEl = $$value;
      $$invalidate(5, previewPanelEl);
    });
  }
  $$self.$$set = ($$props2) => {
    if ("app" in $$props2) $$invalidate(7, app = $$props2.app);
    if ("plugin" in $$props2) $$invalidate(8, plugin = $$props2.plugin);
    if ("grid" in $$props2) $$invalidate(9, grid = $$props2.grid);
    if ("def" in $$props2) $$invalidate(1, def = $$props2.def);
    if ("draft" in $$props2) $$invalidate(0, draft = $$props2.draft);
    if ("sourcePath" in $$props2) $$invalidate(10, sourcePath = $$props2.sourcePath);
    if ("onSave" in $$props2) $$invalidate(2, onSave = $$props2.onSave);
    if ("onCancel" in $$props2) $$invalidate(3, onCancel = $$props2.onCancel);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty[0] & /*draft, previewView, debounceTimer*/
    6145) {
      $: {
        draft;
        if (previewView) {
          clearTimeout(debounceTimer);
          $$invalidate(12, debounceTimer = window.setTimeout(updatePreview, 80));
        }
      }
    }
  };
  return [
    draft,
    def,
    onSave,
    onCancel,
    previewContainer,
    previewPanelEl,
    openImagePicker,
    app,
    plugin,
    grid,
    sourcePath,
    previewView,
    debounceTimer,
    input_input_handler,
    click_handler,
    input_input_handler_1,
    click_handler_1,
    click_handler_2,
    keydown_handler,
    click_handler_3,
    select_change_handler,
    input0_input_handler,
    input1_input_handler,
    click_handler_4,
    click_handler_5,
    textarea_input_handler,
    click_handler_6,
    div4_binding,
    div5_binding
  ];
}
var Editor = class extends SvelteComponent {
  constructor(options) {
    super();
    init(
      this,
      options,
      instance,
      create_fragment,
      safe_not_equal,
      {
        app: 7,
        plugin: 8,
        grid: 9,
        def: 1,
        draft: 0,
        sourcePath: 10,
        onSave: 2,
        onCancel: 3
      },
      add_css,
      [-1, -1]
    );
  }
};
var Editor_default = Editor;

// src/ui/modals/CardEditorModal.ts
function clone(value) {
  const sc = globalThis.structuredClone;
  if (sc) return sc(value);
  return JSON.parse(JSON.stringify(value));
}
var CardEditorModal = class extends import_obsidian12.Modal {
  constructor(app, plugin, sourcePath, grid, def, card, onSubmit) {
    super(app);
    this.plugin = plugin;
    this.sourcePath = sourcePath;
    this.grid = grid;
    this.def = def;
    this.draft = clone(card);
    this.onSubmit = onSubmit;
    this.setTitle(def.editor.title);
  }
  onOpen() {
    this.modalEl.style.width = "900px";
    this.modalEl.style.maxWidth = "95vw";
    this.contentEl.empty();
    this.svelteComponent = new Editor_default({
      target: this.contentEl,
      props: {
        app: this.app,
        plugin: this.plugin,
        grid: this.grid,
        def: this.def,
        draft: this.draft,
        sourcePath: this.sourcePath,
        onSave: (finalDraft) => {
          this.onSubmit(this.def.normalize(finalDraft));
          this.close();
        },
        onCancel: () => {
          this.onSubmit(null);
          this.close();
        }
      }
    });
  }
  onClose() {
    var _a;
    (_a = this.svelteComponent) == null ? void 0 : _a.$destroy();
  }
};

// src/ui/CardResizer.ts
var CardResizer = class {
  constructor(app, container, controller) {
    this.app = app;
    this.container = container;
    this.controller = controller;
    this.isDragging = false;
    this.startX = 0;
    this.startWidth1 = 0;
    this.startWidth2 = 0;
    this.card1Id = "";
    this.card2Id = "";
    this.maxUnbalancedWidth = 0;
    this.setupDividerListeners();
    this.setupCursorHandler();
  }
  setupCursorHandler() {
    this.container.addEventListener("mousemove", (evt) => {
      if (this.isDragging) return;
      const target = evt.target;
      const cardEl = target.closest(".card-grid-card, .card-grid-spacer");
      if (!cardEl) {
        this.container.style.cursor = "";
        return;
      }
      const columns = parseFloat(getComputedStyle(this.container).getPropertyValue("--grid-columns") || "3");
      const allCards = Array.from(this.container.querySelectorAll(".card-grid-card, .card-grid-spacer"));
      const myIndex = allCards.indexOf(cardEl);
      const indexInRow = myIndex % columns + 1;
      const rect = cardEl.getBoundingClientRect();
      const isNearRightEdge = Math.abs(evt.clientX - rect.right) <= 15;
      if (isNearRightEdge && indexInRow < columns) {
        this.container.style.cursor = "col-resize";
      } else {
        this.container.style.cursor = "";
      }
    });
  }
  setupDividerListeners() {
    this.container.addEventListener("mousedown", (evt) => {
      const cardEl = evt.target.closest(".card-grid-card, .card-grid-spacer");
      if (!cardEl) return;
      const columns = parseFloat(getComputedStyle(this.container).getPropertyValue("--grid-columns") || "3");
      const allCards = Array.from(this.container.querySelectorAll(".card-grid-card, .card-grid-spacer"));
      const myIndex = allCards.indexOf(cardEl);
      const indexInRow = myIndex % columns + 1;
      if (indexInRow === columns) {
        return;
      }
      const rect = cardEl.getBoundingClientRect();
      const isNearRightEdge = Math.abs(evt.clientX - rect.right) <= 15;
      if (!isNearRightEdge) {
        return;
      }
      const nextCardEl = cardEl.nextElementSibling;
      let neighbor = null;
      if (nextCardEl && (nextCardEl.classList.contains("card-grid-card") || nextCardEl.classList.contains("card-grid-spacer"))) {
        const rectNext = nextCardEl.getBoundingClientRect();
        if (Math.abs(rect.top - rectNext.top) <= 10) {
          neighbor = nextCardEl;
        }
      }
      this.startResize(evt, cardEl, neighbor);
    });
  }
  onMouseMove(evt, card1El, card2El) {
    if (!this.isDragging) return;
    const deltaX = evt.clientX - this.startX;
    const containerRect = this.container.getBoundingClientRect();
    const columns = parseFloat(getComputedStyle(this.container).getPropertyValue("--grid-columns") || "3");
    const unitDelta = deltaX / containerRect.width * columns;
    if (!card2El) {
      let w = this.startWidth1 + unitDelta;
      w = Math.round(Math.min(this.maxUnbalancedWidth, Math.max(0.3, w)) * 1e3) / 1e3;
      card1El.style.setProperty("--card-width", String(w));
      return;
    }
    let w1 = this.startWidth1 + unitDelta;
    let w2 = this.startWidth2 - unitDelta;
    const totalWidth = this.startWidth1 + this.startWidth2;
    const MIN_WIDTH = 0.3;
    if (w1 < MIN_WIDTH) {
      w1 = MIN_WIDTH;
      w2 = totalWidth - MIN_WIDTH;
    } else if (w2 < MIN_WIDTH) {
      w2 = MIN_WIDTH;
      w1 = totalWidth - MIN_WIDTH;
    }
    const round = (n) => Math.round(n * 1e3) / 1e3;
    card1El.style.setProperty("--card-width", String(round(w1)));
    card2El.style.setProperty("--card-width", String(round(w2)));
  }
  startResize(evt, card1El, card2El) {
    evt.preventDefault();
    this.isDragging = true;
    this.controller.setResizing(true);
    this.startX = evt.clientX;
    this.card1Id = card1El.dataset.cardId || "";
    this.card2Id = (card2El == null ? void 0 : card2El.dataset.cardId) || "";
    this.startWidth1 = parseFloat(card1El.dataset.widthFraction || "1");
    this.startWidth2 = card2El ? parseFloat(card2El.dataset.widthFraction || "1") : 0;
    if (!card2El) {
      const columns = parseFloat(getComputedStyle(this.container).getPropertyValue("--grid-columns") || "3");
      const allCards = Array.from(this.container.querySelectorAll(".card-grid-card, .card-grid-spacer"));
      const myIndex = allCards.indexOf(card1El);
      const rowIndex = Math.floor(myIndex / columns);
      const startOfRow = rowIndex * columns;
      let sumOfPreviousInRow = 0;
      for (let i = startOfRow; i < myIndex; i++) {
        sumOfPreviousInRow += parseFloat(allCards[i].dataset.widthFraction || "1");
      }
      this.maxUnbalancedWidth = columns - sumOfPreviousInRow;
    }
    card1El.classList.add("card-grid-resizing");
    if (card2El) {
      card2El.classList.add("card-grid-resizing");
    }
    const onMouseMove = (e) => this.onMouseMove(e, card1El, card2El || void 0);
    const onMouseUp = () => this.onMouseUp(card1El, card2El, onMouseMove);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp, { once: true });
  }
  onMouseUp(card1El, card2El, onMouseMove) {
    document.removeEventListener("mousemove", onMouseMove);
    if (!this.isDragging) return;
    this.isDragging = false;
    this.controller.setResizing(false);
    card1El.classList.remove("card-grid-resizing");
    if (card2El) {
      card2El.classList.remove("card-grid-resizing");
    }
    const newWidth1 = parseFloat(getComputedStyle(card1El).getPropertyValue("--card-width") || "1");
    const updates = [{ id: this.card1Id, width: newWidth1 }];
    if (this.card2Id && card2El) {
      const newWidth2 = parseFloat(getComputedStyle(card2El).getPropertyValue("--card-width") || "1");
      updates.push({ id: this.card2Id, width: newWidth2 });
    }
    this.controller.updateCardWidths(updates);
  }
  destroy() {
    this.isDragging = false;
  }
};

// src/controller/GridController.ts
function cloneCard(card, newId) {
  const anyCard = card;
  if (anyCard.raw && typeof anyCard.raw === "object") {
    return __spreadProps(__spreadValues({}, anyCard), { id: newId, raw: __spreadProps(__spreadValues({}, anyCard.raw), { id: newId }) });
  }
  return __spreadProps(__spreadValues({}, card), { id: newId });
}
var GridController = class {
  constructor(opts) {
    this.saveTimer = null;
    this.saveChain = Promise.resolve();
    this.destroyed = false;
    this.isResizing = false;
    this.app = opts.app;
    this.plugin = opts.plugin;
    this.registry = opts.registry;
    this.ref = opts.ref;
    this.repository = new CardGridRepository(this.app);
    const rawObj = parseYamlObject(opts.codeBlockSource);
    const initial = parseCardGridObject(rawObj, this.registry);
    this.store = new GridStore(initial);
    this.view = new GridView({
      app: this.app,
      plugin: this.plugin,
      registry: this.registry,
      sourcePath: this.ref.sourcePath,
      hostEl: opts.hostEl,
      onMenu: {
        onAddCardBefore: (id) => this.addCard(id, "before"),
        onAddCardAfter: (id) => this.addCard(id, "after"),
        onEditCard: (id) => this.editCard(id),
        onCloneCard: (id) => this.cloneCard(id),
        onDeleteCard: (id) => this.deleteCard(id),
        onMoveCard: (id, dir) => this.moveCard(id, dir),
        onChangeType: (id, type) => this.changeType(id, type),
        onResetGridWidths: () => this.resetAllWidths(),
        onChangeColumns: (count) => this.changeColumns(count)
      },
      controller: this
    });
    this.store.subscribe((next, prev) => {
      this.view.update(next);
      this.scheduleSave(next);
      this.applyGridStyles(next);
    });
  }
  mount() {
    this.view.update(this.store.getState());
    new CardResizer(this.app, this.view.getContainer(), this);
    this.applyGridStyles(this.store.getState());
  }
  destroy() {
    this.destroyed = true;
    if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
    this.view.destroy();
  }
  applyGridStyles(data) {
    const container = this.view.getContainer();
    container.style.setProperty("--grid-columns", String(data.columns));
    container.style.setProperty("--grid-gap", `${data.gap}px`);
    container.style.setProperty("--grid-border-radius", `${data.borderRadius}px`);
  }
  scheduleSave(state) {
    if (this.destroyed) return;
    if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => __async(this, null, function* () {
      this.saveTimer = null;
      const snapshot = state;
      this.saveChain = this.saveChain.then(() => this.repository.save(this.ref, snapshot)).catch(() => {
      });
    }), 250);
  }
  findCard(id) {
    var _a;
    return (_a = this.store.getState().cards.find((c) => c.id === id)) != null ? _a : null;
  }
  addCard(pivotId, mode = "end") {
    const state = this.store.getState();
    let index;
    if (mode === "end" || !pivotId) {
      index = state.cards.length;
    } else {
      const pivotIndex = state.cards.findIndex((c) => c.id === pivotId);
      if (pivotIndex === -1) {
        index = state.cards.length;
      } else {
        index = mode === "before" ? pivotIndex : pivotIndex + 1;
      }
    }
    new CardTypeSuggestModal(this.app, this.registry, (type) => {
      var _a;
      const def = this.registry.get(type);
      const base = def.normalize({ id: createId("card"), type });
      let width = 1;
      if (pivotId && (mode === "before" || mode === "after")) {
        const pivot = this.findCard(pivotId);
        if (pivot) {
          width = Math.round(((_a = pivot.width) != null ? _a : 1) / 2 * 1e3) / 1e3;
          const updatedPivot = __spreadProps(__spreadValues({}, pivot), { width });
          if (updatedPivot.raw) updatedPivot.raw = __spreadProps(__spreadValues({}, updatedPivot.raw), { width });
          this.store.dispatch({ type: "card/replace", card: updatedPivot });
        }
      }
      base.width = width;
      this.store.dispatch({ type: "card/insert", card: base, atIndex: index });
      this.rebalanceGrid();
    }).open();
  }
  deleteCard(id) {
    this.store.dispatch({ type: "card/delete", id });
    this.rebalanceGrid();
  }
  cloneCard(id) {
    var _a;
    const card = this.findCard(id);
    if (!card) return;
    const half = Math.round(((_a = card.width) != null ? _a : 1) / 2 * 1e3) / 1e3;
    const updatedCard = __spreadProps(__spreadValues({}, card), { width: half });
    if (updatedCard.raw) updatedCard.raw = __spreadProps(__spreadValues({}, updatedCard.raw), { width: half });
    this.store.dispatch({ type: "card/replace", card: updatedCard });
    const cloned = cloneCard(updatedCard, createId("card"));
    const index = this.store.getState().cards.findIndex((c) => c.id === id);
    this.store.dispatch({ type: "card/insert", card: cloned, atIndex: index + 1 });
    this.rebalanceGrid();
  }
  moveCard(id, direction) {
    const state = this.store.getState();
    const idx = state.cards.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const toIndex = direction === "up" ? idx - 1 : idx + 1;
    this.store.dispatch({ type: "card/move", id, toIndex });
    this.rebalanceGrid();
  }
  changeType(id, type) {
    const existing = this.findCard(id);
    if (!existing) return;
    const def = this.registry.get(type);
    const updated = def.normalize(__spreadProps(__spreadValues({}, existing), { type, id }));
    this.store.dispatch({ type: "card/replace", card: updated });
    this.rebalanceGrid();
  }
  editCard(id) {
    const card = this.findCard(id);
    if (!card) return;
    const def = this.registry.get(card.type);
    if (!this.registry.has(card.type) || card.type === "unknown") {
      new import_obsidian13.Notice("Unknown card type cannot be edited.");
      return;
    }
    new CardEditorModal(
      this.app,
      this.plugin,
      this.ref.sourcePath,
      this.store.getState(),
      def,
      card,
      (updated) => {
        if (!updated) return;
        this.store.dispatch({ type: "card/replace", card: updated });
        this.rebalanceGrid();
      }
    ).open();
  }
  changeColumns(count) {
    this.store.dispatch({
      type: "grid/set-options",
      patch: { columns: count }
    });
    this.rebalanceGrid();
  }
  updateCardWidths(updates) {
    this.setResizing(true);
    try {
      for (const update2 of updates) {
        const card = this.findCard(update2.id);
        if (!card) continue;
        this.store.dispatch({
          type: "card/replace",
          card: __spreadProps(__spreadValues({}, card), { width: Math.round(update2.width * 1e3) / 1e3 })
        });
      }
    } finally {
      this.setResizing(false);
      this.rebalanceGrid();
      this.view.update(this.store.getState());
    }
  }
  resetAllWidths() {
    const state = this.store.getState();
    this.setResizing(true);
    try {
      this.store.dispatch({
        type: "grid/set-options",
        patch: { gap: DEFAULT_GAP, borderRadius: DEFAULT_RADIUS }
      });
      for (const card of state.cards) {
        const updated = __spreadValues({}, card);
        updated.width = 1;
        delete updated.imageHeight;
        this.store.dispatch({
          type: "card/replace",
          card: updated
        });
      }
    } finally {
      this.setResizing(false);
      this.view.update(this.store.getState());
    }
  }
  setResizing(resizing) {
    this.isResizing = resizing;
  }
  isCurrentlyResizing() {
    return this.isResizing;
  }
  /**
   * Performs a global reflow of the grid. It groups cards into rows and scales 
   * widths proportionally to ensure each row exactly fills the 'columns' constraint.
   * This naturally pushes and pulls cards between rows recursively.
     */
  rebalanceGrid() {
    var _a;
    const state = this.store.getState();
    const cards = [...state.cards];
    const columns = state.columns;
    if (cards.length === 0) return;
    this.setResizing(true);
    try {
      const updates = [];
      let currentIndex = 0;
      while (currentIndex < cards.length) {
        const row = [];
        let rowSum = 0;
        while (currentIndex < cards.length && row.length < columns) {
          const card = cards[currentIndex];
          row.push(card);
          rowSum += typeof card.width === "number" ? card.width : 1;
          currentIndex++;
        }
        const isFullRow = row.length === columns;
        let targetSum = isFullRow ? columns : Math.min(rowSum, columns);
        const scale = rowSum > 0 ? targetSum / rowSum : 1;
        for (const card of row) {
          const newWidth = Math.round(((_a = card.width) != null ? _a : 1) * scale * 1e3) / 1e3;
          if (newWidth === card.width) continue;
          const updated = __spreadProps(__spreadValues({}, card), { width: newWidth });
          if (updated.raw) updated.raw = __spreadProps(__spreadValues({}, updated.raw), { width: newWidth });
          updates.push(updated);
        }
      }
      for (const card of updates) {
        this.store.dispatch({ type: "card/replace", card });
      }
    } finally {
      this.setResizing(false);
      this.view.update(this.store.getState());
    }
  }
};

// src/plugin/GridRenderChild.ts
var import_obsidian14 = require("obsidian");
var GridRenderChild = class extends import_obsidian14.MarkdownRenderChild {
  constructor(containerEl, controller) {
    super(containerEl);
    this.controller = controller;
  }
  onload() {
    this.controller.mount();
  }
  onunload() {
    this.controller.destroy();
  }
};

// src/plugin/CardGridPlugin.ts
var CardGridPlugin = class extends import_obsidian15.Plugin {
  constructor() {
    super(...arguments);
    this.registry = createDefaultRegistry();
  }
  onload() {
    this.registerMarkdownCodeBlockProcessor("card-grid", (source, el, ctx) => {
      var _a;
      el.empty();
      const sectionInfo = (_a = ctx.getSectionInfo) == null ? void 0 : _a.call(ctx, el);
      const ref = {
        sourcePath: ctx.sourcePath,
        lineStart: sectionInfo == null ? void 0 : sectionInfo.lineStart,
        lineEnd: sectionInfo == null ? void 0 : sectionInfo.lineEnd
      };
      const controller = new GridController({
        app: this.app,
        plugin: this,
        registry: this.registry,
        hostEl: el,
        ref,
        codeBlockSource: source
      });
      ctx.addChild(new GridRenderChild(el, controller));
    });
    this.addRibbonIcon("image", "Pick Image", () => {
      new ImagePickerModal(this.app, (file) => {
        console.log("Selected image:", file.path);
      }).open();
    });
  }
};

// main.ts
var main_default = CardGridPlugin;
