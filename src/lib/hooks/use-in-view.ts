"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

/** Becomes true the first time the element scrolls into view, and stays true. */
export function useInView<T extends Element>(): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || seen) {
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setSeen(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [seen]);

  return [ref, seen];
}
