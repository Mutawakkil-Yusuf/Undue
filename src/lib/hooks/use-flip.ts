"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import { prefersReducedMotion } from "@/lib/utils/motion";

const DURATION_MS = 260;
const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Makes list items glide to their new place instead of jumping when siblings
 * are removed, added or reordered. Give each item `data-flip-key`, and attach
 * the returned ref to the list container.
 *
 * Positions come from offsetTop/offsetLeft, which ignore transforms and scroll,
 * so entrance animations and scrolling never trigger a false move.
 */
export function useFlip<T extends HTMLElement>(): RefObject<T | null> {
  const containerRef = useRef<T>(null);
  const previous = useRef(new Map<string, { top: number; left: number }>());

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const reduced = prefersReducedMotion();
    const next = new Map<string, { top: number; left: number }>();
    const items = container.querySelectorAll<HTMLElement>("[data-flip-key]");

    for (const item of items) {
      const key = item.dataset.flipKey;
      if (!key) {
        continue;
      }
      const position = { top: item.offsetTop, left: item.offsetLeft };
      next.set(key, position);

      const before = previous.current.get(key);
      if (!before || reduced || typeof item.animate !== "function") {
        continue;
      }
      const dx = before.left - position.left;
      const dy = before.top - position.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
        continue;
      }
      item.animate(
        [
          { transform: `translate(${dx}px, ${dy}px)` },
          { transform: "translate(0px, 0px)" },
        ],
        { duration: DURATION_MS, easing: EASING },
      );
    }

    previous.current = next;
  });

  return containerRef;
}
