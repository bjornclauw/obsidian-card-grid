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
var import_obsidian11 = require("obsidian");

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
function defaultGridData(id) {
  return {
    id,
    version: CURRENT_GRID_VERSION,
    columns: 3,
    gap: 10,
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
    if (!isRecord2(raw)) {
      return { id: createId("card"), type: "text", title: "Untitled", text: "" };
    }
    const id = typeof raw.id === "string" && raw.id.trim().length > 0 ? raw.id.trim() : createId("card");
    return {
      id,
      type: "text",
      title: typeof raw.title === "string" ? raw.title : "Untitled",
      text: typeof raw.text === "string" ? raw.text : "",
      backgroundColor: typeof raw.backgroundColor === "string" ? raw.backgroundColor : void 0,
      textColor: typeof raw.textColor === "string" ? raw.textColor : void 0
    };
  },
  createView(ctx) {
    const box = document.createElement("div");
    box.className = "card-grid-card";
    const titleEl = box.createEl("h4");
    const textEl = box.createDiv("card-text");
    function renderMarkdown(el, markdown) {
      return __async(this, null, function* () {
        el.empty();
        yield import_obsidian.MarkdownRenderer.render(ctx.app, markdown || " ", el, ctx.sourcePath, ctx.plugin);
      });
    }
    return {
      el: box,
      update(card, viewCtx) {
        box.style.border = `2px solid ${card.backgroundColor || "#ccc"}`;
        titleEl.style.color = card.textColor || "#000000";
        titleEl.style.backgroundColor = card.backgroundColor || "transparent";
        void renderMarkdown(titleEl, card.title || "Untitled");
        void renderMarkdown(textEl, card.text || "");
      }
    };
  }
};

// src/cards/types/imageCard.ts
var import_obsidian2 = require("obsidian");

// src/cards/shared/imageStyle.ts
function applyImageStyle(img, card, grid) {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  const fit = (_b = (_a = card.imageFit) != null ? _a : grid.imageFit) != null ? _b : "cover";
  const height = (_d = (_c = card.imageHeight) != null ? _c : grid.imageHeight) != null ? _d : 180;
  const position = (_f = (_e = card.imagePosition) != null ? _e : grid.imagePosition) != null ? _f : "center";
  const radius = (_h = (_g = card.imageRadius) != null ? _g : grid.imageRadius) != null ? _h : 0;
  img.style.objectFit = fit;
  img.style.height = `${height}px`;
  img.style.objectPosition = position;
  img.style.borderRadius = `${radius}px`;
  img.style.width = "100%";
}

