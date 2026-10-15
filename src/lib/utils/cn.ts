type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly ClassValue[]
  | Record<string, boolean | null | undefined>;

function toClassNames(value: ClassValue, acc: string[]): void {
  if (!value) {
    return;
  }

  if (typeof value === "string" || typeof value === "number") {
    acc.push(String(value));
    return;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      toClassNames(entry, acc);
    }
    return;
  }

  if (typeof value === "object") {
    for (const [key, enabled] of Object.entries(value)) {
      if (enabled) {
        acc.push(key);
      }
    }
  }
}

export function cn(...inputs: readonly ClassValue[]): string {
  const acc: string[] = [];
  for (const input of inputs) {
    toClassNames(input, acc);
  }
  return acc.join(" ");
}
