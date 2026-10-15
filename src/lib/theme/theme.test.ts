import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  THEME_STORAGE_KEY,
  applyTheme,
  getServerThemeSnapshot,
  readStoredTheme,
  resolveTheme,
  setStoredTheme,
} from "./theme";

function stubMatchMedia(matches: boolean): void {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.classList.remove("dark");
  stubMatchMedia(false);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("readStoredTheme", () => {
  it("defaults to system when nothing is stored", () => {
    expect(readStoredTheme()).toBe("system");
  });

  it("returns a stored theme", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    expect(readStoredTheme()).toBe("dark");
  });

  it("ignores invalid stored values", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "sepia");
    expect(readStoredTheme()).toBe("system");
  });
});

describe("resolveTheme", () => {
  it("follows prefers-color-scheme for system", () => {
    stubMatchMedia(true);
    expect(resolveTheme("system")).toBe("dark");
    stubMatchMedia(false);
    expect(resolveTheme("system")).toBe("light");
  });

  it("returns explicit themes unchanged", () => {
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("dark")).toBe("dark");
  });
});

describe("applyTheme", () => {
  it("adds the dark class for the dark theme", () => {
    applyTheme("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("removes the dark class for the light theme", () => {
    applyTheme("dark");
    applyTheme("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("applies dark via system when the device prefers dark", () => {
    stubMatchMedia(true);
    applyTheme("system");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});

describe("setStoredTheme", () => {
  it("persists the choice and applies it", () => {
    setStoredTheme("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});

describe("getServerThemeSnapshot", () => {
  it("always reports system for SSR", () => {
    expect(getServerThemeSnapshot()).toBe("system");
  });
});
