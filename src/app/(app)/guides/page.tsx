"use client";

import { useMemo, useRef, useState } from "react";
import { GuideSheet } from "@/components/guides/guide-sheet";
import { Mascot } from "@/components/brand/mascot";
import { useToast } from "@/components/providers/toast-provider";
import { useSubscriptionSheet } from "@/components/subscriptions/subscription-sheet";
import { Button } from "@/components/ui/button";
import { CategoryIcon, categoryColor } from "@/components/ui/category-icon";
import { ServiceAvatar } from "@/components/ui/service-avatar";
import {
  ArrowRightIcon,
  BellIcon,
  ChevronRightIcon,
  PlusIcon,
  SearchIcon,
} from "@/components/ui/icons";
import { getCatalog, getCatalogEntry, searchCatalog } from "@/lib/catalog";
import type { CatalogEntry } from "@/lib/catalog/schema";
import { CATEGORIES, getCategory, type CategoryId } from "@/lib/domain/schema";
import {
  useNotificationsEnabled,
  useNotificationsSupported,
} from "@/lib/hooks/use-notifications";
import {
  requestNotificationPermission,
  setNotificationsEnabled,
} from "@/lib/notifications/notifications";
import { cn } from "@/lib/utils/cn";

const POPULAR_IDS = [
  "1password",
  "adobe-cc",
  "netflix",
  "spotify",
  "dstv",
  "canva-pro",
] as const;

const NEW_IDS = new Set(["1password", "canva-pro"]);

const POPULAR = POPULAR_IDS.map((id) => getCatalogEntry(id)).filter(
  (entry): entry is CatalogEntry => entry !== undefined,
);

const ALL = searchCatalog("", 100);

