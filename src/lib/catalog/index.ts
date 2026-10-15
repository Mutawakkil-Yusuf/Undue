import rawCatalog from "@/data/catalog.ng.json";
import { catalogEntrySchema, type CatalogEntry } from "./schema";

const catalogSchema = catalogEntrySchema.array();

const CATALOG: readonly CatalogEntry[] = catalogSchema.parse(rawCatalog);

const byId = new Map(CATALOG.map((entry) => [entry.id, entry]));

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function getCatalog(): readonly CatalogEntry[] {
  return CATALOG;
}

export function getCatalogEntry(id: string): CatalogEntry | undefined {
  return byId.get(id);
}

export function searchCatalog(query: string, limit = 40): CatalogEntry[] {
  const needle = normalize(query);
  if (needle.length === 0) {
    return [...CATALOG].sort((a, b) => a.name.localeCompare(b.name)).slice(0, limit);
  }

  const startsWith: CatalogEntry[] = [];
  const contains: CatalogEntry[] = [];

  for (const entry of CATALOG) {
    const haystacks = [entry.name, ...entry.aliases].map(normalize);
    if (haystacks.some((value) => value.startsWith(needle))) {
      startsWith.push(entry);
    } else if (haystacks.some((value) => value.includes(needle))) {
      contains.push(entry);
    }
  }

  const byName = (a: CatalogEntry, b: CatalogEntry) => a.name.localeCompare(b.name);
  return [...startsWith.sort(byName), ...contains.sort(byName)].slice(0, limit);
}
