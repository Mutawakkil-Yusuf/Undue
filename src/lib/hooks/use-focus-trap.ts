"use client";

import { useEffect, useRef } from "react";

interface UseFocusTrapOptions {
  readonly enabled: boolean;
  readonly onEscape?: () => void;
  /** CSS selector to focus first; defaults to the first focusable control. */
  readonly initialFocus?: string;
}

/**
 * Modal focus management: lock scroll, keep Tab inside the panel, restore
 * focus, and optionally close on Escape.
 */
export function useFocusTrap<T extends HTMLElement>({
  enabled,
  onEscape,
  initialFocus,
}: UseFocusTrapOptions) {
  const panelRef = useRef<T>(null);
  const escapeRef = useRef(onEscape);

  useEffect(() => {
    escapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const panel = panelRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusableSelector =
      "input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])";

    function getFocusable(): HTMLElement[] {
      return Array.from(
        panel?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
      ).filter((element) => element.getAttribute("aria-hidden") !== "true");
    }

    const focusTimer = window.setTimeout(() => {
      const preferred = initialFocus
        ? panel?.querySelector<HTMLElement>(initialFocus)
        : null;
      (preferred ?? getFocusable()[0] ?? panel)?.focus();
    }, 50);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && escapeRef.current) {
        event.preventDefault();
        escapeRef.current();
        return;
      }
      if (event.key !== "Tab") {
        return;
      }

      const focusable = getFocusable();
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) {
        event.preventDefault();
        return;
      }

      const active = document.activeElement;
      if (event.shiftKey) {
        if (active === first || !panel?.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !panel?.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      previouslyFocused?.focus();
    };
  }, [enabled, initialFocus]);

  return panelRef;
}
