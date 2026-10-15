"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { TextInput } from "@/components/ui/field";
import { ExternalLinkIcon, GuidesIcon, SearchIcon } from "@/components/ui/icons";
import { searchCatalog } from "@/lib/catalog";
import { getCategory } from "@/lib/domain/schema";

export default function GuidesPage() {
  const [query, setQuery] = useState("");
  const results = useMemo(
    () => searchCatalog(query, query.trim().length === 0 ? 12 : 30),
    [query],
  );

  return (
    <div className="flex flex-col gap-5 pt-4">
      <header className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl text-ink">Cancel guides</h1>
        <p className="text-sm text-muted">
          How to cancel popular Nigerian subscriptions, with the direct link where one
          exists.
        </p>
      </header>

      <div className="relative">
        <SearchIcon
          width={18}
          height={18}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
        />
        <TextInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a service…"
          aria-label="Search services"
          autoComplete="off"
          className="pl-10"
        />
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon={<GuidesIcon width={24} height={24} />}
          title="No match"
          description="We could not find that service. Try another name."
        />
      ) : (
        <ul className="flex flex-col gap-2.5">
          {results.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-col gap-2 rounded-card border border-line bg-surface p-4 shadow-card"
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-10 items-center justify-center rounded-xl border border-line bg-bone text-lg"
                >
                  {entry.emoji}
                </span>
                <div className="flex flex-col">
                  <span className="font-medium text-ink">{entry.name}</span>
                  <span className="text-xs text-muted">
                    {getCategory(entry.category).label}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted">{entry.cancelNote}</p>
              {entry.cancelUrl ? (
                <a
                  href={entry.cancelUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-ember-strong"
                >
                  Open cancellation page
                  <ExternalLinkIcon width={16} height={16} />
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <p className="px-1 text-xs text-muted">
        Guides are reference notes, not legal advice. Always confirm details with the
        provider.
      </p>
    </div>
  );
}
