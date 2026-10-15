import Link from "next/link";
import { BrandMark, BrandWordmark } from "@/components/shell/brand";
import { SiteFooter } from "@/components/landing/site-footer";
import {
  AlertIcon,
  CalendarIcon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  DownloadIcon,
  GuidesIcon,
  ShieldIcon,
  SparkIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

const PRIMARY_CTA =
  "inline-flex h-12 items-center justify-center rounded-full bg-ember-strong px-6 text-base font-medium text-on-ember transition-colors hover:bg-ember active:bg-ember";
const SECONDARY_CTA =
  "inline-flex h-12 items-center justify-center rounded-full border border-line bg-surface px-6 text-base font-medium text-ink transition-colors hover:border-line-strong";

interface PreviewItem {
  emoji: string;
  name: string;
  cycle: string;
  cancelBy: string;
  window: string;
  tone: "urgent" | "soon" | "safe";
}

const UP_NEXT: readonly PreviewItem[] = [
  {
    emoji: "🎬",
    name: "Netflix",
    cycle: "₦4,400 / month",
    cancelBy: "Fri, 30 Oct",
    window: "Last day today",
    tone: "urgent",
  },
  {
    emoji: "📺",
    name: "DStv Compact",
    cycle: "₦19,000 / month",
    cancelBy: "Tue, 3 Nov",
    window: "5 days left",
    tone: "soon",
  },
  {
    emoji: "🎧",
    name: "Spotify",
    cycle: "₦2,900 / month",
    cancelBy: "Sun, 15 Nov",
    window: "17 days left",
    tone: "safe",
  },
];

const TONE: Record<PreviewItem["tone"], { rail: string; text: string }> = {
  urgent: { rail: "bg-urgent", text: "text-urgent" },
  soon: { rail: "bg-soon", text: "text-soon" },
  safe: { rail: "bg-safe", text: "text-safe" },
};

const STEPS = [
  {
    title: "Add what you pay for",
    body: "Pick from 60+ Nigerian services or add your own. Naira or dollars, monthly or yearly, whatever you are actually paying.",
  },
  {
    title: "See your last safe day",
    body: "Undue counts back from every charge using a window you set, then ranks the list so the urgent ones sit at the top.",
  },
  {
    title: "Act before it is due",
    body: "Send the deadline to your calendar, or get a notification on the day the window closes. Then cancel with time to spare.",
  },
];

const FEATURES = [
  {
    Icon: ClockIcon,
    title: "Cancel by dates",
    body: "Every subscription gets the last day to cancel, not just the renewal date.",
  },
  {
    Icon: SparkIcon,
    title: "Totals in naira",
    body: "See what you spend each month, with USD and GBP converted at rates you set yourself.",
  },
  {
    Icon: CalendarIcon,
    title: "Calendars that work",
    body: "Export any deadline as an .ics file for Google, Apple, or Outlook in a single tap.",
  },
  {
    Icon: AlertIcon,
    title: "Nudges on device",
    body: "A quiet notification on the day a window closes. No email, no account, no spam.",
  },
  {
    Icon: GuidesIcon,
    title: "Cancel guides",
    body: "Plain steps for 60+ Nigerian services, with the direct link where one exists.",
  },
  {
    Icon: DownloadIcon,
    title: "Yours to keep",
    body: "Back everything up to a JSON file and move it to a new phone in seconds.",
  },
];

const PRIVACY_POINTS = [
  "We never ask for an email or a password.",
  "We never connect to your bank or your inbox.",
  "We never send your data anywhere, because there is no server to send it to.",
];

const FAQS = [
  {
    q: "Is Undue free?",
    a: "Yes. Every feature works without paying. There is no premium tier and no trial that runs out.",
  },
  {
    q: "Do I need to sign up?",
    a: "No. Open it, add your first subscription, and it is already doing its job.",
  },
  {
    q: "Where is my data kept?",
    a: "On your device, inside your browser. It only leaves when you choose to export a backup.",
  },
  {
    q: "Does it work offline?",
    a: "Yes. Install it to your home screen and it keeps working without a connection.",
  },
  {
    q: "Which services are covered?",
    a: "Over 60 common Nigerian and international subscriptions, and you can add anything else by hand.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-bone">
      <header className="sticky top-0 z-30 border-b border-line bg-bone/85 pt-safe backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-3 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark size={26} />
            <BrandWordmark className="text-lg" />
          </Link>
          <Link
            href="/app"
            className="inline-flex h-9 items-center justify-center rounded-full bg-ember-strong px-4 text-sm font-medium text-on-ember transition-colors hover:bg-ember"
          >
            Open Undue
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto w-full max-w-5xl px-5 pt-12 pb-16 sm:px-8 sm:pt-20 sm:pb-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="flex flex-col gap-6">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted">
                <ShieldIcon width={14} height={14} />
                No account. Your data stays on your device.
              </span>
              <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
                Know the last day to cancel. Not the day your money leaves.
              </h1>
              <p className="max-w-md text-base text-muted sm:text-lg">
                Renewal dates tell you when a charge lands. Undue tells you the last day
                you can still cancel, then reminds you with enough time to do something
                about it.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/app" className={PRIMARY_CTA}>
                  Open Undue
                </Link>
                <a href="#how" className={SECONDARY_CTA}>
                  See how it works
                </a>
              </div>
              <p className="text-xs text-muted">
                Free. No sign up. Nothing leaves your browser.
              </p>
            </div>

            <div className="lg:pl-6">
              <PreviewCard />
            </div>
          </div>
        </section>

        <section className="border-t border-line bg-surface/50">
          <div className="mx-auto grid w-full max-w-5xl gap-6 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1fr_1.2fr]">
            <h2 className="font-display text-3xl text-ink sm:text-4xl">
              The renewal date is not the deadline.
            </h2>
            <div className="flex flex-col gap-4 text-base text-muted sm:text-lg">
              <p>
                Most trackers fire a reminder on the day the money leaves. By then the
                decision has already been made for you.
              </p>
              <p>
                The date that matters sits earlier: the last day you can cancel and keep
                your money. Undue counts back from every charge, keeps the urgent items on
                top, and leaves the rest alone until they matter.
              </p>
            </div>
          </div>
        </section>

        <section
          id="how"
          className="mx-auto w-full max-w-5xl px-5 py-16 sm:px-8 sm:py-24"
        >
          <h2 className="font-display text-3xl text-ink sm:text-4xl">How it works</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <div
                key={step.title}
                className="flex flex-col gap-3 rounded-card border border-line bg-surface p-6 shadow-card"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-ember-soft font-display text-lg text-ember-strong">
                  {index + 1}
                </span>
                <h3 className="font-display text-xl text-ink">{step.title}</h3>
                <p className="text-sm text-muted">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-line bg-surface/50">
          <div className="mx-auto w-full max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
            <h2 className="font-display text-3xl text-ink sm:text-4xl">
              Everything you need, nothing you don&apos;t.
            </h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ Icon, title, body }) => (
                <div
                  key={title}
                  className="flex flex-col gap-3 rounded-card border border-line bg-surface p-6 shadow-card"
                >
                  <span className="flex size-10 items-center justify-center rounded-full bg-ember-soft text-ember-strong">
                    <Icon width={20} height={20} />
                  </span>
                  <h3 className="font-display text-lg text-ink">{title}</h3>
                  <p className="text-sm text-muted">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-line bg-surface/50">
          <div className="mx-auto grid w-full max-w-5xl gap-8 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div className="flex flex-col gap-4">
              <span className="flex size-11 items-center justify-center rounded-full bg-safe-soft text-safe">
                <ShieldIcon width={22} height={22} />
              </span>
              <h2 className="font-display text-3xl text-ink sm:text-4xl">
                No account. No server. No surprises.
              </h2>
              <p className="text-base text-muted sm:text-lg">
                Undue has no backend. Your subscriptions live in your browser, on your
                device. There is nothing for us to collect, sell, or lose.
              </p>
            </div>
            <ul className="flex flex-col gap-3">
              {PRIVACY_POINTS.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 rounded-card border border-line bg-surface p-4"
                >
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-safe-soft text-safe">
                    <CheckIcon width={15} height={15} />
                  </span>
                  <span className="text-sm text-ink">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
          <h2 className="font-display text-3xl text-ink sm:text-4xl">
            Questions people ask
          </h2>
          <div className="mt-8 flex flex-col divide-y divide-line border-y border-line">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium text-ink [&::-webkit-details-marker]:hidden">
                  {q}
                  <ChevronRightIcon
                    width={18}
                    height={18}
                    className="shrink-0 text-muted transition-transform group-open:rotate-90"
                  />
                </summary>
                <p className="mt-3 text-sm text-muted">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="border-t border-line bg-surface/50">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-5 py-20 text-center sm:px-8">
            <h2 className="max-w-2xl font-display text-3xl text-ink sm:text-4xl">
              Stop paying for the things you meant to cancel.
            </h2>
            <Link href="/app" className={PRIMARY_CTA}>
              Open Undue
            </Link>
            <p className="text-xs text-muted">Free, no account, and it works offline.</p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function PreviewCard() {
  return (
    <div className="rounded-sheet border border-line bg-surface p-5 shadow-card">
      <div className="flex items-baseline justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-medium tracking-wide text-muted uppercase">
            This month
          </span>
          <span className="font-display font-tabular text-3xl text-ink">₦26,300</span>
        </div>
        <span className="text-xs text-muted">3 active</span>
      </div>

      <ul className="mt-5 flex flex-col gap-2.5">
        {UP_NEXT.map((item) => (
          <li
            key={item.name}
            className="flex items-center gap-3 rounded-card border border-line bg-bone/40 px-3 py-2.5"
          >
            <span
              className={cn("h-9 w-1.5 shrink-0 rounded-full", TONE[item.tone].rail)}
            />
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-base"
            >
              {item.emoji}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-ink">{item.name}</span>
              <span className="truncate text-xs text-muted">{item.cycle}</span>
            </span>
            <span className="flex shrink-0 flex-col items-end">
              <span className="font-tabular text-xs font-medium text-ink">
                {item.cancelBy}
              </span>
              <span className={cn("text-[11px] font-medium", TONE[item.tone].text)}>
                {item.window}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-center text-[11px] text-muted">
        Example data. Your list stays on your device.
      </p>
    </div>
  );
}
