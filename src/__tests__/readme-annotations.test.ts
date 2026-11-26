import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { tools } from "../tools/index.js";

const HINT_COLUMNS = [
  "readOnlyHint",
  "destructiveHint",
  "idempotentHint",
  "openWorldHint",
] as const;

// Anything but "true" or "false" is kept as is so that a missing or mistyped
// cell fails the comparison instead of passing as false.
const HINT_VALUES = new Map([
  ["true", true],
  ["false", false],
]);
const parseHint = (cell: string | undefined) =>
  HINT_VALUES.get(cell ?? "") ?? cell;

const readToolTable = (readme: string) => {
  const rows = readFileSync(new URL(`../../${readme}`, import.meta.url), "utf8")
    .split("\n")
    .filter((line) => line.startsWith("|"))
    .map((line) =>
      line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim()),
    );
  const header = rows.find((cells) => cells.includes("readOnlyHint")) ?? [];
  const hintIndexes = HINT_COLUMNS.map((column) => header.indexOf(column));

  return Object.fromEntries(
    rows
      .filter((cells) => /^`kintone-[a-z-]+`$/.test(cells[0] ?? ""))
      .map((cells) => [
        cells[0]?.replaceAll("`", ""),
        Object.fromEntries(
          HINT_COLUMNS.map((column, i) => [
            column,
            parseHint(cells[hintIndexes[i] ?? -1]),
          ]),
        ),
      ]),
  );
};

describe.each(["README.md", "README_en.md"])(
  "the tool table in %s",
  (readme) => {
    it("lists every tool with the annotations it advertises", () => {
      expect(readToolTable(readme)).toEqual(
        Object.fromEntries(
          tools.map((tool) => [tool.name, tool.config.annotations]),
        ),
      );
    });
  },
);
