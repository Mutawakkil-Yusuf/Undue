export type UrgencyLevel = "safe" | "soon" | "urgent" | "today" | "missed" | "past";

export type UrgencyTone = "safe" | "soon" | "urgent" | "muted";

export interface UrgencyPresentation {
  readonly level: UrgencyLevel;
  readonly label: string;
  readonly tone: UrgencyTone;
  readonly description: string;
}

const PRESENTATIONS: Record<UrgencyLevel, UrgencyPresentation> = {
  safe: {
    level: "safe",
    label: "Safe",
    tone: "safe",
    description: "Plenty of time before the last day to cancel.",
  },
  soon: {
    level: "soon",
    label: "Cancel soon",
    tone: "soon",
    description: "The last safe day to cancel is within a week.",
  },
  urgent: {
    level: "urgent",
    label: "Cancel now",
    tone: "urgent",
    description: "The last safe day to cancel is within two days.",
  },
  today: {
    level: "today",
    label: "Cancel today",
    tone: "urgent",
    description: "Today is the last safe day to cancel.",
  },
  missed: {
    level: "missed",
    label: "Window passed",
    tone: "urgent",
    description: "The safe cancel window has passed; the renewal is pending.",
  },
  past: {
    level: "past",
    label: "Renewed",
    tone: "muted",
    description: "The renewal date has passed. Update it or cancel the plan.",
  },
};

export function getUrgencyPresentation(level: UrgencyLevel): UrgencyPresentation {
  return PRESENTATIONS[level];
}

const TONE_TEXT_CLASSES: Record<UrgencyTone, string> = {
  safe: "text-safe",
  soon: "text-soon",
  urgent: "text-urgent",
  muted: "text-muted",
};

const TONE_SURFACE_CLASSES: Record<UrgencyTone, string> = {
  safe: "bg-safe-soft text-safe",
  soon: "bg-soon-soft text-soon",
  urgent: "bg-urgent-soft text-urgent",
  muted: "bg-line/50 text-muted",
};

const TONE_RAIL_CLASSES: Record<UrgencyTone, string> = {
  safe: "bg-safe",
  soon: "bg-soon",
  urgent: "bg-urgent",
  muted: "bg-line-strong",
};

export function urgencyTextClass(tone: UrgencyTone): string {
  return TONE_TEXT_CLASSES[tone];
}

export function urgencySurfaceClass(tone: UrgencyTone): string {
  return TONE_SURFACE_CLASSES[tone];
}

export function urgencyRailClass(tone: UrgencyTone): string {
  return TONE_RAIL_CLASSES[tone];
}

const URGENCY_RANK: Record<UrgencyLevel, number> = {
  missed: 0,
  today: 1,
  urgent: 2,
  soon: 3,
  safe: 4,
  past: 5,
};

export function compareUrgency(a: UrgencyLevel, b: UrgencyLevel): number {
  return URGENCY_RANK[a] - URGENCY_RANK[b];
}
