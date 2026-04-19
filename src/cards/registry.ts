import type { App, Plugin } from "obsidian";
import type { CardGridData, CardInstance, CardTypeId } from "../domain/types";

export type CardEditorField =
  | {
    kind: "text";
    key: string;
    label: string;
    placeholder?: string;
  }
  | {
    kind: "link";
    key: string;
    label: string;
    placeholder?: string;
  }
  | {
    kind: "markdown";
    key: string;
    label: string;
    placeholder?: string;
  }
  | {
    kind: "number";
    key: string;
    label: string;
    min?: number;
    max?: number;
    step?: number;
    defaultValue?: number;
  }
  | {
    kind: "select";
    key: string;
    label: string;
    options: Array<{ label: string; value: string }>;
    defaultValue?: string;
  }
  | {
    kind: "toggle";
    key: string;
    label: string;
    defaultValue?: boolean;
  }
  | {
    kind: "color";
    key: string;
    label: string;
    defaultValue?: string;
  }
  | {
    kind: "image-file";
    key: string;
    label: string;
  }
  | {
    kind: "button";
    key: string;
    label: string;
  }
  | {
    kind: "icon";
    key: string;
    label: string;
  };

export interface CardEditorSpec {
  title: string;
  fields: CardEditorField[];
}

export interface ICardGridController {
  updateCardProperties(id: string, patch: Record<string, any>): void;
}

export interface CardViewContext {
  app: App;
  plugin: Plugin;
  sourcePath: string;
  grid: CardGridData;
  controller?: ICardGridController;
}

export interface CardView<TCard extends CardInstance = CardInstance> {
  el: HTMLElement;
  update(card: TCard, ctx: CardViewContext): void;
}

export interface CardTypeDefinition<TCard extends CardInstance = CardInstance> {
  type: CardTypeId;
  displayName: string;
  description?: string;
  editor: CardEditorSpec;
  normalize(raw: unknown): TCard;
  createView(ctx: CardViewContext): CardView<TCard>;
}

export class CardTypeRegistry {
  private defs = new Map<CardTypeId, CardTypeDefinition>();

  register<TCard extends CardInstance>(def: CardTypeDefinition<TCard>): void {
    this.defs.set(def.type, def as CardTypeDefinition);
  }

  get(type: CardTypeId): CardTypeDefinition {
    return this.defs.get(type) ?? this.defs.get("unknown")!;
  }

  has(type: CardTypeId): boolean {
    return this.defs.has(type);
  }

  list(): CardTypeDefinition[] {
    return Array.from(this.defs.values());
  }
}
