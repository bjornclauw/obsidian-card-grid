import {
  Plugin,
  parseYaml,
  stringifyYaml,
  TFile,
  FuzzySuggestModal
} from "obsidian";

/**
 * IMAGE PICKER
 */
class ImagePickerModal extends FuzzySuggestModal<TFile> {
  onSelect: (file: TFile) => void;

  constructor(app: any, onSelect: (file: TFile) => void) {
    super(app);
    this.onSelect = onSelect;
  }

  getItems(): TFile[] {
    return this.app.vault.getFiles().filter((f: TFile) =>
      ["png", "jpg", "jpeg", "webp"].includes(f.extension.toLowerCase())
    );
  }

  getItemText(item: TFile): string {
    return item.path;
  }

  onChooseItem(item: TFile): void {
    this.onSelect(item);
  }
}

/**
 * COLOR PICKER (native browser)
 */
function openColorPicker(initial: string, onChange: (color: string) => void) {
  const input = document.createElement("input");
  input.type = "color";
  input.value = initial || "#e91e63";

  input.style.position = "fixed";
  input.style.zIndex = "9999";
  input.style.left = "20px";
  input.style.top = "20px";

  input.oninput = () => onChange(input.value);
  input.onchange = () => input.remove();

  document.body.appendChild(input);
  input.click();
}

export default class CardGridPlugin extends Plugin {

  async onload() {
    console.log("Card Grid PRO loaded");

    this.registerMarkdownCodeBlockProcessor(
      "card-grid",
      (source, el, ctx) => {
        try {
          const cleaned = this.clean(source);
          const data = parseYaml(cleaned);

          if (!data || typeof data !== "object") return;

          this.render(el, data, source, ctx.sourcePath);
        } catch (err) {
          el.createEl("pre", { text: "YAML Error: " + err });
        }
      }
    );
  }

  /**
   * CLEAN INPUT (copy-paste safe)
   */
  clean(source: string) {
    return source
      .replace(/\u00A0/g, " ")
      .replace(/\t/g, "  ")
      .replace(/[^\S\r\n]+$/gm, "");
  }

  /**
   * RESOLVE IMAGE PATH
   */
  resolveImage(path: string): string {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      return this.app.vault.getResourcePath(file);
    }
    return path;
  }

  /**
   * OPEN IMAGE PICKER
   */
  pickImage(callback: (file: TFile) => void) {
    new ImagePickerModal(this.app, callback).open();
  }

  /**
   * UPDATE YAML BLOCK SAFELY
   */
  async updateFile(sourcePath: string, updatedData: any) {
    const file = this.app.vault.getAbstractFileByPath(sourcePath);
    if (!(file instanceof TFile)) return;

    const raw = await this.app.vault.read(file);

    const updatedYaml = stringifyYaml(updatedData);

    const newContent = raw.replace(
      /```card-grid[\s\S]*?```/,
      "```card-grid\n" + updatedYaml + "\n```"
    );

    await this.app.vault.modify(file, newContent);
  }

  /**
   * RENDER GRID
   */
  render(el: HTMLElement, data: any, rawSource: string, sourcePath: string) {
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

      /**
       * IMAGE
       */
      const img = box.createEl("img");
      img.src = card.image ? this.resolveImage(card.image)
        : "https://via.placeholder.com/300x200?text=Add+Image";

      img.style.width = "100%";
      img.style.height = "200px";
      img.style.objectFit = "cover";
      img.style.borderRadius = "6px";
      img.style.cursor = "pointer";

      img.onclick = () => {
        this.pickImage(async (file) => {
          card.image = file.path;

          img.src = this.app.vault.getResourcePath(file);

          await this.updateFile(sourcePath, data);
        });
      };

      /**
       * TITLE + COLOR PICKER
       */
      const title = box.createEl("h4", {
        text: card.title || "No title"
      });

      title.style.cursor = "pointer";

      title.onclick = () => {
        openColorPicker(card.color || "#e91e63", async (color) => {
          card.color = color;
          title.style.backgroundColor = color;

          await this.updateFile(sourcePath, data);
        });
      };

      if (card.color) {
        title.style.backgroundColor = card.color;
      }

      /**
       * TEXT
       */
      if (card.text) {
        box.createEl("p", { text: card.text });
      }
    });
  }
}