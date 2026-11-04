export type MascotReaction = "hop" | "nod";

export const MASCOT_REACTION_EVENT = "undue:mascot-react";

/** Asks every reactive mascot on screen to play a short reaction. */
export function mascotReact(reaction: MascotReaction): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(
    new CustomEvent<MascotReaction>(MASCOT_REACTION_EVENT, { detail: reaction }),
  );
}
