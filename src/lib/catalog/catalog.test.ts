import { describe, expect, it } from "vitest";
import { getCatalog, getCatalogEntry, searchCatalog } from "@/lib/catalog";
import { catalogEntrySchema } from "@/lib/catalog/schema";

describe("catalog", () => {
  it("loads and validates every entry", () => {
    const catalog = getCatalog();
    expect(catalog.length).toBeGreaterThan(40);
    for (const entry of catalog) {
      expect(catalogEntrySchema.safeParse(entry).success).toBe(true);
    }
  });

  it("has unique ids", () => {
    const ids = getCatalog().map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("looks up an entry by id", () => {
    expect(getCatalogEntry("netflix")?.name).toBe("Netflix");
    expect(getCatalogEntry("missing")).toBeUndefined();
  });

  it("ranks prefix matches ahead of substring-only matches", () => {
    const needle = "s";
    const results = searchCatalog(needle);
    const isPrefixMatch = (entry: { name: string; aliases: readonly string[] }) =>
      [entry.name, ...entry.aliases].some((value) =>
        value.toLowerCase().startsWith(needle),
      );

    expect(results.length).toBeGreaterThan(0);
    expect(isPrefixMatch(results[0]!)).toBe(true);
  });

  it("matches aliases", () => {
    const results = searchCatalog("dstv nigeria");
    expect(results.some((entry) => entry.id === "dstv")).toBe(true);
  });

  it("returns everything (sorted) for an empty query", () => {
    const results = searchCatalog("");
    expect(results.length).toBeGreaterThan(0);
    const sorted = [...results].sort((a, b) => a.name.localeCompare(b.name));
    expect(results.map((entry) => entry.id)).toEqual(sorted.map((entry) => entry.id));
  });
});
