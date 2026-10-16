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

## Features

- **Cancel-by windows** — a per-subscription reminder window counts back from the
  next charge to the last safe day to cancel, ranked by urgency (safe, soon,
  urgent, today, missed).
- **Dashboard** — monthly and yearly spend, an "Up next" explorer you can search,
  filter by category, and sort (urgency, cost, or name, grouped by urgency), plus
  a collapsed set of cancelled plans with the savings they represent.
- **Spend insights** — a category breakdown donut and a 12-month projection of
  upcoming charges, both rendered on-device and read out as accessible tables.
- **Price hikes** — every price change is recorded, so an increase shows as a chip
  on the row and a price history in the detail sheet.
- **Detail sheet** — cancel window, charge, cycle, next charge, lead time, quick
  actions (advance one cycle, open cancellation page), and one-tap calendar
  export.
- **Calendar reminders** — export a single deadline or every active deadline as
  an `.ics` file (RFC 5545 with a `VALARM`) that works with Google Calendar,
  Apple Calendar, and Outlook.
- **Browser nudges** — an opt-in, on-device notification once a day when a cancel
  window is closing.
- **Cancel guides** — searchable notes for 60+ popular Nigerian services, with
  direct cancellation links where they exist.
- **Undo, not "are you sure"** — deleting a subscription or marking one cancelled
  offers a one-tap undo instead of a blocking dialog.
- **Dark mode** — light, dark, or follow your device, with no flash on load.
- **Your data, portable** — JSON export/import to back up or move between devices.
- **Installable PWA** — add to your home screen; works offline from a cache-first
  service worker.

## Privacy

There is no backend. Subscriptions, settings, and exchange rates live in your
browser's IndexedDB via Dexie. Nothing is sent anywhere — there is no server to
send it to, and no account to create. Calendar files are generated on-device and
notifications are local only. Back your data up (and move it between devices)
with JSON export/import in Settings.

## Stack

- **Next.js 16** (App Router, Turbopack, Cache Components) and **React 19**
- **TypeScript** with strict, non-negotiable compiler options
- **Tailwind CSS v4** (CSS-first `@theme` tokens)
- **Dexie** for local persistence
- **Zod** for runtime validation at every boundary
- **visx** for the headless spend charts
- **Vitest** for the domain test suite (95 tests)

The domain layer under `src/lib/domain` is pure and framework-free: date math,
billing cycles, urgency, "cancel by" windows, currency conversion, spend
summaries, price history, projections, and ICS generation are all tested without
a DOM.

## Getting started

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000.

### Scripts

| Script              | Purpose                    |
| ------------------- | -------------------------- |
| `pnpm dev`          | Start the dev server       |
| `pnpm build`        | Production build           |
| `pnpm start`        | Serve the production build |
| `pnpm lint`         | ESLint                     |
| `pnpm typecheck`    | TypeScript, no emit        |
| `pnpm test`         | Run the Vitest suite       |
| `pnpm format`       | Format with Prettier       |
| `pnpm format:check` | Check formatting           |

> On memory-constrained machines, prefix typechecking and builds with
> `NODE_OPTIONS=--max-old-space-size=4096`.

## Configuration

Copy `.env.example` to `.env.local` and set the public site URL used for absolute
metadata links (open graph images, canonical URLs):

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

On Vercel this falls back to `VERCEL_URL` automatically, so it is only required
for custom domains.

## Deploying

The app is a standard Next.js app and deploys to Vercel with no extra
configuration. It is intentionally **not** a static export, so server rendering
and metadata routes (icons, manifest, open graph) work out of the box.

`vercel.json` adds a small set of security headers and keeps the service worker
(`/sw.js`) uncached so updates ship immediately. Node is pinned to 22.x via
`engines` so Vercel matches CI.

### Vercel dashboard

1. Import the repository at vercel.com/new.
2. Accept the detected settings (framework: Next.js, install: `pnpm install`,
   build: `pnpm build`).
3. Set `NEXT_PUBLIC_SITE_URL` to your production URL — only needed for a custom
   domain; the `VERCEL_URL` fallback covers the default `*.vercel.app` domain.

### Vercel CLI

```bash
pnpm add --global vercel@latest
vercel link
vercel pull --yes --environment=production
vercel build --prod
vercel deploy --prebuilt --prod
```

### Deploy from GitHub Actions (optional)

`.github/workflows/deploy.yml` deploys on demand. Add these repository secrets:

| Secret              | Where to find it                           |
| ------------------- | ------------------------------------------ |
| `VERCEL_TOKEN`      | Vercel → Account Settings → Tokens         |
| `VERCEL_ORG_ID`     | `.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` after `vercel link` |

Then run the **Deploy to Vercel** workflow from the Actions tab; toggle
`production` to target production instead of a preview.

## Project layout

```
src/
  app/            Landing page at /, app routes under (app)/ (dashboard,
                  guides, settings), plus manifest, icons, open graph, 404
  components/
    shell/        App shell, bottom nav, brand mark, reminder notifier
    landing/      Marketing landing page pieces
    charts/       Spend donut, projection bars, lazy insights section
    subscriptions/ Form, sheet, detail sheet, explorer, list, row, summary
    ui/           Primitives: button, field, sheet, switch, chips, icons
    providers/    Theme, toast, and app-data contexts
  lib/
    domain/       Pure logic + tests (dates, cycles, urgency, spend, currency,
                  price history, projections, ICS)
    hooks/        Shared React hooks (today, measured width, notifications)
    db/           Dexie client, repositories, backup, live-query hooks
    catalog/      Nigerian service catalog and search
    notifications/ On-device reminder store
    theme/        Theme resolution and persistence
  data/           catalog.ng.json seed data
```

## Timezones

Calendar-date math maps local calendar components to UTC midnight (`civilDate`)
before any arithmetic, so renewals never drift across DST boundaries or land a
day early.

## License

All rights reserved.
