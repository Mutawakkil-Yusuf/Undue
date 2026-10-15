export const THEMES = ["system", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "undue-theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function isTheme(value: unknown): value is Theme {
  return value === "system" || value === "light" || value === "dark";
}

export function readStoredTheme(): Theme {
  if (typeof window === "undefined") {
    return "system";
  }
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(value) ? value : "system";
  } catch {
    return "system";
  }
}

export function prefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }
  return window.matchMedia(DARK_QUERY).matches;
}

export function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === "system") {
    return prefersDark() ? "dark" : "light";
  }
  return theme;
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") {
    return;
  }
  const resolved = resolveTheme(theme);
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

export function setStoredTheme(theme: Theme): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage may be unavailable (private mode); the in-memory state still works.
  }
  applyTheme(theme);
  emit();
}

export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", listener);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
    media.removeEventListener("change", listener);
  };
}

export function getThemeSnapshot(): Theme {
  return readStoredTheme();
}

export function getServerThemeSnapshot(): Theme {
  return "system";
}

export function getSystemDarkSnapshot(): boolean {
  return prefersDark();
}

export function getServerSystemDarkSnapshot(): boolean {
  return false;
}

export const THEME_LABELS: Record<Theme, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};
