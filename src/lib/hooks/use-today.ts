"use client";

import { useMemo, useSyncExternalStore } from "react";

const REFRESH_INTERVAL_MS = 60_000;

let currentTime = 0;
const listeners = new Set<() => void>();
let intervalId: number | undefined;

function tick(): void {
  currentTime = Date.now();
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) {
    currentTime = Date.now();
    intervalId = window.setInterval(tick, REFRESH_INTERVAL_MS);
  }
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && intervalId !== undefined) {
      window.clearInterval(intervalId);
      intervalId = undefined;
    }
  };
}

function getSnapshot(): number {
  return currentTime;
}

function getServerSnapshot(): number {
  return 0;
}

export function useToday(): Date | null {
  const milliseconds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return useMemo(
    () => (milliseconds === 0 ? null : new Date(milliseconds)),
    [milliseconds],
  );
}
