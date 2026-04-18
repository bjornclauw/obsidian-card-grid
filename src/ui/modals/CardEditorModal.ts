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
  .card-grid-modal-container {
    display: flex;
    flex-direction: row;
    gap: 20px;
    height: 65vh;
    min-height: 400px;
  }

  .card-grid-editor-side {
    flex: 1.2;
    overflow-y: auto;
    padding-right: 15px;
  }

  .card-grid-preview-side {
    flex: 0.8;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: var(--background-secondary);
    border-radius: 8px;
    padding: 20px;
    border: 1px solid var(--background-modifier-border);
    position: sticky;
    top: 0;
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

  private previewView: any = null;
  private previewTimeout: number | null = null;

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

    // Make modal wider for side-by-side preview
    this.modalEl.style.width = "900px";
    this.modalEl.style.maxWidth = "95vw";

    contentEl.addClass("card-grid-editor");
    contentEl.addClass(`card-type-${this.def.type}`);

    injectStyles(contentEl);

    const container = contentEl.createDiv("card-grid-modal-container");
    const editorSide = container.createDiv("card-grid-editor-side");
    const previewSide = container.createDiv("card-grid-preview-side");

    this.setupPreview(previewSide);
    this.renderFields(this.def.editor, editorSide);
    this.debouncedRefresh();

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

  private setupPreview(container: HTMLElement) {
    const ctx = {
      app: this.app,
      plugin: this.plugin,
      sourcePath: this.sourcePath,
      grid: this.grid
    };
    this.previewView = this.def.createView(ctx);
    container.appendChild(this.previewView.el);
  }

  private debouncedRefresh() {
    if (this.previewTimeout) window.clearTimeout(this.previewTimeout);
    this.previewTimeout = window.setTimeout(() => this.renderPreview(), 150);
  }

  private renderPreview() {
    if (!this.previewView) return;

    const ctx = {
      app: this.app,
      plugin: this.plugin,
      sourcePath: this.sourcePath,
      grid: this.grid
    };

    const gridHost = document.querySelector(`[data-card-grid-id="${this.grid.id}"]`);
    const gridContainer = gridHost?.querySelector(".card-grid-container") as HTMLElement;
    const gridWidth = gridContainer?.offsetWidth || 800;

    const columns = this.grid.columns || 3;
    const gap = this.grid.gap ?? 10;
    const widthFraction = Number(this.draft["width"]) || 1;

    const realPixelWidth = ((gridWidth + gap) / columns) * widthFraction - gap;
    this.previewView.el.style.width = `${realPixelWidth}px`;

    const ratio = widthFraction / columns;

    let zoom = ratio > 0.8 ? 0.5 : (ratio > 0.4 ? 0.6 : 0.8);
    if (this.def.type === "procedure" && ratio > 0.4) zoom = 0.45;

    // Ensure the card doesn't stretch vertically in the flex container
    this.previewView.el.style.height = "auto";
    this.previewView.el.style.flex = "none";
    this.previewView.el.style.zoom = String(zoom);

    const normalized = this.def.normalize(this.draft);
    this.previewView.update(normalized, ctx);
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
        t.onChange((v) => {
          setValue(v);
          this.debouncedRefresh();
        });
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
          this.debouncedRefresh();
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
          d.onChange((v) => {
            setValue(v);
            this.debouncedRefresh();
          });
        });
      return;
    }

    if (field.kind === "toggle") {
      new Setting(container)
        .setName(field.label)
        .addToggle((t: ToggleComponent) => {
          const initial = getBoolean();
          t.setValue(initial ?? field.defaultValue ?? false);
          t.onChange((v) => {
            setValue(v);
            this.debouncedRefresh();
          });
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
          c.onChange((v) => {
            setValue(v);
            this.debouncedRefresh();
          });
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
            this.debouncedRefresh();
          }).open();
        })
      );

      setting.addButton((b: ButtonComponent) =>
        b.setButtonText("Clear").onClick(() => {
          setValue("");
          renderDesc();
          this.debouncedRefresh();
        })
      );
      return;
    }

    if (field.kind === "markdown") {
      new Setting(container).setName(field.label).addTextArea((t) => {
        t.setValue(getString());
        t.setPlaceholder(field.placeholder ?? "");
        t.onChange((v) => {
          setValue(v);
          this.debouncedRefresh();
        });
        t.inputEl.rows = 8;
        t.inputEl.style.width = "100%";
      });
      return;
    }
  }
}