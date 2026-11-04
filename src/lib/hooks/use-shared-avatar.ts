"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import { prefersReducedMotion } from "@/lib/utils/motion";

const DURATION_MS = 340;
const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

function isOnScreen(rect: DOMRect): boolean {
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom > 0 &&
    rect.top < window.innerHeight &&
    rect.right > 0 &&
    rect.left < window.innerWidth
  );
}

/**
 * Grows the tapped card's avatar into this element. Cards mark their avatar
 * with `data-shared-id={subscription.id}`; the returned ref goes on the
 * matching element in the detail sheet. Does nothing when no card avatar is
 * visible (for example when the sheet was opened from the hero card).
 */
export function useSharedAvatar<T extends HTMLElement>(id: string): RefObject<T | null> {
  const targetRef = useRef<T>(null);

  useLayoutEffect(() => {
    const target = targetRef.current;
    if (!target || prefersReducedMotion() || typeof target.animate !== "function") {
      return;
    }

    const candidates = document.querySelectorAll<HTMLElement>(
      `[data-shared-id="${CSS.escape(id)}"]`,
    );
    let source: HTMLElement | null = null;
    for (const candidate of candidates) {
      if (!target.contains(candidate) && isOnScreen(candidate.getBoundingClientRect())) {
        source = candidate;
        break;
      }
    }
    if (!source) {
      return;
    }

    const from = source.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    if (to.width === 0 || to.height === 0) {
      return;
    }

    const scale = from.width / to.width;
    const dx = from.left - to.left;
    const dy = from.top - to.top;
    target.animate(
      [
        {
          transformOrigin: "top left",
          transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
        },
        { transformOrigin: "top left", transform: "translate(0px, 0px) scale(1)" },
      ],
      { duration: DURATION_MS, easing: EASING },
    );
  }, [id]);

  return targetRef;
}
