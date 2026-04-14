import {
  Plugin,
  parseYaml,
  stringifyYaml,
  TFile,
  FuzzySuggestModal,
  Menu,
  MarkdownRenderer
} from "obsidian";

/* =========================
   IMAGE PICKER
========================= */
class ImagePickerModal extends FuzzySuggestModal<TFile> {
  onSelect: (file: TFile) => void;

  constructor(app: any, onSelect: (file: TFile) => void) {
    super(app);
    this.onSelect = onSelect;
  }

  getItems(): TFile[] {
    return this.app.vault.getFiles().filter((f: TFile) =>
      ["png", "jpg", "jpeg", "webp", "gif"].includes(f.extension.toLowerCase())
    );
  }

  getItemText(item: TFile): string {
    return item.path;
  }

  onChooseItem(item: TFile): void {
    this.onSelect(item);
  }
}

/* =========================
   UTIL
========================= */
function openColorPickerAtCursor(
  e: MouseEvent,
  initial: string,
  onChange: (color: string) => void
) {
  const input = document.createElement("input");
  input.type = "color";
  input.value = initial || "#e91e63";

  input.style.position = "fixed";
  input.style.left = `${e.clientX}px`;
  input.style.top = `${e.clientY}px`;
  input.style.opacity = "0";
  input.style.zIndex = "999999";

  document.body.appendChild(input);

  input.oninput = () => onChange(input.value);
  input.onchange = () => input.remove();

  setTimeout(() => input.click(), 0);
}

/* =========================
   TYPES
========================= */
type GridContext = {
  el: HTMLElement;
  data: any;
  sourcePath: string;
  cardDOM: Map<string, HTMLElement>;
  sectionInfo: any;
};

/* =========================
   GRID KEY
========================= */
function getGridKey(sourcePath: string, sectionInfo: any, el: HTMLElement) {
  const line = sectionInfo?.lineStart ?? crypto.randomUUID();
  const key = `${sourcePath}::${line}`;
  el.dataset.gridKey = key;
  return key;
}

/* =========================
   IMAGE STYLE
========================= */
function applyImageStyle(img: HTMLImageElement, card: any, grid: any) {
  const fit = card.imageFit ?? grid?.imageFit ?? "cover";
  const height = card.imageHeight ?? grid?.imageHeight ?? 180;
  const position = card.imagePosition ?? grid?.imagePosition ?? "center";
  const radius = card.imageRadius ?? grid?.imageRadius ?? 0;

  img.style.objectFit = fit;
  img.style.height = `${height}px`;
  img.style.objectPosition = position;
  img.style.borderRadius = `${radius}px`;
  img.style.width = "100%";
}

/* =========================
   PLUGIN
========================= */
export default class CardGridPlugin extends Plugin {
  private saveTimers = new Map<string, number>();

  onload() {
    this.registerMarkdownCodeBlockProcessor(
      "card-grid",
      (source, el, ctx) => {
        const data = parseYaml(this.clean(source));
        if (!data || typeof data !== "object") return;

        const sectionInfo = ctx.getSectionInfo?.(el);
        const gridKey = getGridKey(ctx.sourcePath, sectionInfo, el);

        const normalized = {
          columns: Number(data.columns ?? 3),
          gap: Number(data.gap ?? 10),

          imageFit: data.imageFit ?? "cover",
          imageHeight: data.imageHeight ?? 180,
          imagePosition: data.imagePosition ?? "center",
          imageRadius: data.imageRadius ?? 0,

          cards: Array.isArray(data.cards) ? data.cards : []
        };

        const context: GridContext = {
          el,
          data: normalized,
          sourcePath: ctx.sourcePath,
          cardDOM: new Map(),
          sectionInfo
        };

        this.render(context);
      }
    );
  }

  /* =========================
     CLEAN
  ========================= */
  clean(source: string) {
    return source
      .replace(/\u00A0/g, " ")
      .replace(/\t/g, "  ")
      .replace(/[^\S\r\n]+$/gm, "");
  }

  /* =========================
     SAVE
  ========================= */
  debouncedSave(ctx: GridContext) {
    const key = (ctx.el as any).dataset.gridKey;
    if (!key) return;

    if (this.saveTimers.has(key)) {
      window.clearTimeout(this.saveTimers.get(key));
    }

    const t = window.setTimeout(async () => {
      const file = this.app.vault.getAbstractFileByPath(ctx.sourcePath);
      if (!(file instanceof TFile)) return;

      const raw = await this.app.vault.read(file);
      const section = ctx.sectionInfo;
      if (!section) return;

      const lines = raw.split("\n");
      const block = lines.slice(section.lineStart, section.lineEnd + 1).join("\n");

      const match = block.match(/```card-grid([\s\S]*?)```/);
      if (!match) return;

      const parsed = parseYaml(this.clean(match[1]));
      if (!parsed) return;

      parsed.cards = ctx.data.cards;
      parsed.columns = ctx.data.columns;
      parsed.gap = ctx.data.gap;

      parsed.imageFit = ctx.data.imageFit;
      parsed.imageHeight = ctx.data.imageHeight;
      parsed.imagePosition = ctx.data.imagePosition;
      parsed.imageRadius = ctx.data.imageRadius;

      const newBlock = "```card-grid\n" + stringifyYaml(parsed) + "\n```";

      const newLines = [
        ...lines.slice(0, section.lineStart),
        newBlock,
        ...lines.slice(section.lineEnd + 1)
      ];

      await this.app.vault.modify(file, newLines.join("\n"));
    }, 250);

    this.saveTimers.set(key, t);
  }

