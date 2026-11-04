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
  urgent, today, missed, past).
- **Billing-day anchors** — a plan billed on the 31st stays anchored to the 31st
  instead of drifting to the 28th after February. Active plans also roll old
  renewal dates forward automatically when you have been away.
- **Dashboard** — monthly and yearly spend, an "Up next" explorer you can search,
  filter by category, and sort (urgency, cost, or name, grouped by urgency), plus
  a collapsed set of cancelled plans with the savings they represent.
- **Spend insights** — a category breakdown donut and a 12-month projection of
  upcoming charges, both rendered on-device and read out as accessible tables.
- **Price hikes** — every price change is recorded, so an increase shows as a chip
  on the row and a price history in the detail sheet.
- **Detail sheet** — cancel window, charge, cycle, next charge, lead time, paid-via
  and last-charge status, quick actions (advance one cycle, open cancellation
  page), trial conversion, and one-tap calendar export.
- **Shared plans** — record your share of a family or split plan; spend totals,
  projections, savings, and share cards use your share instead of the full price.
- **Reminders at your time** — choose a local notification time. Supported
  browsers use Notification Triggers to fire while Undue is closed; the in-app
  notifier covers the rest, and `.ics` export is the reliable closed-app fallback.
- **Calendar reminders** — export a single deadline or every active deadline as
  an `.ics` file (RFC 5545 with a `VALARM`) that works with Google Calendar,
  Apple Calendar, and Outlook.
- **Quick entry** — paste a bank alert, SMS, or small CSV and review the plans
  Undue found before adding them.
- **Cancel guides** — searchable notes for 60+ popular Nigerian services, with
  direct cancellation links, a last-verified date, and a report-a-wrong-link
  action.
- **Undo, not "are you sure"** — deleting a subscription or marking one cancelled
  offers a one-tap undo instead of a blocking dialog.
- **Backups that survive** — JSON backups are versioned (v2), v1 files migrate on
  import, and the import sheet previews counts before you choose merge or replace.
  A gentle nudge reminds you when it has been a while since the last backup.
- **Live exchange rates (optional)** — refresh USD/GBP rates on request and see
  when they were fetched. Manual rates remain the source of truth.
- **Share a deadline** — generate a branded PNG with the Undue URL, then share it
  through the system share sheet or download it.
- **Dark mode** — light, dark, or follow your device, with no flash on load.
- **Installable PWA** — add to your home screen; a network-first service worker
  keeps the app available offline without hiding deployed updates.

## Privacy

There is no backend. Subscriptions, settings, and exchange rates live in your
browser's IndexedDB via Dexie. Nothing is sent anywhere — there is no server to
send it to, and no account to create. Calendar files are generated on-device and
notifications are local only. Back your data up (and move it between devices)
with JSON export/import in Settings.

The optional "Refresh live rates" action sends a request to
`open.er-api.com` for public NGN exchange rates. It never sends subscription data.
If you prefer, leave it alone and keep manual rates.

Undue also asks the browser for persistent storage when available, so local data
is less likely to be evicted. Browsers can still clear it, which is why backups
and the backup nudge exist.

## Stack

- **Next.js 16** (App Router, Turbopack, Cache Components) and **React 19**
- **TypeScript** with strict, non-negotiable compiler options
- **Tailwind CSS v4** (CSS-first `@theme` tokens)
- **Dexie** for local persistence
- **Zod** for runtime validation at every boundary
- **visx** for the headless spend charts
- **Vitest** for domain and component tests, **Playwright** for end-to-end tests

The domain layer under `src/lib/domain` is pure and framework-free: date math,
billing anchors, cycles, urgency, "cancel by" windows, currency conversion,
spend summaries, price history, projections, and ICS generation are all tested
without a DOM.

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
| `pnpm test:e2e`     | Run the Playwright suite   |
| `pnpm format`       | Format with Prettier       |
| `pnpm format:check` | Check formatting           |

> On memory-constrained machines, prefix typechecking and builds with
> `NODE_OPTIONS=--max-old-space-size=4096`.

For browser tests the first time:

```bash
pnpm exec playwright install --with-deps chromium
```

## Configuration

Copy `.env.example` to `.env.local` and set the public site URL used for absolute
metadata links (open graph images and absolute URLs):

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

On Vercel this falls back to `VERCEL_URL`, and on Netlify it falls back to `URL`.
The production fallback is `https://undue.netlify.app`, so the supplied Netlify
deployment gets correct Open Graph previews even without extra configuration.

## Deploying

The app is a standard Next.js app. It is intentionally **not** a static export,
so server rendering and metadata routes (icons, manifest, open graph) work out of
the box.

`vercel.json` adds a small set of security headers and keeps the service worker
(`/sw.js`) uncached so updates ship immediately. Node is pinned to 22.x via
`engines` so CI and deployments match.

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

### Netlify

`netlify.toml` configures the Next.js build, long-lived security headers, and a
no-cache rule for `/sw.js`. Import the repository in Netlify and keep the
detected Next.js runtime; no extra build command is needed.

## Project layout

```
src/
  app/            Landing page at /, app routes under (app)/ (dashboard,
                  calendar, guides, insights, settings), plus manifest, icons,
                  open graph, error boundaries, and 404
  components/
    shell/        App shell, bottom nav, brand mark, reminder notifier,
                  Notification Triggers scheduler, storage health
    landing/      Marketing landing page pieces
    charts/       Spend donut, projection bars, lazy insights section
    subscriptions/ Form, sheet, detail sheet, explorer, list, row, summary,
                  backup nudge
    settings/     Preferences and backup import preview
    import/       Bank-alert and CSV quick entry
    brand/        Logo and mascot
    ui/           Primitives: button, field, sheet, switch, chips, icons
    providers/    Theme, toast, and app-data contexts
  lib/
    domain/       Pure logic + tests (dates, billing anchors, cycles, urgency,
                  spend, currency, FX, price history, projections, ICS)
    hooks/        Shared React hooks (today, measured width, notifications)
    db/           Dexie client, repositories, backup/migration, live queries
    catalog/      Nigerian service catalog, freshness metadata, search
    notifications/ On-device reminder store and trigger helpers
    import/       Bank-alert and CSV parsing
    share/        Canvas share-card generation
    storage/      Persistent-storage request
    theme/        Theme resolution and persistence
  data/           catalog.ng.json seed data
e2e/              Playwright smoke tests
```

## Timezones and month ends

Calendar-date math maps local calendar components to UTC midnight (`civilDate`)
before any arithmetic, so renewals never drift across DST boundaries or land a
day early. Monthly and yearly cycles carry a separate `billingDay` anchor, so a
plan billed on the 31st goes Jan 31 → Feb 28 → Mar 31 rather than staying on the
28th.

## License

All rights reserved.
