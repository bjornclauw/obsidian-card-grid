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
  input.style.width = "20px";
  input.style.height = "20px";
  input.style.opacity = "0.01";
  input.style.zIndex = "999999";

  document.body.appendChild(input);

  input.oninput = () => onChange(input.value);
  input.onchange = () => input.remove();

  setTimeout(() => {
    input.click();
    input.focus();
  }, 0);
}

/* =========================
   TEXT EDITOR (NEW)
========================= */
function openTextEditorAtCursor(
  e: MouseEvent,
  initial: string,
  onChange: (value: string) => void
) {
  const input = document.createElement("input");

  input.type = "text";
  input.value = initial || "";

  input.style.position = "fixed";
  input.style.left = `${e.clientX}px`;
  input.style.top = `${e.clientY}px`;
  input.style.minWidth = "140px";
  input.style.padding = "6px 8px";
  input.style.fontSize = "14px";
  input.style.border = "1px solid var(--background-modifier-border)";
  input.style.borderRadius = "6px";
  input.style.zIndex = "999999";
  input.style.background = "var(--background-primary)";
  input.style.color = "var(--text-normal)";

  document.body.appendChild(input);

  input.focus();
  input.select();

  const save = () => {
    onChange(input.value);
    input.remove();
  };

  input.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") save();
    if (ev.key === "Escape") input.remove();
  });

  input.addEventListener("blur", save);
}

/* =========================
   PLUGIN
========================= */
export default class CardGridPlugin extends Plugin {

  async onload() {
    console.log("Card Grid FULL FIXED loaded");

    this.registerMarkdownCodeBlockProcessor(
      "card-grid",
      (source, el, ctx) => {
        try {
          const cleaned = this.clean(source);
          const data = parseYaml(cleaned);

          if (!data || typeof data !== "object") return;

          this.render(el, data, ctx.sourcePath);
        } catch (err) {
          el.createEl("pre", { text: "YAML Error: " + err });
        }
      }
    );
  }

  /* =========================
     CLEAN INPUT
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
  pickImage(callback: (file: TFile) => void) {
    new ImagePickerModal(this.app, callback).open();
  }

  /* =========================
     UPDATE FILE
  ========================= */
  async updateFile(sourcePath: string, data: any) {
    const file = this.app.vault.getAbstractFileByPath(sourcePath);
    if (!(file instanceof TFile)) return;

    const raw = await this.app.vault.read(file);
    const yaml = stringifyYaml(data);

    const updated = raw.replace(
      /```card-grid[\s\S]*?```/,
      "```card-grid\n" + yaml + "\n```"
    );

    await this.app.vault.modify(file, updated);
  }

  refresh(el: HTMLElement, data: any, sourcePath: string) {
    this.render(el, data, sourcePath);
  }

  /* =========================
     CONTEXT MENU
  ========================= */
  buildMenu(card: any, index: number, data: any, sourcePath: string, el: HTMLElement, e: MouseEvent) {
    const menu = new Menu();

    menu.addItem((item) =>
      item.setTitle("🎨 Change color").setIcon("palette").onClick(() => {
        openColorPickerAtCursor(e, card.color || "#e91e63", async (color) => {
          card.color = color;
          await this.updateFile(sourcePath, data);
          this.refresh(el, data, sourcePath);
        });
      })
    );

    menu.addItem((item) =>
      item.setTitle("🖼️ Change image").setIcon("image").onClick(() => {
        this.pickImage(async (file) => {
          card.image = file.path;
          await this.updateFile(sourcePath, data);
          this.refresh(el, data, sourcePath);
        });
      })
    );

    menu.addItem((item) =>
      item.setTitle("✏️ Edit title").setIcon("heading").onClick(() => {
        openTextEditorAtCursor(e, card.title || "", async (value) => {
          card.title = value;
          await this.updateFile(sourcePath, data);
          this.refresh(el, data, sourcePath);
        });
      })
    );

    menu.addItem((item) =>
      item.setTitle("📝 Edit text").setIcon("document").onClick(() => {
        openTextEditorAtCursor(e, card.text || "", async (value) => {
          card.text = value;
          await this.updateFile(sourcePath, data);
          this.refresh(el, data, sourcePath);
        });
      })
    );

    menu.addSeparator();

    menu.addItem((item) =>
      item.setTitle("➕ Add card").setIcon("plus").onClick(async () => {
        data.cards.splice(index + 1, 0, {
          title: "New card",
          color: "#cccccc",
          text: "",
          image: ""
        });

        await this.updateFile(sourcePath, data);
        this.refresh(el, data, sourcePath);
      })
    );

    menu.addItem((item) =>
      item.setTitle("🗑️ Delete card").setIcon("trash").onClick(async () => {
        data.cards.splice(index, 1);

        await this.updateFile(sourcePath, data);
        this.refresh(el, data, sourcePath);
      })
    );

    menu.showAtMouseEvent(e);
  }

  /* =========================
     RENDER
  ========================= */
  render(el: HTMLElement, data: any, sourcePath: string) {
    el.empty();

    const container = el.createDiv();
    container.addClass("card-grid-container");

    if (data.columns) {
      container.style.gridTemplateColumns =
        `repeat(${data.columns}, minmax(250px, 1fr))`;
    }

    if (data.gap) {
      container.style.gap = `${data.gap}px`;
    }

    data.cards?.forEach((card: any, index: number) => {

      const box = container.createDiv();
      box.addClass("card-grid-card");

      box.style.border = `2px solid ${card.color || "#ccc"}`;

      /* IMAGE */
      const img = box.createEl("img");
      img.src = card.image
        ? this.resolveImage(card.image)
        : "https://via.placeholder.com/300x200?text=Click+to+add";

      img.style.width = "100%";
      img.style.height = "200px";
      img.style.objectFit = "cover";
      img.style.borderRadius = "6px";
      img.style.cursor = "pointer";

      img.onclick = () => {
        this.pickImage(async (file) => {
          card.image = file.path;
          await this.updateFile(sourcePath, data);
          this.refresh(el, data, sourcePath);
        });
      };

      /* TITLE */
      const title = box.createEl("h4", {
        text: card.title || "No title"
      });

      title.style.cursor = "pointer";

      title.onclick = (e: MouseEvent) => {
        openTextEditorAtCursor(e, card.title || "", async (value) => {
          card.title = value;
          await this.updateFile(sourcePath, data);
          this.refresh(el, data, sourcePath);
        });
      };

      if (card.color) {
        title.style.backgroundColor = card.color;
      }

      /* TEXT */
      if (card.text) {
        box.createEl("p", { text: card.text });
      }

      /* MENU */
      box.oncontextmenu = (e: MouseEvent) => {
        e.preventDefault();
        this.buildMenu(card, index, data, sourcePath, el, e);
      };
    });
  }
}