// src/cards/types/imageCard.ts
function isRecord3(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
var imageCardType = {
  type: "image",
  displayName: "Image card",
  editor: {
    title: "Edit image card",
    fields: [
      { kind: "text", key: "title", label: "Title" },
      { kind: "markdown", key: "text", label: "Text" },
      { kind: "toggle", key: "imageEnabled", label: "Show image", defaultValue: true },
      { kind: "image-file", key: "image", label: "Image" },
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
      { kind: "number", key: "imageHeight", label: "Image height", min: 0, step: 10 },
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
      return { id: createId("card"), type: "image", title: "Untitled", text: "" };
    }
    const id = typeof raw.id === "string" && raw.id.trim().length > 0 ? raw.id.trim() : createId("card");
    return {
      id,
      type: "image",
      title: typeof raw.title === "string" ? raw.title : "Untitled",
      text: typeof raw.text === "string" ? raw.text : "",
      backgroundColor: typeof raw.backgroundColor === "string" ? raw.backgroundColor : void 0,
      textColor: typeof raw.textColor === "string" ? raw.textColor : void 0,
      image: typeof raw.image === "string" ? raw.image : void 0,
      imageEnabled: typeof raw.imageEnabled === "boolean" ? raw.imageEnabled : void 0,
      imageFit: typeof raw.imageFit === "string" ? raw.imageFit : void 0,
      imageHeight: typeof raw.imageHeight === "number" ? raw.imageHeight : void 0,
      imagePosition: typeof raw.imagePosition === "string" ? raw.imagePosition : void 0,
      imageRadius: typeof raw.imageRadius === "number" ? raw.imageRadius : void 0
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
        box.style.border = `2px solid ${card.backgroundColor || "#ccc"}`;
        const enabled = card.imageEnabled !== false;
        if (enabled && card.image) {
          img.style.display = "";
          img.src = resolveImagePath(card.image);
          applyImageStyle(img, card, viewCtx.grid);
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

// src/cards/types/unknownCard.ts
function isRecord4(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
var unknownCardType = {
  type: "unknown",
  displayName: "Unknown card",
  editor: {
    title: "Unknown card",
    fields: []
  },
  normalize(raw) {
    const obj = isRecord4(raw) ? raw : {};
    const id = typeof obj.id === "string" && obj.id.trim().length > 0 ? obj.id.trim() : createId("card");
    const type = typeof obj.type === "string" && obj.type.trim().length > 0 ? obj.type.trim() : "unknown";
    return {
      id,
      type,
      raw: obj
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
        title.style.color = "#000000";
        box.style.border = "2px solid #ccc";
        title.setText(`Unknown card type: ${card.type}`);
        pre.textContent = JSON.stringify(card.raw, null, 2);
      }
    };
  }
};

// src/cards/index.ts
function createDefaultRegistry() {
  const registry = new CardTypeRegistry();
  registry.register(textCardType);
  registry.register(imageCardType);
  registry.register(unknownCardType);
  return registry;
}

// src/controller/GridController.ts
var import_obsidian9 = require("obsidian");

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
var import_obsidian4 = require("obsidian");

// src/ui/modals/CardTypeSuggestModal.ts
var import_obsidian3 = require("obsidian");
var CardTypeSuggestModal = class extends import_obsidian3.SuggestModal {
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
  const menu = new import_obsidian4.Menu();
  menu.addItem((i) => i.setTitle("Edit").onClick(() => handlers.onEditCard(cardId)));
  menu.addItem(
    (i) => i.setTitle("Add card after").onClick(() => handlers.onAddCard(cardId))
  );
  menu.addItem(
    (i) => i.setTitle("Clone").onClick(() => handlers.onCloneCard(cardId))
  );
  menu.addItem(
    (i) => i.setTitle("Remove").onClick(() => handlers.onDeleteCard(cardId))
  );
  menu.addSeparator();
  menu.addItem((i) => i.setTitle("Move up").onClick(() => handlers.onMoveCard(cardId, "up")));
  menu.addItem(
    (i) => i.setTitle("Move down").onClick(() => handlers.onMoveCard(cardId, "down"))
  );
  menu.addSeparator();
  menu.addItem(
    (i) => i.setTitle("Change type\u2026").onClick(() => {
      new CardTypeSuggestModal(app, registry, (type) => {
        handlers.onChangeType(cardId, type);
      }).open();
    })
  );
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
    this.container = this.hostEl.querySelector(".card-grid-container");
    if (!this.container) this.container = this.hostEl.createDiv("card-grid-container");
  }
  destroy() {
    this.cardDom.clear();
    this.container.empty();
  }
  update(grid) {
    this.container.style.display = "grid";
    this.container.style.gridTemplateColumns = `repeat(${grid.columns}, minmax(200px, 1fr))`;
    this.container.style.gap = `${grid.gap}px`;
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
      this.container.appendChild(entry.view.el);
      entry.view.update(card, viewCtx);
      existing.delete(card.id);
    }
    for (const id of existing) {
      const entry = this.cardDom.get(id);
      entry == null ? void 0 : entry.view.el.remove();
      this.cardDom.delete(id);
    }
  }
  ensureCard(card, ctx) {
    const existing = this.cardDom.get(card.id);
    if (existing && existing.type === card.type) return existing;
    existing == null ? void 0 : existing.view.el.remove();
    const def = this.registry.get(card.type);
    const view = def.createView(ctx);
    view.el.dataset.cardId = card.id;
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
};

// src/infrastructure/CardGridRepository.ts
var import_obsidian6 = require("obsidian");

// src/infrastructure/yaml.ts
var import_obsidian5 = require("obsidian");
function cleanYamlSource(source) {
  return source.replace(/\u00a0/g, " ").replace(/\t/g, "  ").replace(/[^\S\r\n]+$/gm, "");
}
function parseYamlObject(source) {
  const cleaned = cleanYamlSource(source);
  return (0, import_obsidian5.parseYaml)(cleaned);
}
function stringifyYamlObject(value) {
  return (0, import_obsidian5.stringifyYaml)(value);
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
      if (!(file instanceof import_obsidian6.TFile)) return;
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
var import_obsidian8 = require("obsidian");

// src/ui/modals/ImagePickerModal.ts
var import_obsidian7 = require("obsidian");
var ImagePickerModal = class extends import_obsidian7.FuzzySuggestModal {
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

// src/ui/modals/CardEditorModal.ts
function clone(value) {
  const sc = globalThis.structuredClone;
  if (sc) return sc(value);
  return JSON.parse(JSON.stringify(value));
}
function injectStyles(container) {
  if (container.querySelector("style[data-card-editor]")) return;
  const style = document.createElement("style");
  style.setAttribute("data-card-editor", "true");
  style.textContent = `
  .card-grid-editor .card-grid-preview-card {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.card-grid-editor .card-grid-preview-content {
  max-width: 500px;
  width: 100%;
  text-align: center;
}
  .card-grid-editor .card-grid-md-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .card-grid-editor .card-grid-md-toolbar {
    display: flex;
    gap: 6px;
  }

  .card-grid-editor .card-grid-md-toolbar button {
    flex: 1;
    border-radius: 6px;
  }

  .card-grid-editor .card-grid-md-toolbar button.mod-cta {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
  }

  .card-grid-editor .card-grid-md-editor,
  .card-grid-editor .card-grid-md-preview {
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    padding: 10px;
    background: var(--background-primary);
    height: 200px;
    overflow: auto;
  }

  .card-grid-editor textarea {
    width: 100%;
    resize: vertical;
    background: transparent;
  }
  `;
  container.appendChild(style);
}
var CardEditorModal = class extends import_obsidian8.Modal {
  constructor(app, plugin, sourcePath, def, card, onSubmit) {
    super(app);
    this.plugin = plugin;
    this.sourcePath = sourcePath;
    this.def = def;
    this.draft = clone(card);
    this.onSubmit = onSubmit;
    this.setTitle(def.editor.title);
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("card-grid-editor");
    injectStyles(contentEl);
    this.renderFields(this.def.editor, contentEl);
    new import_obsidian8.Setting(contentEl).addButton(
      (b) => b.setButtonText("Cancel").onClick(() => {
        this.onSubmit(null);
        this.close();
      })
    ).addButton(
      (b) => b.setCta().setButtonText("Save").onClick(() => {
        const normalized = this.def.normalize(this.draft);
        this.onSubmit(normalized);
        this.close();
      })
    );
  }
  onClose() {
    this.contentEl.empty();
  }
  renderFields(spec, container) {
    for (const field of spec.fields) {
      this.renderField(field, container);
    }
  }
  renderField(field, container) {
    var _a;
    const key = field.key;
    const getString = () => typeof this.draft[key] === "string" ? this.draft[key] : "";
    const getNumber = () => typeof this.draft[key] === "number" ? this.draft[key] : void 0;
    const getBoolean = () => typeof this.draft[key] === "boolean" ? this.draft[key] : void 0;
    const setValue = (value) => {
      this.draft[key] = value;
    };
    if (field.kind === "text") {
      new import_obsidian8.Setting(container).setName(field.label).addText((t) => {
        var _a2;
        t.setPlaceholder((_a2 = field.placeholder) != null ? _a2 : "").setValue(getString());
        t.onChange((v) => setValue(v));
      });
      return;
    }
    if (field.kind === "number") {
      new import_obsidian8.Setting(container).setName(field.label).addText((t) => {
        const initial = getNumber();
        t.setValue(initial === void 0 ? "" : String(initial));
        t.onChange((v) => {
          const n = Number(v);
          setValue(Number.isFinite(n) ? n : void 0);
        });
      });
      return;
    }
    if (field.kind === "select") {
      new import_obsidian8.Setting(container).setName(field.label).addDropdown((d) => {
        var _a2, _b, _c;
        for (const opt of field.options) d.addOption(opt.value, opt.label);
        const initial = typeof this.draft[key] === "string" ? this.draft[key] : (_c = (_b = field.defaultValue) != null ? _b : (_a2 = field.options[0]) == null ? void 0 : _a2.value) != null ? _c : "";
        if (initial) d.setValue(initial);
        d.onChange((v) => setValue(v));
      });
      return;
    }
    if (field.kind === "toggle") {
      new import_obsidian8.Setting(container).setName(field.label).addToggle((t) => {
        var _a2;
        const initial = getBoolean();
        t.setValue((_a2 = initial != null ? initial : field.defaultValue) != null ? _a2 : false);
        t.onChange((v) => setValue(v));
      });
      return;
    }
    if (field.kind === "color") {
      new import_obsidian8.Setting(container).setName(field.label).addColorPicker((c) => {
        var _a2;
        const initial = typeof this.draft[key] === "string" ? this.draft[key] : (_a2 = field.defaultValue) != null ? _a2 : "#cccccc";
        c.setValue(initial);
        c.onChange((v) => setValue(v));
      });
      return;
    }
    if (field.kind === "image-file") {
      const setting = new import_obsidian8.Setting(container).setName(field.label);
      const desc = setting.descEl;
      const renderDesc = () => {
        const v = getString();
        desc.setText(v ? v : "(none)");
      };
      renderDesc();
      setting.addButton(
        (b) => b.setButtonText("Choose\u2026").onClick(() => {
          new ImagePickerModal(this.app, (file) => {
            setValue(file.path);
            renderDesc();
          }).open();
        })
      );
      setting.addButton(
        (b) => b.setButtonText("Clear").onClick(() => {
          setValue("");
          renderDesc();
        })
      );
      return;
    }
    if (field.kind === "markdown") {
      const setting = new import_obsidian8.Setting(container).setName(field.label);
      const wrapper = setting.controlEl.createDiv("card-grid-md-field");
      const toolbar = wrapper.createDiv("card-grid-md-toolbar");
      const editorWrap = wrapper.createDiv("card-grid-md-editor");
      const previewWrap = wrapper.createDiv("card-grid-md-preview");
      const textarea = new import_obsidian8.TextAreaComponent(editorWrap);
      textarea.inputEl.rows = 8;
      textarea.setValue(getString());
      textarea.setPlaceholder((_a = field.placeholder) != null ? _a : "");
      textarea.onChange((v) => setValue(v));
      let showingPreview = false;
      const renderPreview = () => __async(this, null, function* () {
        previewWrap.empty();
        const card = previewWrap.createDiv("card-grid-preview-card");
        const content = card.createDiv("card-grid-preview-content");
        yield import_obsidian8.MarkdownRenderer.render(
          this.app,
          getString() || " ",
          content,
          this.sourcePath,
          this.plugin
        );
      });
      const update = () => {
        editorWrap.style.display = showingPreview ? "none" : "";
        previewWrap.style.display = showingPreview ? "" : "none";
      };
      const editBtn = new import_obsidian8.ButtonComponent(toolbar).setButtonText("Edit").setCta().onClick(() => {
        showingPreview = false;
        editBtn.setCta();
        previewBtn.removeCta();
        update();
      });
      const previewBtn = new import_obsidian8.ButtonComponent(toolbar).setButtonText("Preview").onClick(() => __async(this, null, function* () {
        showingPreview = true;
        previewBtn.setCta();
        editBtn.removeCta();
        update();
        yield renderPreview();
      }));
      update();
      return;
    }
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
        onAddCard: (afterId) => this.addCard(afterId),
        onEditCard: (id) => this.editCard(id),
        onCloneCard: (id) => this.cloneCard(id),
        onDeleteCard: (id) => this.deleteCard(id),
        onMoveCard: (id, dir) => this.moveCard(id, dir),
        onChangeType: (id, type) => this.changeType(id, type)
      }
    });
    this.store.subscribe((next, prev) => {
      this.view.update(next);
      this.scheduleSave(next);
    });
  }
  mount() {
    this.view.update(this.store.getState());
  }
  destroy() {
    this.destroyed = true;
    if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
    this.view.destroy();
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
  addCard(afterId) {
    const state = this.store.getState();
    const index = afterId === void 0 ? state.cards.length : state.cards.findIndex((c) => c.id === afterId) + 1;
    new CardTypeSuggestModal(this.app, this.registry, (type) => {
      const def = this.registry.get(type);
      const base = def.normalize({ id: createId("card"), type });
      this.store.dispatch({ type: "card/insert", card: base, atIndex: index });
    }).open();
  }
  deleteCard(id) {
    this.store.dispatch({ type: "card/delete", id });
  }
  cloneCard(id) {
    const card = this.findCard(id);
    if (!card) return;
    const state = this.store.getState();
    const index = state.cards.findIndex((c) => c.id === id);
    const cloned = cloneCard(card, createId("card"));
    this.store.dispatch({ type: "card/insert", card: cloned, atIndex: index + 1 });
  }
  moveCard(id, direction) {
    const state = this.store.getState();
    const idx = state.cards.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const toIndex = direction === "up" ? idx - 1 : idx + 1;
    this.store.dispatch({ type: "card/move", id, toIndex });
  }
  changeType(id, type) {
    const existing = this.findCard(id);
    if (!existing) return;
    const def = this.registry.get(type);
    const updated = def.normalize(__spreadProps(__spreadValues({}, existing), { type, id }));
    this.store.dispatch({ type: "card/replace", card: updated });
  }
  editCard(id) {
    const card = this.findCard(id);
    if (!card) return;
    const def = this.registry.get(card.type);
    if (!this.registry.has(card.type) || card.type === "unknown") {
      new import_obsidian9.Notice("Unknown card type cannot be edited.");
      return;
    }
    new CardEditorModal(this.app, this.plugin, this.ref.sourcePath, def, card, (updated) => {
      if (!updated) return;
      this.store.dispatch({ type: "card/replace", card: updated });
    }).open();
  }
};

// src/plugin/GridRenderChild.ts
var import_obsidian10 = require("obsidian");
var GridRenderChild = class extends import_obsidian10.MarkdownRenderChild {
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
var CardGridPlugin = class extends import_obsidian11.Plugin {
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
