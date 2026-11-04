# Undue

**Know the last day to cancel.**

Undue is a privacy-first subscription tracker for Nigeria and the rest of the
world. Add the services you pay for and Undue tells you the exact last day to
cancel each one before you are charged again — not just when the charge happens.

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
- **Decide what to cut** — a Keep / Unsure / Cut tag per plan, the exact saving
  from cancelling it, and a summary of what your cut list is worth a year.
- **Smart review** — overlapping category warnings, cash due in the next seven
  days, price-move alerts, failed-charge risk, and stale Unsure plans. At the
  reminder, Undue asks “Still using this?” with Keep/Cut buttons; supported
  notifications get one-tap actions.
- **Find everything** — a dedicated `/find` flow walks through Google Play, the
  App Store, email receipts and card statements, with after-each-step quick-add.
  Includes an “I just started a trial” quick-add.
- **Reminders at your time** — choose a local notification time. Supported
  browsers use Notification Triggers to fire while Undue is closed; the in-app
  notifier covers the rest, and `.ics` export is the reliable closed-app fallback.
- **Calendar reminders** — export a single deadline or every future cancel-by
  deadline as an `.ics` file (RFC 5545 with a `VALARM`) that works with Google
  Calendar, Apple Calendar, and Outlook. Importing it is the reliable way to get
  reminders when Undue is closed.
- **Quick entry** — paste a bank alert, SMS, or small CSV and review the plans
  Undue found before adding them.
- **Bank CSV detection** — upload or paste a statement and Undue spots repeats
  (same merchant, same amount, steady cadence) fully on-device before you add
  them.
- **Cancel guides** — searchable notes for 70+ Nigerian and global services,
  including popular AI subscriptions (ChatGPT, Claude, Google AI, GitHub Copilot,
  Cursor, Perplexity, Midjourney and Notion AI), with direct cancellation links,
  a last-verified date, and a report-a-wrong-link action.
- **Undo, not "are you sure"** — deleting a subscription or marking one cancelled
  offers a one-tap undo instead of a blocking dialog.
- **Backups that survive** — JSON backups are versioned (v2), v1 files migrate on
  import, and the import sheet previews counts before you choose merge or replace.
  A gentle nudge reminds you when it has been a while since the last backup.
- **Global currencies** — 16 currencies with locale-aware defaults, and a
  one-tap refresh for all live rates (NGN as the internal anchor). Manual rates
  remain the source of truth when you do not refresh.
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
with JSON export/import in Settings. Bank statement CSVs are parsed and scored in
the browser and never leave this device.

The only network request made by Undue itself is the optional "Refresh live
rates" action, which fetches public NGN exchange rates from `open.er-api.com`
and sends no subscription data. Any link you tap opens the destination you chose
and is its own browser connection. If you prefer, leave FX alone and keep manual
rates. Live rates are provided by open.er-api.com (NGN is not included in
Frankfurter/ECB data); check the provider's terms and attribution before relying
on it commercially.

Undue also asks the browser for persistent storage when available, so local data
is less likely to be evicted. Browsers can still clear it, which is why backups
and the backup nudge exist.

## Stack

- **Next.js 16** (App Router, Turbopack, Cache Components) and **React 19**
- **TypeScript** with strict, non-negotiable compiler options
- **Tailwind CSS v4** (CSS-first `@theme` tokens)
- **Dexie** for local persistence
- **Zod** for runtime validation at every boundary
- **Papa Parse** (MIT) for on-device statement CSV parsing
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
                  find, calendar, guides, insights, settings), plus manifest,
                  icons, open graph, error boundaries, and 404
  components/
    shell/        App shell, bottom nav, brand mark, reminder notifier,
                  Notification Triggers scheduler, storage health
    landing/      Marketing landing page pieces
    charts/       Spend donut, projection bars, lazy insights section
    subscriptions/ Form, sheet, detail sheet, explorer, list, row, summary,
                  backup nudge
    settings/     Preferences and backup import preview
    smart/        Smart review cards and action handlers
    import/       Bank-alert quick entry, bank-statement recurrence detection
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
  data/           catalog.ng.json seed data (unified Nigerian + global catalog)
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
