# Undue

**Know the last day to cancel.**

Undue is a privacy-first subscription tracker for Nigeria. Add the services you
pay for and Undue tells you the exact last day to cancel each one before you are
charged again — not just when the charge happens.

## Why

Most trackers only show the renewal date. The decision that actually matters is
earlier: _the last day you can still cancel_. Undue counts backwards from each
renewal using a per-service reminder window, then ranks everything by urgency so
the things that need action today rise to the top.

## Privacy

There is no backend. Subscriptions, settings, and exchange rates live in your
browser's IndexedDB via Dexie. Nothing is sent anywhere — there is no server to
send it to, and no account to create. Back your data up (and move it between
devices) with JSON export/import in Settings.

## Stack

- **Next.js 16** (App Router, Turbopack) and **React 19**
- **TypeScript** with strict, non-negotiable compiler options
- **Tailwind CSS v4** (CSS-first `@theme` tokens)
- **Dexie** for local persistence
- **Zod** for runtime validation at every boundary
- **Vitest** for the domain test suite

The domain layer under `src/lib/domain` is pure and framework-free: date math,
billing cycles, urgency, "cancel by" windows, currency conversion, and spend
summaries are all tested without a DOM.

## Getting started

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000.

### Scripts

| Script           | Purpose                    |
| ---------------- | -------------------------- |
| `pnpm dev`       | Start the dev server       |
| `pnpm build`     | Production build           |
| `pnpm start`     | Serve the production build |
| `pnpm lint`      | ESLint                     |
| `pnpm typecheck` | TypeScript, no emit        |
| `pnpm test`      | Run the Vitest suite       |
| `pnpm format`    | Format with Prettier       |

> On memory-constrained machines, prefix typechecking and builds with
> `NODE_OPTIONS=--max-old-space-size=4096`.

## Project layout

```
src/
  app/            Routes: dashboard, guides, settings, manifest, icon
  components/
    shell/        App shell, bottom nav, brand mark
    subscriptions/ Form, sheet, list, row, spend summary
    ui/           Primitives: button, field, sheet, chips, icons
    providers/    Toast and app-data context
  lib/
    domain/       Pure logic + tests (dates, cycles, urgency, spend, currency)
    db/           Dexie client, repositories, backup, live-query hooks
    catalog/      Nigerian service catalog and search
  data/           catalog.ng.json seed data
```

## Timezones

Calendar-date math maps local calendar components to UTC midnight (`civilDate`)
before any arithmetic, so renewals never drift across DST boundaries or land a
day early.

## License

All rights reserved.
