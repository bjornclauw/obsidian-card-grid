import {
  App,
  Modal,
} from "obsidian";
import type { Plugin } from "obsidian";
import type { CardGridData, CardInstance } from "../../domain/types";
import type {
  CardEditorField,
  CardEditorSpec,
  CardTypeDefinition
} from "../../cards/registry";
import Editor from "./Editor.svelte";

function clone<T>(value: T): T {
  const sc = (globalThis as unknown as { structuredClone?: <U>(v: U) => U })
    .structuredClone as ((v: T) => T) | undefined;
  if (sc) return sc(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

type OnSubmit = (updated: CardInstance | null) => void;

export class CardEditorModal<TCard extends CardInstance> extends Modal {
  private readonly plugin: Plugin;
  private readonly sourcePath: string;
  private readonly grid: CardGridData;
  private readonly def: CardTypeDefinition<TCard>;
  private draft: Record<string, unknown>;
  private readonly onSubmit: OnSubmit;
  private svelteComponent?: Editor;

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
    this.modalEl.style.width = "900px";
    this.modalEl.style.maxWidth = "95vw";
    this.contentEl.empty();

    this.svelteComponent = new Editor({
      target: this.contentEl,
      props: {
        app: this.app,
        plugin: this.plugin,
        grid: this.grid,
        def: this.def,
        draft: this.draft,
        sourcePath: this.sourcePath,
        onSave: (finalDraft: any) => {
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

  onClose(): void {
    this.svelteComponent?.$destroy();
  }
}