"use client";

import { useEffect, useRef, useState } from "react";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useCountUp(target: number, duration = 650): number {
  const [value, setValue] = useState(target);
  const previous = useRef(target);
  const frame = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (prefersReducedMotion() || !Number.isFinite(target)) {
      previous.current = target;
      frame.current = requestAnimationFrame(() => setValue(target));
      return () => {
        if (frame.current !== undefined) {
          cancelAnimationFrame(frame.current);
        }
      };
    }

    const from = previous.current;
    previous.current = target;
    if (from === target) {
      return;
    }

    const startedAt = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(from + (target - from) * eased);
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick);
      }
    };

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current !== undefined) {
        cancelAnimationFrame(frame.current);
      }
    };
  }, [target, duration]);

  return value;
}
