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

/** Normalize a YAML string for comparison: clean whitespace so minor
 *  formatting differences (trailing spaces, tab vs space) don't cause misses. */
function normalizeYaml(yaml: string): string {
  return cleanYamlSource(yaml).trim();
}

export class CardGridRepository {
  private readonly app: App;

  constructor(app: App) {
    this.app = app;
  }

  async save(ref: GridBlockRef, data: CardGridData): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(ref.sourcePath);
    if (!(file instanceof TFile)) return;

    const yamlObj = serializeCardGridData(data);
    const yaml = stringifyYamlObject(yamlObj).trimEnd();
    const newBlock = ["```card-grid", yaml, "```"].join("\n");

    await this.app.vault.process(file, (dataStr) => {
      const lines = dataStr.split("\n");
      const blocks = findCardGridBlocks(lines);

      // Priority 1: match by the grid's stable UUID-based id field.
      const byId = blocks.find((b) => b.parsedId === data.id);

      // Priority 2: match by the original YAML source string captured at
      // render time (stored on ref.codeBlockSource).  This handles the case
      // where the "Collapsed Codeblocks" plugin remounts a block with
      // different getSectionInfo() line numbers, or when the block doesn't
      // yet have an id field.  Content is always unique at render time.
      const bySource = this.resolveBySource(ref, blocks);

      // Priority 3: match by the line numbers captured at render time.
      // These can become stale after other saves shift line numbers, so this
      // is only used as a last resort.
      const byRef = this.resolveByRef(lines, ref, blocks);

      const target = byId ?? bySource ?? byRef;

      if (!target) return dataStr;

      const newLines = [
        ...lines.slice(0, target.lineStart),
        newBlock,
        ...lines.slice(target.lineEnd + 1)
      ];

      return newLines.join("\n");
    });
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

  /** Content-based fallback: find the block whose raw YAML matches the source
   *  string that was captured at render time.  Handles remounting by the
   *  "Collapsed Codeblocks" plugin and any other plugin that re-creates the
   *  MarkdownRenderChild element with different line numbers. */
  private resolveBySource(
    ref: GridBlockRef,
    blocks: BlockMatch[]
  ): BlockMatch | null {
    if (!ref.codeBlockSource) return null;
    const needle = normalizeYaml(ref.codeBlockSource);
    if (!needle) return null;
    return blocks.find((b) => normalizeYaml(b.rawYaml) === needle) ?? null;
  }
}
