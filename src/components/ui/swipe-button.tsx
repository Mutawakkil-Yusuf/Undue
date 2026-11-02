"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ChevronRightIcon, LockIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";
import { vibrate } from "@/lib/utils/haptics";

interface SwipeButtonProps {
  label: string;
  onComplete: () => void;
  disabled?: boolean;
  className?: string;
}

export function SwipeButton({
  label,
  onComplete,
  disabled = false,
  className,
}: SwipeButtonProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const dragging = useRef(false);
  const didDrag = useRef(false);
  const finishing = useRef(false);
  const progressRef = useRef(0);
  const [progress, setProgress] = useState(0);

  function finish() {
    if (disabled || finishing.current) {
      return;
    }
    finishing.current = true;
    vibrate([10, 30, 10]);
    progressRef.current = 1;
    setProgress(1);
    // Fire inside the gesture so window.open() is not treated as a popup.
    onComplete();
    window.setTimeout(() => {
      finishing.current = false;
      progressRef.current = 0;
      setProgress(0);
    }, 180);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (disabled) {
      return;
    }
    dragging.current = true;
    didDrag.current = false;
    startX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging.current) {
      return;
    }
    const width = trackRef.current?.getBoundingClientRect().width ?? 1;
    const delta = Math.max(0, event.clientX - startX.current);
    if (delta > 6) {
      didDrag.current = true;
    }
    const next = Math.min(1, delta / Math.max(1, width - 64));
    progressRef.current = next;
    setProgress(next);
  }

  function handlePointerUp() {
    if (!dragging.current) {
      return;
    }
    dragging.current = false;
    if (progressRef.current > 0.72) {
      finish();
    } else {
      progressRef.current = 0;
      setProgress(0);
    }
  }

  function handlePointerCancel() {
    dragging.current = false;
    didDrag.current = false;
    progressRef.current = 0;
    setProgress(0);
  }

  function handleClick() {
    // A tap should not fire a destructive swipe action. Drag the handle, or use
    // Enter/Space when the control is focused.
    if (didDrag.current) {
      didDrag.current = false;
      return;
    }
    progressRef.current = 0;
    setProgress(0);
  }

  return (
    <div
      ref={trackRef}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-disabled={disabled}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          finish();
        }
      }}
      className={cn(
        "relative flex h-14 w-full touch-none items-center justify-between overflow-hidden rounded-full bg-ink-fixed px-2 text-paper select-none",
        disabled && "opacity-50",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 bg-coral transition-[width] duration-75"
        style={{ width: `${Math.max(0, progress * 100)}%` }}
      />
      <span
        aria-hidden="true"
        className="relative z-10 flex size-11 items-center justify-center rounded-full bg-paper text-ink-fixed shadow-sm"
        style={{ marginLeft: `calc(${progress * 100}% - ${progress * 56}px)` }}
      >
        <LockIcon width={18} height={18} />
      </span>
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center gap-1 text-sm font-bold">
        {label}
      </span>
      <span className="relative z-10 flex items-center pr-2 text-paper/55">
        <ChevronRightIcon width={16} height={16} />
        <ChevronRightIcon width={16} height={16} className="-ml-2" />
        <ChevronRightIcon width={16} height={16} className="-ml-2" />
      </span>
    </div>
  );
}
