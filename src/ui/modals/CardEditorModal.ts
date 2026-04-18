import {
  App,
  ButtonComponent,
  DropdownComponent,
  MarkdownRenderer,
  Modal,
  Setting,
  TextAreaComponent,
  TextComponent,
  ToggleComponent
} from "obsidian";
import type { Plugin } from "obsidian";
import type { CardGridData, CardInstance } from "../../domain/types";
import type {
  CardEditorField,
  CardEditorSpec,
  CardTypeDefinition
} from "../../cards/registry";
import { ImagePickerModal } from "./ImagePickerModal";

function clone<T>(value: T): T {
  const sc = (globalThis as unknown as { structuredClone?: <U>(v: U) => U })
    .structuredClone as ((v: T) => T) | undefined;
  if (sc) return sc(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

type OnSubmit = (updated: CardInstance | null) => void;

// ✅ Scoped styles (safe, minimal, no layout breaking)
function injectStyles(container: HTMLElement) {
  if (container.querySelector("style[data-card-editor]")) return;

  const style = document.createElement("style");
  style.setAttribute("data-card-editor", "true");
  style.textContent = `
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
    min-height: 150px;
    max-height: 400px;
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

export class CardEditorModal<TCard extends CardInstance> extends Modal {
  private readonly plugin: Plugin;
  private readonly sourcePath: string;
  private readonly grid: CardGridData;
  private readonly def: CardTypeDefinition<TCard>;
  private readonly draft: Record<string, unknown>;
  private readonly onSubmit: OnSubmit;

  constructor(
    app: App,
    plugin: Plugin,
    sourcePath: string,
    grid: CardGridData,
    def: CardTypeDefinition<TCard>,
    card: TCard,
    onSubmit: OnSubmit
  ) {
    super(app);
    this.plugin = plugin;
    this.sourcePath = sourcePath;
    this.grid = grid;
    this.def = def;
    this.draft = clone(card) as unknown as Record<string, unknown>;
    this.onSubmit = onSubmit;
    this.setTitle(def.editor.title);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("card-grid-editor");
    contentEl.addClass(`card-type-${this.def.type}`);

    injectStyles(contentEl);

    this.renderFields(this.def.editor, contentEl);

    new Setting(contentEl)
      .addButton((b) =>
        b.setButtonText("Cancel").onClick(() => {
          this.onSubmit(null);
          this.close();
        })
      )
      .addButton((b) =>
        b.setCta().setButtonText("Save").onClick(() => {
          const normalized = this.def.normalize(this.draft);
          this.onSubmit(normalized);
          this.close();
        })
      );
  }

  onClose(): void {
    this.contentEl.empty();
  }

  private renderFields(spec: CardEditorSpec, container: HTMLElement): void {
    for (const field of spec.fields) {
      this.renderField(field, container);
    }
  }

  private renderField(field: CardEditorField, container: HTMLElement): void {
    const key = field.key;

    const getString = () =>
      typeof this.draft[key] === "string" ? (this.draft[key] as string) : "";

    const getNumber = () =>
      typeof this.draft[key] === "number"
        ? (this.draft[key] as number)
        : undefined;

    const getBoolean = () =>
      typeof this.draft[key] === "boolean"
        ? (this.draft[key] as boolean)
        : undefined;

    const setValue = (value: unknown) => {
      this.draft[key] = value;
    };

    if (field.kind === "text") {
      new Setting(container).setName(field.label).addText((t: TextComponent) => {
        t.setPlaceholder(field.placeholder ?? "").setValue(getString());
        t.onChange((v) => setValue(v));
      });
      return;
    }

    if (field.kind === "number") {
      new Setting(container).setName(field.label).addText((t: TextComponent) => {
        const initial = getNumber();
        t.setValue(initial === undefined ? "" : String(initial));
        t.onChange((v) => {
          const n = Number(v);
          setValue(Number.isFinite(n) ? n : undefined);
        });
      });
      return;
    }

    if (field.kind === "select") {
      new Setting(container)
        .setName(field.label)
        .addDropdown((d: DropdownComponent) => {
          for (const opt of field.options) d.addOption(opt.value, opt.label);
          const initial =
            typeof this.draft[key] === "string"
              ? (this.draft[key] as string)
              : field.defaultValue ?? field.options[0]?.value ?? "";
          if (initial) d.setValue(initial);
          d.onChange((v) => setValue(v));
        });
      return;
    }

    if (field.kind === "toggle") {
      new Setting(container)
        .setName(field.label)
        .addToggle((t: ToggleComponent) => {
          const initial = getBoolean();
          t.setValue(initial ?? field.defaultValue ?? false);
          t.onChange((v) => setValue(v));
        });
      return;
    }

    if (field.kind === "color") {
      new Setting(container)
        .setName(field.label)
        .addColorPicker((c) => {
          const initial =
            typeof this.draft[key] === "string"
              ? (this.draft[key] as string)
              : field.defaultValue ?? "#cccccc";
          c.setValue(initial);
          c.onChange((v) => setValue(v));
        });
      return;
    }

    if (field.kind === "image-file") {
      const setting = new Setting(container).setName(field.label);
      const desc = setting.descEl;

      const renderDesc = () => {
        const v = getString();
        desc.setText(v ? v : "(none)");
      };
      renderDesc();

      setting.addButton((b: ButtonComponent) =>
        b.setButtonText("Choose…").onClick(() => {
          new ImagePickerModal(this.app, (file) => {
            setValue(file.path);
            renderDesc();
          }).open();
        })
      );

      setting.addButton((b: ButtonComponent) =>
        b.setButtonText("Clear").onClick(() => {
          setValue("");
          renderDesc();
        })
      );
      return;
    }

    // ✨ Pretty markdown editor
    if (field.kind === "markdown") {
      const setting = new Setting(container).setName(field.label);
      const wrapper = setting.controlEl.createDiv("card-grid-md-field");

      const toolbar = wrapper.createDiv("card-grid-md-toolbar");
      const editorWrap = wrapper.createDiv("card-grid-md-editor");
      const previewWrap = wrapper.createDiv("card-grid-md-preview");

      const textarea = new TextAreaComponent(editorWrap);
      textarea.inputEl.rows = 8;
      textarea.setValue(getString());
      textarea.setPlaceholder(field.placeholder ?? "");
      textarea.onChange((v) => setValue(v));

      let showingPreview = false;

      const renderPreview = async () => {
        previewWrap.empty();

        const ctx = {
          app: this.app,
          plugin: this.plugin,
          sourcePath: this.sourcePath,
          grid: this.grid
        };

        const view = this.def.createView(ctx);
        const cardEl = view.el;

        // 1. Determine the actual width of the grid on screen to replicate layout accurately
        const gridHost = document.querySelector(`[data-card-grid-id="${this.grid.id}"]`);
        const gridContainer = gridHost?.querySelector(".card-grid-container") as HTMLElement;
        const gridWidth = gridContainer?.offsetWidth || 800;

        const columns = this.grid.columns || 3;
        const gap = this.grid.gap ?? 10;
        const widthFraction = Number(this.draft["width"]) || 1;

        // 2. Calculate exactly how wide this card is in the actual grid
        const realPixelWidth = ((gridWidth + gap) / columns) * widthFraction - gap;

        // 3. Apply the real width and calculate adaptive zoom
        cardEl.style.width = `${realPixelWidth}px`;
        const availableWidth = previewWrap.clientWidth || 500;
        const fitZoom = (availableWidth - 10) / realPixelWidth;
        const ratio = widthFraction / columns;

        // Narrow cards (often tall) are zoomed out more; wide cards are zoomed in for better visibility
        let zoom = fitZoom;
        if (ratio <= 0.4) {
          zoom = Math.min(fitZoom, 0.75);
        } else if (ratio >= 0.8) {
          zoom = Math.min(1.0, fitZoom * 1.15);
        } else {
          zoom = Math.min(1.0, fitZoom);
        }

        cardEl.style.flex = "0 0 auto";
        cardEl.style.margin = "0 auto";
        // @ts-ignore - zoom is a non-standard but effective way to scale in Electron/Obsidian
        cardEl.style.zoom = String(zoom);

        previewWrap.appendChild(cardEl);

        const normalized = this.def.normalize(this.draft);
        view.update(normalized, ctx);
      };

      const update = () => {
        editorWrap.style.display = showingPreview ? "none" : "";
        previewWrap.style.display = showingPreview ? "" : "none";
      };

      const editBtn = new ButtonComponent(toolbar)
        .setButtonText("Edit")
        .setCta()
        .onClick(() => {
          showingPreview = false;
          editBtn.setCta();
          previewBtn.removeCta();
          update();
        });

      const previewBtn = new ButtonComponent(toolbar)
        .setButtonText("Preview")
        .onClick(async () => {
          showingPreview = true;
          previewBtn.setCta();
          editBtn.removeCta();
          update();
          await renderPreview();
        });

      update();
      return;
    }
  }
}