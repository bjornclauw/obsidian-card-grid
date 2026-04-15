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
import type { CardInstance } from "../../domain/types";
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

export class CardEditorModal<TCard extends CardInstance> extends Modal {
  private readonly plugin: Plugin;
  private readonly sourcePath: string;
  private readonly def: CardTypeDefinition<TCard>;
  private readonly draft: Record<string, unknown>;
  private readonly onSubmit: OnSubmit;

  constructor(
    app: App,
    plugin: Plugin,
    sourcePath: string,
    def: CardTypeDefinition<TCard>,
    card: TCard,
    onSubmit: OnSubmit
  ) {
    super(app);
    this.plugin = plugin;
    this.sourcePath = sourcePath;
    this.def = def;
    this.draft = clone(card) as unknown as Record<string, unknown>;
    this.onSubmit = onSubmit;
    this.setTitle(def.editor.title);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("card-grid-editor");

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

        // Create same structure as real card
        const card = previewWrap.createDiv("card-grid-preview-card");
        const content = card.createDiv("card-grid-preview-content");

        await MarkdownRenderer.render(
          this.app,
          getString() || " ",
          content,
          this.sourcePath,
          this.plugin
        );
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