"use client";

import { useCallback, useEffect, useRef } from "react";
import { Mascot, type MascotVariant } from "@/components/brand/mascot";
import { MASCOT_REACTION_EVENT, type MascotReaction } from "@/lib/utils/mascot-events";
import { prefersReducedMotion } from "@/lib/utils/motion";
import { cn } from "@/lib/utils/cn";

type MoveName = MascotReaction | "morph";

const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

const MOVES: Record<MoveName, { frames: Keyframe[]; duration: number }> = {
  hop: {
    duration: 460,
    frames: [
      { transform: "translateY(0) scale(1, 1)" },
      { transform: "translateY(0) scale(1.08, 0.9)", offset: 0.18 },
      { transform: "translateY(-14px) scale(0.95, 1.08)", offset: 0.5 },
      { transform: "translateY(0) scale(1.06, 0.94)", offset: 0.8 },
      { transform: "translateY(0) scale(1, 1)" },
    ],
  },
  nod: {
    duration: 400,
    frames: [
      { transform: "rotate(0deg)", transformOrigin: "50% 100%" },
      {
        transform: "rotate(7deg) translateY(2px)",
        transformOrigin: "50% 100%",
        offset: 0.35,
      },
      { transform: "rotate(-3deg)", transformOrigin: "50% 100%", offset: 0.7 },
      { transform: "rotate(0deg)", transformOrigin: "50% 100%" },
    ],
  },
  morph: {
    duration: 380,
    frames: [
      { transform: "scale(1, 1)" },
      { transform: "scale(1.12, 0.88)", offset: 0.3 },
      { transform: "scale(0.94, 1.08)", offset: 0.65 },
      { transform: "scale(1, 1)" },
    ],
  },
};

const ANTENNA_BOING: Keyframe[] = [
  { transform: "rotate(0deg)" },
  { transform: "rotate(-18deg)", offset: 0.25 },
  { transform: "rotate(12deg)", offset: 0.55 },
  { transform: "rotate(-6deg)", offset: 0.8 },
  { transform: "rotate(0deg)" },
];

/** How far (in SVG units) the eyes may shift toward the pointer. */
const LOOK_X = 3.5;
const LOOK_Y = 2.5;
const LOOK_RESET_MS = 1400;

interface AnimatedMascotProps {
  variant?: MascotVariant;
  color?: string;
  size?: number;
  className?: string;
  title?: string | undefined;
  /** Also plays short reactions when other parts of the app ask for them. */
  reactive?: boolean;
}

/**
 * The mascot with life in it: it blinks, its antennae sway, the eyes follow
 * the pointer (or the last tap), it boings when tapped, and it squashes and
 * stretches when its mood changes. All of it stops under reduced motion.
 */
export function AnimatedMascot({
  variant = "happy",
  reactive = false,
  ...rest
}: AnimatedMascotProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const previousVariant = useRef(variant);

  const play = useCallback((name: MoveName) => {
    const element = ref.current;
    if (!element || prefersReducedMotion() || typeof element.animate !== "function") {
      return;
    }
    const move = MOVES[name];
    element.animate(move.frames, { duration: move.duration, easing: EASING });
  }, []);

  const boingAntennae = useCallback(() => {
    const element = ref.current;
    if (!element || prefersReducedMotion()) {
      return;
    }
    for (const antenna of element.querySelectorAll<SVGElement>(".mascot-antenna")) {
      if (typeof antenna.animate === "function") {
        antenna.animate(ANTENNA_BOING, { duration: 500, easing: "ease-out" });
      }
    }
  }, []);

  // Squash and stretch whenever the mood changes.
  useEffect(() => {
    if (previousVariant.current !== variant) {
      previousVariant.current = variant;
      play("morph");
    }
  }, [variant, play]);

  // Reactions requested from elsewhere, such as tapping Keep or Cut.
  useEffect(() => {
    if (!reactive) {
      return;
    }
    const onReact = (event: Event) => {
      const reaction = (event as CustomEvent<MascotReaction>).detail;
      if (reaction === "hop" || reaction === "nod") {
        play(reaction);
      }
    };
    window.addEventListener(MASCOT_REACTION_EVENT, onReact);
    return () => window.removeEventListener(MASCOT_REACTION_EVENT, onReact);
  }, [reactive, play]);

  // Eyes follow a mouse, or look toward wherever a finger last touched.
  useEffect(() => {
    const element = ref.current;
    if (!element || prefersReducedMotion()) {
      return;
    }
    let frame = 0;
    let resetTimer: number | undefined;

    const lookAt = (x: number, y: number) => {
      const rect = element.getBoundingClientRect();
      if (rect.width === 0) {
        return;
      }
      const dx = x - (rect.left + rect.width / 2);
      const dy = y - (rect.top + rect.height / 2);
      const distance = Math.hypot(dx, dy) || 1;
      const strength = Math.min(1, distance / 200);
      element.style.setProperty("--look-x", `${(dx / distance) * LOOK_X * strength}px`);
      element.style.setProperty("--look-y", `${(dy / distance) * LOOK_Y * strength}px`);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") {
        return;
      }
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => lookAt(event.clientX, event.clientY));
    };

    const onDown = (event: PointerEvent) => {
      lookAt(event.clientX, event.clientY);
      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        element.style.setProperty("--look-x", "0px");
        element.style.setProperty("--look-y", "0px");
      }, LOOK_RESET_MS);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(resetTimer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return (
    <span ref={ref} className="inline-flex shrink-0" onPointerDown={boingAntennae}>
      <Mascot variant={variant} animated {...rest} />
    </span>
  );
}

/** Round avatar frame around an animated mascot, matching MascotAvatar. */
export function AnimatedMascotAvatar({
  variant = "happy",
  color = "var(--color-yellow)",
  size = 48,
  className,
  title,
  reactive = false,
}: {
  variant?: MascotVariant;
  color?: string;
  size?: number;
  className?: string;
  title?: string;
  reactive?: boolean;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--color-paper)] ring-2 ring-ink",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <AnimatedMascot
        variant={variant}
        color={color}
        size={size * 0.78}
        title={title}
        reactive={reactive}
      />
    </span>
  );
}
