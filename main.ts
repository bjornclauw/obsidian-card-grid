import {
  Plugin,
  parseYaml,
  stringifyYaml,
  TFile,
  FuzzySuggestModal,
  Menu
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
   COLOR PICKER
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
   INLINE TEXT EDITOR
========================= */
function makeEditable(
  el: HTMLElement,
  initial: string,
  onSave: (val: string) => void
) {
  el.contentEditable = "true";
  el.spellcheck = false;
  el.textContent = initial;

  el.addEventListener("blur", () => {
    onSave(el.textContent || "");
  });
}

/* =========================
   PLUGIN
========================= */
export default class CardGridPlugin extends Plugin {

  private cardEls: Map<string, HTMLElement> = new Map();
  private dragFrom: number | null = null;
  private saveTimeout: number | null = null;

  onload() {
    this.registerMarkdownCodeBlockProcessor(
      "card-grid",
      (source, el, ctx) => {
        try {
          const data = parseYaml(this.clean(source));
          if (!data || typeof data !== "object") return;

          this.render(el, data, ctx.sourcePath);
        } catch (e) {
          el.createEl("pre", { text: String(e) });
        }
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
     IMAGE RESOLVE
  ========================= */
  resolveImage(path: string): string {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      return this.app.vault.getResourcePath(file);
    }
    return path;
  }

  /* =========================
     IMAGE PICKER
  ========================= */
  pickImage(cb: (file: TFile) => void) {
    new ImagePickerModal(this.app, cb).open();
  }

  /* =========================
     SAVE (DEBOUNCED)
  ========================= */
  debouncedSave(sourcePath: string, data: any) {
    if (this.saveTimeout) window.clearTimeout(this.saveTimeout);

    this.saveTimeout = window.setTimeout(async () => {
      const file = this.app.vault.getAbstractFileByPath(sourcePath);
      if (!(file instanceof TFile)) return;

      const raw = await this.app.vault.read(file);
      const yaml = stringifyYaml(data);

      const updated = raw.replace(
        /```card-grid[\s\S]*?```/,
        "```card-grid\n" + yaml + "\n```"
      );

      await this.app.vault.modify(file, updated);
    }, 400);
  }

  /* =========================
     RENDER
  ========================= */
  render(el: HTMLElement, data: any, sourcePath: string) {
    el.empty();
    this.cardEls.clear();

    const container = el.createDiv("card-grid-container");

    const cards = Array.isArray(data.cards) ? data.cards : [];

    container.style.display = "grid";
    container.style.gridTemplateColumns =
      `repeat(${data.columns || 3}, minmax(200px, 1fr))`;
    container.style.gap = `${data.gap || 10}px`;

    cards.forEach((card: any, index: number) => {
      const box = this.createCard(card, index, data, sourcePath);
      container.appendChild(box);
      this.cardEls.set(String(index), box);
    });
  }

  /* =========================
     CARD CREATION
  ========================= */
  createCard(card: any, index: number, data: any, sourcePath: string) {
    const box = document.createElement("div");
    box.className = "card-grid-card";

    box.style.border = `2px solid ${card.color || "#ccc"}`;
    box.draggable = true;

    /* ================= IMAGE (optional) ================= */
    if (card.image && card.image.trim() !== "") {
      const img = box.createEl("img");
      img.src = this.resolveImage(card.image);

      img.style.width = "100%";
      img.style.height = "180px";
      img.style.objectFit = "cover";

      img.onclick = () => {
        this.pickImage((file) => {
          card.image = file.path;
          this.debouncedSave(sourcePath, data);
          this.updateCard(box, card);
        });
      };
    }

    /* ================= TITLE ================= */
    const title = box.createEl("h4");
    makeEditable(title, card.title || "Untitled", (val) => {
      card.title = val;
      this.debouncedSave(sourcePath, data);
    });

    title.style.background = card.color || "";

    /* ================= TEXT ================= */
    const text = box.createEl("p");
    makeEditable(text, card.text || "", (val) => {
      card.text = val;
      this.debouncedSave(sourcePath, data);
    });

    /* ================= IMAGE ADD (if missing) ================= */
    if (!card.image) {
      const addImg = box.createDiv();
      addImg.textContent = "+ add image";
      addImg.style.cursor = "pointer";
      addImg.style.opacity = "0.6";

      addImg.onclick = () => {
        this.pickImage((file) => {
          card.image = file.path;
          this.debouncedSave(sourcePath, data);
          this.render(box.parentElement!, data, sourcePath);
        });
      };
    }

    /* ================= DRAG ================= */
    box.addEventListener("dragstart", () => {
      this.dragFrom = index;
      box.classList.add("dragging");
    });

    box.addEventListener("dragend", () => {
      box.classList.remove("dragging");
    });

    box.addEventListener("dragover", (e) => e.preventDefault());

    box.addEventListener("drop", (e) => {
      e.preventDefault();

      const from = this.dragFrom;
      const to = index;

      if (from === null || from === to) return;

      const cards = data.cards;
      const moved = cards.splice(from, 1)[0];
      cards.splice(to, 0, moved);

      this.debouncedSave(sourcePath, data);
      this.render(box.parentElement!, data, sourcePath);
    });

    /* ================= CONTEXT MENU ================= */
    box.oncontextmenu = (e) => {
      e.preventDefault();

      const menu = new Menu();

      menu.addItem((i) =>
        i.setTitle("Delete").onClick(() => {
          data.cards.splice(index, 1);
          this.debouncedSave(sourcePath, data);
          this.render(box.parentElement!, data, sourcePath);
        })
      );

      menu.addItem((i) =>
        i.setTitle("Change color").onClick(() => {
          openColorPickerAtCursor(e, card.color || "#ccc", (c) => {
            card.color = c;
            this.debouncedSave(sourcePath, data);
            this.render(box.parentElement!, data, sourcePath);
          });
        })
      );

      menu.showAtMouseEvent(e);
    };

    return box;
  }

  /* =========================
     UPDATE SINGLE CARD (future use)
  ========================= */
  updateCard(el: HTMLElement, card: any) {
    const img = el.querySelector("img") as HTMLImageElement;
    if (img && card.image) {
      img.src = this.resolveImage(card.image);
    }
  }
}