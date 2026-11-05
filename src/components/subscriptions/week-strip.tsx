"use client";

import Link from "next/link";
import { useMemo } from "react";
import { computeCancelWindow } from "@/lib/domain/cancel-by";
import { addDays, civilDate, formatIsoDate, parseIsoDate } from "@/lib/domain/date";
import type { Subscription } from "@/lib/domain/schema";
import type { UrgencyLevel } from "@/lib/domain/urgency";
import { cn } from "@/lib/utils/cn";

const WEEKDAY = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" });

const DOT_CLASSES: Record<UrgencyLevel, string> = {
  today: "bg-coral",
  urgent: "bg-coral",
  missed: "bg-coral",
  soon: "bg-yellow",
  safe: "bg-lime",
  past: "bg-line-strong",
};

interface WeekStripProps {
  subscriptions: readonly Subscription[];
  today: Date;
}

export function WeekStrip({ subscriptions, today }: WeekStripProps) {
  const days = useMemo(() => {
    const start = addDays(civilDate(today), -2);
    return Array.from({ length: 9 }, (_, index) => addDays(start, index));
  }, [today]);

  const deadlineByDay = useMemo(() => {
    const map = new Map<string, UrgencyLevel>();
    for (const subscription of subscriptions) {
      if (subscription.status !== "active") {
        continue;
      }
      const window = computeCancelWindow(subscription, today);
      const key = window.cancelBy;
      const current = map.get(key);
      const rank: Record<UrgencyLevel, number> = {
        missed: 0,
        today: 1,
        urgent: 2,
        soon: 3,
        safe: 4,
        past: 5,
      };
      if (!current || rank[window.urgency] < rank[current]) {
        map.set(key, window.urgency);
      }
    }
    return map;
  }, [subscriptions, today]);

  const todayIsoValue = formatIsoDate(civilDate(today));

  return (
    <div className="-mx-1 no-scrollbar flex gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1">
      {days.map((day) => {
        const iso = formatIsoDate(day);
        const isToday = iso === todayIsoValue;
        const urgency = deadlineByDay.get(iso);
        const date = parseIsoDate(iso);
        const weekday = WEEKDAY.format(date);
        const dayNumber = date.getUTCDate();

        return (
          <Link
            key={iso}
            href={`/calendar?date=${iso}`}
            aria-label={`Open calendar for ${weekday} ${dayNumber}`}
            className={cn(
              "group flex h-[74px] w-[54px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-[1.15rem] transition-all duration-200 sm:w-[62px]",
              isToday
                ? "bg-ink text-bone shadow-card"
                : "bg-surface text-ink shadow-card hover:-translate-y-0.5 hover:bg-surface-soft",
            )}
          >
            <span
              className={cn(
                "text-[11px] font-semibold tracking-wide",
                isToday ? "text-bone/60" : "text-muted",
              )}
            >
              {weekday}
            </span>
            <span className="font-display text-xl leading-none font-extrabold tracking-[-0.04em]">
              {dayNumber}
            </span>
            <span
              className={cn(
                "mt-0.5 size-1.5 rounded-full transition-colors",
                urgency ? DOT_CLASSES[urgency] : isToday ? "bg-coral" : "bg-transparent",
              )}
            />
          </Link>
        );
      })}
    </div>
  );
}