export default function GuidesPage() {
  const { showToast } = useToast();
  const { openAdd } = useSubscriptionSheet();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState<CatalogEntry | null>(null);
  const notificationsEnabled = useNotificationsEnabled();
  const notificationsSupported = useNotificationsSupported();
  const allSectionRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (query.trim().length > 0) {
      return searchCatalog(query, 40);
    }
    if (category !== "all") {
      return ALL.filter((entry) => entry.category === category);
    }
    return showAll ? ALL : [];
  }, [query, category, showAll]);

  const showingResults = query.trim().length > 0 || category !== "all" || showAll;
  const resultTitle =
    query.trim().length > 0
      ? `Results for “${query.trim()}”`
      : category !== "all"
        ? getCategory(category).label
        : "All guides";

  function scrollToAll() {
    setShowAll(true);
    window.setTimeout(() => {
      allSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  }

  async function toggleNotifications() {
    if (!notificationsSupported) {
      showToast("Notifications are not supported on this device.", "danger");
      return;
    }
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      showToast("Daily nudges turned off.");
      return;
    }
    const permission = await requestNotificationPermission();
    if (permission === "granted") {
      setNotificationsEnabled(true);
      showToast("Reminders are on. We'll only ping you when it matters.", "success");
    } else {
      showToast("Notifications are blocked in your browser settings.", "danger");
    }
  }

  return (
    <div className="flex flex-col gap-7 pt-2 lg:gap-9">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-muted">
            {getCatalog().length}+ services, one place
          </span>
          <h1 className="font-display text-[3.2rem] leading-[0.82] font-extrabold tracking-[-0.07em] text-ink sm:text-7xl">
            Guides
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              if (searchOpen) {
                setQuery("");
              }
              setSearchOpen((value) => !value);
            }}
            aria-label="Search guides"
            aria-expanded={searchOpen}
            className="flex size-12 items-center justify-center rounded-full bg-surface text-ink shadow-card transition-colors hover:bg-surface-soft active:scale-95"
          >
            <SearchIcon width={20} height={20} />
          </button>
          <button
            type="button"
            onClick={() => void toggleNotifications()}
            aria-label={
              notificationsEnabled ? "Turn off daily nudges" : "Turn on daily nudges"
            }
            aria-pressed={notificationsEnabled}
            className={cn(
              "relative flex size-12 items-center justify-center rounded-full shadow-card transition-colors active:scale-95",
              notificationsEnabled
                ? "bg-lime text-ink-fixed"
                : "bg-surface text-ink hover:bg-surface-soft",
            )}
          >
            <BellIcon width={20} height={20} />
            {notificationsEnabled ? (
              <span className="absolute top-2 right-2 size-2 rounded-full bg-coral ring-2 ring-lime" />
            ) : null}
          </button>
        </div>
      </header>

      {searchOpen ? (
        <div className="relative -mt-2 animate-rise-in">
          <SearchIcon
            width={19}
            height={19}
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted"
          />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Netflix, DStv, 1Password…"
            aria-label="Search guides"
            className="h-14 w-full rounded-full border-0 bg-surface pr-4 pl-12 text-base font-medium text-ink shadow-card placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-ink"
          />
        </div>
      ) : null}

      {!showingResults ? (
        <section className="relative overflow-hidden rounded-[2rem] bg-coral p-6 text-ink-fixed shadow-card sm:p-8">
          <div className="relative z-10 flex max-w-[62%] flex-col items-start gap-5 sm:max-w-[55%]">
            <h2 className="font-display text-[2.6rem] leading-[0.86] font-extrabold tracking-[-0.065em] text-balance sm:text-5xl">
              60+ ways out, in minutes.
            </h2>
            <button
              type="button"
              onClick={scrollToAll}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-paper px-5 text-sm font-bold text-ink-fixed transition-transform duration-200 hover:gap-3 active:scale-95"
            >
              Browse all
              <ArrowRightIcon width={17} height={17} />
            </button>
          </div>
          <Mascot
            variant="happy"
            color="var(--color-lime)"
            size={170}
            className="pointer-events-none absolute -right-3 bottom-0 animate-float sm:right-8 sm:size-[210px]"
          />
        </section>
      ) : null}

      {!query.trim() ? (
        <section className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-2xl font-extrabold tracking-[-0.04em] text-ink">
              Categories
            </h2>
            <button
              type="button"
              onClick={() => {
                setCategory("all");
                setShowAll(false);
              }}
              className="text-sm font-bold text-muted transition-colors hover:text-ink"
            >
              See all
            </button>
          </div>

          <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-2 sm:grid sm:grid-cols-6 sm:gap-4 lg:grid-cols-8">
            {CATEGORIES.map((option) => {
              const active = category === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setCategory(active ? "all" : option.id);
                    setShowAll(true);
                    window.setTimeout(() => {
                      allSectionRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }, 60);
                  }}
                  className="group flex w-[68px] shrink-0 flex-col items-center gap-2 sm:w-auto"
                >
                  <span
                    className={cn(
                      "flex size-16 items-center justify-center rounded-full ring-2 ring-ink-fixed transition-transform duration-200 group-hover:-translate-y-0.5 group-active:scale-95",
                      active && "ring-4 ring-offset-2 ring-offset-bone",
                    )}
                    style={{ background: categoryColor(option.id) }}
                  >
                    <CategoryIcon
                      category={option.id}
                      width={24}
                      height={24}
                      className="text-ink-fixed"
                    />
                  </span>
                  <span
                    className={cn(
                      "max-w-full truncate text-center text-[11px] font-bold",
                      active ? "text-ink" : "text-muted",
                    )}
                  >
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {!showingResults ? (
        <section className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-2xl font-extrabold tracking-[-0.04em] text-ink">
              Popular
            </h2>
            <button
              type="button"
              onClick={scrollToAll}
              className="text-sm font-bold text-muted transition-colors hover:text-ink"
            >
              See all
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {POPULAR.map((entry, index) => (
              <PopularCard
                key={entry.id}
                entry={entry}
                isNew={NEW_IDS.has(entry.id)}
                delay={index * 40}
                onClick={() => setSelected(entry)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <div ref={allSectionRef} className="scroll-mt-6">
        {showingResults ? (
          <section className="flex animate-rise-in flex-col gap-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-2xl font-extrabold tracking-[-0.04em] text-ink">
                {resultTitle}
              </h2>
              <span className="text-xs font-semibold text-muted">
                {results.length} {results.length === 1 ? "guide" : "guides"}
              </span>
            </div>

            {results.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-[2rem] bg-surface p-8 text-center shadow-card">
                <div className="flex size-20 items-center justify-center rounded-full bg-lime">
                  <Mascot variant="calm" color="var(--color-yellow)" size={58} />
                </div>
                <p className="font-display text-xl font-extrabold tracking-[-0.04em] text-ink">
                  No guide for that one.
                </p>
                <p className="max-w-sm text-sm text-muted">
                  You can still track it by hand. Add the charge date and Undue will count
                  back to the last safe day.
                </p>
                <Button
                  variant="primary"
                  onClick={() => openAdd()}
                  leadingIcon={<PlusIcon width={17} height={17} />}
                >
                  Add it manually
                </Button>
              </div>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {results.map((entry, index) => (
                  <li
                    key={entry.id}
                    className="animate-rise-in"
                    style={{ animationDelay: `${Math.min(index, 8) * 25}ms` }}
                  >
                    <button
                      type="button"
                      onClick={() => setSelected(entry)}
                      className="group flex h-full w-full flex-col gap-3 rounded-[1.75rem] bg-surface p-4 text-left shadow-card transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.99] sm:p-5"
                    >
                      <div className="flex items-center gap-3">
                        <ServiceAvatar category={entry.category} size="md" />
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm font-bold text-ink">
                            {entry.name}
                          </span>
                          <span className="text-[11px] font-semibold text-muted">
                            {getCategory(entry.category).label}
                          </span>
                        </div>
                        <ChevronRightIcon
                          width={18}
                          height={18}
                          className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
                        />
                      </div>
                      <p className="line-clamp-2 text-xs leading-relaxed text-muted">
                        {entry.cancelNote}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </div>

      <p className="px-1 pb-2 text-center text-xs text-muted">
        Guides are reference notes, not legal advice. Always confirm details with the
        provider.
      </p>

      <GuideSheet
        entry={selected}
        onClose={() => setSelected(null)}
        onTrack={(entry) => {
          setSelected(null);
          openAdd(entry);
        }}
      />
    </div>
  );
}

function PopularCard({
  entry,
  isNew,
  delay,
  onClick,
}: {
  entry: CatalogEntry;
  isNew: boolean;
  delay: number;
  onClick: () => void;
}) {
  const accent = categoryColor(entry.category);
  const initial = entry.name.trim().charAt(0).toUpperCase();

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className="group flex animate-rise-in flex-col gap-3 text-left"
    >
      <span
        className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-[2rem] ring-2 ring-ink-fixed transition-transform duration-300 ease-out group-hover:-translate-y-1 group-active:scale-[0.98]"
        style={{ background: accent }}
      >
        <span className="font-display text-[5.5rem] leading-none font-extrabold tracking-[-0.08em] text-ink-fixed/85 sm:text-[6.5rem]">
          {initial}
        </span>
        {isNew ? (
          <span className="absolute top-3 right-3 rounded-full bg-lavender px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-ink-fixed uppercase ring-2 ring-ink-fixed">
            New
          </span>
        ) : null}
      </span>
      <span className="flex flex-col gap-0.5 px-1">
        <span className="truncate text-sm font-bold text-ink">{entry.name}</span>
        <span className="text-[11px] font-semibold text-muted">
          {getCategory(entry.category).label}
        </span>
      </span>
    </button>
  );
}
