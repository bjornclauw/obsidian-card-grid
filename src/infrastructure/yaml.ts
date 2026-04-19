import { parseYaml, stringifyYaml } from "obsidian";

export function cleanYamlSource(source: string): string {
  return source
    .replace(/\u00a0/g, " ")
    .replace(/\t/g, "  ")
    .replace(/[^\S\r\n]+$/gm, "");
}

export function parseYamlObject(source: string): unknown {
  const cleaned = cleanYamlSource(source);
  try {
    return parseYaml(cleaned) || {};
  } catch (e) {
    console.error("Card Grid: Failed to parse YAML block", e);
    return {};
  }
}

export function stringifyYamlObject(value: unknown): string {
  return stringifyYaml(value);
}