  /* =========================
     RENDER
  ========================= */
  render(ctx: GridContext) {
    let container = ctx.el.querySelector(".card-grid-container") as HTMLElement;

    if (!container) {
      container = ctx.el.createDiv("card-grid-container");
    }

    container.style.display = "grid";
    container.style.gridTemplateColumns = `repeat(${ctx.data.columns}, minmax(200px, 1fr))`;
    container.style.gap = `${ctx.data.gap}px`;

    (container as any)._gridData = ctx.data;

    const existing = new Set(ctx.cardDOM.keys());

    for (const card of ctx.data.cards) {
      if (!card.id) card.id = crypto.randomUUID();

      let node = ctx.cardDOM.get(card.id);

      if (!node) {
        node = this.createCard(card, ctx);
        ctx.cardDOM.set(card.id, node);
      }

      container.appendChild(node);
      this.syncCard(node, card, ctx.data);
      existing.delete(card.id);
    }

    for (const id of existing) {
      ctx.cardDOM.get(id)?.remove();
      ctx.cardDOM.delete(id);
    }

    for (const card of ctx.data.cards) {
      const node = ctx.cardDOM.get(card.id);
      if (!node) continue;

      const img = node.querySelector("img") as HTMLImageElement;
      if (img) applyImageStyle(img, card, ctx.data);
    }
  }

  /* =========================
     EDITABLE
  ========================= */
  async makeEditable(
    el: HTMLElement,
    initial: string,
    ctx: GridContext,
    onSave: (val: string) => void
  ) {
    el.contentEditable = "true";
    el.spellcheck = false;
    let rawValue = initial;

    const render = async () => {
      if (document.activeElement === el) return;
      el.empty();
      await MarkdownRenderer.render(this.app, rawValue || " ", el, ctx.sourcePath, this);
    };

    el.addEventListener("focus", () => {
      el.addClass("is-editing");
      el.textContent = rawValue;
    });

    el.addEventListener("blur", () => {
      const value = (el.innerText || "").replace(/\r/g, "");
      el.removeClass("is-editing");
      rawValue = value;
      onSave(rawValue);
      render();
    });

    render();
  }

  /* =========================
     CARD
  ========================= */
  createCard(card: any, ctx: GridContext) {
    const box = document.createElement("div");
    box.className = "card-grid-card";

    box.style.border = `2px solid ${card.color || "#ccc"}`;

    if (card.image && card.imageEnabled !== false) {
      const img = box.createEl("img");
      img.src = this.resolveImage(card.image);
      applyImageStyle(img, card, ctx.data);
    }

    const title = box.createEl("h4");
    this.makeEditable(title, card.title || "Untitled", ctx, (v) => {
      card.title = v;
      this.debouncedSave(ctx);
    });

    const text = box.createDiv("card-text");

    this.makeEditable(text, card.text || "", ctx, (v) => {
      card.text = v;
      this.debouncedSave(ctx);
    });

    box.oncontextmenu = (e) => {
      e.preventDefault();

      const menu = new Menu();

      menu.addItem((i) =>
        i.setTitle("➕ Add card").onClick(() => {
          ctx.data.cards.push({
            id: crypto.randomUUID(),
            title: "New card",
            text: "",
            color: "#ccc",
            image: "",
            imageEnabled: true
          });
          this.debouncedSave(ctx);
          this.render(ctx);
        })
      );

      menu.addItem((i) =>
        i.setTitle("🗑 Remove this card").onClick(() => {
          const idx = ctx.data.cards.findIndex((c: any) => c.id === card.id);
          if (idx !== -1) ctx.data.cards.splice(idx, 1);
          this.debouncedSave(ctx);
          this.render(ctx);
        })
      );

      menu.addItem((i) =>
        i.setTitle("🎨 Change color").onClick(() => {
          openColorPickerAtCursor(e, card.color || "#ccc", (c) => {
            card.color = c;
            this.debouncedSave(ctx);
            this.render(ctx);
          });
        })
      );

      menu.addItem((i) =>
        i.setTitle("🖼 Change image").onClick(() => {
          new ImagePickerModal(this.app, (file) => {
            card.image = file.path;
            card.imageEnabled = true;
            this.debouncedSave(ctx);
            this.render(ctx);
          }).open();
        })
      );

      menu.addItem((i) =>
        i.setTitle(card.imageEnabled === false ? "Enable image" : "Disable image")
          .onClick(() => {
            card.imageEnabled = !(card.imageEnabled !== false);
            this.debouncedSave(ctx);
            this.render(ctx);
          })
      );

      menu.addItem((i) =>
        i.setTitle("⬆ Move up").onClick(() => {
          const arr = ctx.data.cards;
          const idx = arr.findIndex((c: any) => c.id === card.id);
          if (idx > 0) {
            [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
            this.debouncedSave(ctx);
            this.render(ctx);
          }
        })
      );

      menu.addItem((i) =>
        i.setTitle("⬇ Move down").onClick(() => {
          const arr = ctx.data.cards;
          const idx = arr.findIndex((c: any) => c.id === card.id);
          if (idx !== -1 && idx < arr.length - 1) {
            [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
            this.debouncedSave(ctx);
            this.render(ctx);
          }
        })
      );

      menu.showAtMouseEvent(e);
    };

    return box;
  }

  /* =========================
     SYNC
  ========================= */
  syncCard(el: HTMLElement, card: any, grid: any) {
    const img = el.querySelector("img") as HTMLImageElement;

    if (img) {
      if (card.image && card.imageEnabled !== false) {
        img.src = this.resolveImage(card.image);
        applyImageStyle(img, card, grid);
        img.style.display = "";
      } else {
        img.style.display = "none";
      }
    }

    const h4 = el.querySelector("h4") as HTMLElement;
    if (h4) h4.style.background = card.color || "";
  }

  resolveImage(path: string): string {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) return this.app.vault.getResourcePath(file);
    return path;
  }
}