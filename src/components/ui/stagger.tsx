"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** Flips once the first screen has been shown, so later mounts do not replay. */
let entrancePlayed = false;

const STEP_MS = 60;
const MAX_STEPS = 5;

/**
 * Rises its children in a short cascade the first time the dashboard appears
 * in a session. `empty:hidden` keeps a wrapper whose child renders nothing
 * from adding a stray gap to its flex parent.
 */
export function Stagger({
  index,
  children,
  className,
}: {
  index: number;
  children: ReactNode;
  className?: string;
}) {
  const [animate] = useState(() => !entrancePlayed);

  useEffect(() => {
    entrancePlayed = true;
  }, []);

  return (
    <div
      className={cn("empty:hidden", animate && "animate-rise-in", className)}
      style={
        animate
          ? { animationDelay: `${Math.min(index, MAX_STEPS) * STEP_MS}ms` }
          : undefined
      }
    >
      {children}
    </div>
  );
}
