import { App, TFile } from "obsidian";
import type { CardGridData, GridBlockRef } from "../domain/types";
import { cleanYamlSource, parseYamlObject, stringifyYamlObject } from "./yaml";
import { serializeCardGridData } from "../domain/codec";

type BlockMatch = {
  lineStart: number;
  lineEnd: number;
  rawYaml: string;
  parsedId?: string;
};

function isFenceStart(line: string): boolean {
  return line.trimEnd() === "```card-grid";
}

function isFenceEnd(line: string): boolean {
  return line.trimEnd() === "```";
}

function findCardGridBlocks(lines: string[]): BlockMatch[] {
  const blocks: BlockMatch[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (!isFenceStart(lines[i])) continue;
    let j = i + 1;
    while (j < lines.length && !isFenceEnd(lines[j])) j++;
    if (j >= lines.length) break;

    const rawYaml = lines.slice(i + 1, j).join("\n");
    let parsedId: string | undefined;
    try {
      const parsed = parseYamlObject(cleanYamlSource(rawYaml));
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const id = (parsed as Record<string, unknown>).id;
        if (typeof id === "string") parsedId = id;
      }
    } catch {
      // Ignore parse errors and fall back to line-based replacement.
    }

    blocks.push({ lineStart: i, lineEnd: j, rawYaml, parsedId });
    i = j;
  }
  return blocks;
}

export class CardGridRepository {
  private readonly app: App;

  constructor(app: App) {
    this.app = app;
  }

  async save(ref: GridBlockRef, data: CardGridData): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(ref.sourcePath);
    if (!(file instanceof TFile)) return;

    const raw = await this.app.vault.read(file);
    const lines = raw.split("\n");

    const yamlObj = serializeCardGridData(data);
    const yaml = stringifyYamlObject(yamlObj).trimEnd();
    const newBlock = ["```card-grid", yaml, "```"].join("\n");

    const blocks = findCardGridBlocks(lines);
    const byId = blocks.find((b) => b.parsedId === data.id);
    const target = byId ?? this.resolveByRef(lines, ref, blocks);
    if (!target) return;

    const newLines = [
      ...lines.slice(0, target.lineStart),
      newBlock,
      ...lines.slice(target.lineEnd + 1)
    ];

    await this.app.vault.modify(file, newLines.join("\n"));
  }

  private resolveByRef(
    lines: string[],
    ref: GridBlockRef,
    blocks: BlockMatch[]
  ): BlockMatch | null {
    const { lineStart, lineEnd } = ref;
    if (
      lineStart !== undefined &&
      lineEnd !== undefined &&
      lineStart >= 0 &&
      lineEnd >= lineStart &&
      lineEnd < lines.length &&
      isFenceStart(lines[lineStart]) &&
      isFenceEnd(lines[lineEnd])
    ) {
      return { lineStart, lineEnd, rawYaml: lines.slice(lineStart + 1, lineEnd).join("\n") };
    }

    // If only one block exists, update it to keep behavior predictable.
    if (blocks.length === 1) return blocks[0];
    return null;
  }
}

