import Link from "next/link";
import { Mascot } from "@/components/brand/mascot";
import { BrandMark, BrandWordmark } from "@/components/shell/brand";
import { SiteFooter } from "@/components/landing/site-footer";
import {
  AlertIcon,
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  DownloadIcon,
  GuidesIcon,
  ShieldIcon,
  SparkIcon,
} from "@/components/ui/icons";
import { ServiceAvatar } from "@/components/ui/service-avatar";
import type { CategoryId } from "@/lib/domain/schema";
import { cn } from "@/lib/utils/cn";

const PRIMARY_CTA =
  "inline-flex h-13 items-center justify-center gap-2 rounded-full bg-ink px-6 text-base font-bold text-bone transition-transform duration-200 hover:-translate-y-0.5 active:scale-95";
const SECONDARY_CTA =
  "inline-flex h-13 items-center justify-center rounded-full border-2 border-ink px-6 text-base font-bold text-ink transition-colors hover:bg-ink hover:text-bone";

const PREVIEW = [
  {
    category: "streaming" as CategoryId,
    name: "Netflix",
    amount: "₦4,400",
    meta: "Last day today",
    tone: "bg-coral",
    pill: "Today",
  },
  {
    category: "streaming" as CategoryId,
    name: "DStv Compact",
    amount: "₦19,000",
    meta: "Charges 6 Nov",
    tone: "bg-yellow",
    pill: "5 days",
  },
  {
    category: "music" as CategoryId,
    name: "Spotify",
    amount: "₦2,900",
    meta: "Charges 18 Nov",
    tone: "bg-lime",
    pill: "17 days",
  },
];

const STEPS = [
  {
    title: "Add what you pay for",
    body: "Pick from 70+ Nigerian and global services or add your own. Naira, dollars and more, monthly or yearly, whatever you are actually paying.",
    tone: "bg-coral",
  },
  {
    title: "See your last safe day",
    body: "Undue counts back from every charge using a window you set, then ranks the list so the urgent ones sit at the top.",
    tone: "bg-yellow",
  },
  {
    title: "Act before it is due",
    body: "Send the deadline to your calendar, or get a notification on the day the window closes. Then cancel with time to spare.",
    tone: "bg-lime",
  },
];

const FEATURES = [
  {
    Icon: ClockIcon,
    title: "Cancel-by dates",
    body: "Every subscription gets the last day to cancel, not just the renewal date.",
    tone: "bg-coral",
  },
  {
    Icon: SparkIcon,
    title: "Totals in naira",
    body: "See what you spend each month, with USD and GBP converted at rates you set yourself.",
    tone: "bg-yellow",
  },
  {
    Icon: CalendarIcon,
    title: "Calendars that work",
    body: "Export any deadline as an .ics file for Google, Apple, or Outlook in a single tap.",
    tone: "bg-sky",
  },
  {
    Icon: AlertIcon,
    title: "Nudges on device",
    body: "A quiet notification on the day a window closes. No email, no account, no spam.",
    tone: "bg-lavender",
  },
  {
    Icon: GuidesIcon,
    title: "Cancel guides",
    body: "Plain steps for 70+ Nigerian and global services, with the direct link where one exists.",
    tone: "bg-lime",
  },
  {
    Icon: DownloadIcon,
    title: "Yours to keep",
    body: "Back everything up to a JSON file and move it to a new phone in seconds.",
    tone: "bg-coral",
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
    a: "Over 70 common Nigerian and international subscriptions, including popular AI plans, and you can add anything else by hand.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-bone">
      <header className="sticky top-0 z-30 border-b border-line bg-bone/85 pt-safe backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark size={32} />
            <BrandWordmark className="text-xl" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full bg-surface px-3 py-1.5 text-[11px] font-bold tracking-wide text-muted uppercase sm:inline-flex">
              No account
            </span>
            <Link
              href="/app"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-ink px-4 text-sm font-bold text-bone transition-transform duration-200 active:scale-95"
            >
              Open app
              <ArrowRightIcon width={16} height={16} />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto w-full max-w-6xl px-5 pt-10 pb-16 sm:px-8 sm:pt-16 sm:pb-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div className="flex flex-col gap-6">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-lime px-3.5 py-1.5 text-xs font-bold text-ink-fixed">
                <ShieldIcon width={14} height={14} />
                Private by design
              </span>
              <h1 className="max-w-[12ch] font-display text-[clamp(2.9rem,14vw,3.6rem)] leading-[0.84] font-extrabold tracking-[-0.07em] text-balance text-ink sm:text-7xl lg:text-[5.2rem]">
                Know the last day to{" "}
                <span className="relative inline-block">
                  cancel.
                  <span
                    aria-hidden="true"
                    className="absolute -right-2 -bottom-1 -left-1 -z-10 h-4 -rotate-1 rounded-full bg-coral sm:h-6"
                  />
                </span>
              </h1>
              <p className="max-w-lg text-base leading-relaxed text-muted sm:text-lg">
                Renewal dates tell you when a charge lands. Undue tells you the last day
                you can still cancel, then reminds you with enough time to do something
                about it.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/app" className={PRIMARY_CTA}>
                  Open Undue
                  <ArrowRightIcon width={18} height={18} />
                </Link>
                <a href="#how" className={SECONDARY_CTA}>
                  See how it works
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <CheckIcon width={14} height={14} className="text-safe" />
                  70+ services
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckIcon width={14} height={14} className="text-safe" />
                  No sign up
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckIcon width={14} height={14} className="text-safe" />
                  Works offline
                </span>
              </div>
            </div>

            <PreviewStack />
          </div>
        </section>

        <section className="border-y border-line bg-cream-deep">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
            <div className="relative">
              <h2 className="font-display text-4xl leading-[0.9] font-extrabold tracking-[-0.06em] text-ink sm:text-5xl">
                The renewal date is not the deadline.
              </h2>
              <span className="mt-5 inline-flex size-14 items-center justify-center rounded-full bg-coral text-ink-fixed ring-2 ring-ink-fixed">
                <ClockIcon width={26} height={26} />
              </span>
            </div>
            <div className="flex flex-col gap-4 text-base leading-relaxed text-muted sm:text-lg">
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
          className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24"
        >
          <div className="flex flex-col gap-3">
            <span className="text-[11px] font-bold tracking-[0.16em] text-coral uppercase">
              How it works
            </span>
            <h2 className="max-w-xl font-display text-4xl leading-[0.9] font-extrabold tracking-[-0.06em] text-ink sm:text-5xl">
              Three steps, then it stays out of the way.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <div
                key={step.title}
                className="flex flex-col gap-4 rounded-[2rem] bg-surface p-6 shadow-card"
              >
                <span
                  className={cn(
                    "flex size-12 items-center justify-center rounded-full font-display text-xl font-extrabold text-ink-fixed ring-2 ring-ink-fixed",
                    step.tone,
                  )}
                >
                  {index + 1}
                </span>
                <h3 className="font-display text-2xl leading-none font-extrabold tracking-[-0.04em] text-ink">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-line bg-surface/60">
          <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-bold tracking-[0.16em] text-coral uppercase">
                Everything in one place
              </span>
              <h2 className="max-w-2xl font-display text-4xl leading-[0.9] font-extrabold tracking-[-0.06em] text-ink sm:text-5xl">
                Everything you need, nothing you don&apos;t.
              </h2>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ Icon, title, body, tone }) => (
                <div
                  key={title}
                  className="flex flex-col gap-4 rounded-[2rem] bg-surface p-6 shadow-card"
                >
                  <span
                    className={cn(
                      "flex size-12 items-center justify-center rounded-2xl text-ink-fixed ring-2 ring-ink-fixed/10",
                      tone,
                    )}
                  >
                    <Icon width={22} height={22} />
                  </span>
                  <h3 className="font-display text-xl font-extrabold tracking-[-0.04em] text-ink">
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-sky p-7 text-ink-fixed sm:p-10">
              <div className="relative z-10 flex flex-col gap-4 sm:max-w-[62%]">
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-paper/55 px-3 py-1.5 text-[10px] font-extrabold tracking-[0.14em] uppercase">
                  <ShieldIcon width={14} height={14} />
                  Private by design
                </span>
                <h2 className="font-display text-[clamp(2.2rem,10vw,2.6rem)] leading-[0.88] font-extrabold tracking-[-0.06em] text-balance sm:text-5xl">
                  No account. No server. No surprises.
                </h2>
                <p className="text-sm leading-relaxed font-medium text-ink-fixed/70">
                  Your subscriptions live in your browser, on your device. There is
                  nothing for us to collect, sell, or lose.
                </p>
              </div>
              <Mascot
                variant="wink"
                color="var(--color-paper)"
                size={190}
                className="pointer-events-none absolute -right-4 -bottom-5 hidden animate-float sm:right-2 sm:block"
              />
            </div>
            <ul className="flex flex-col justify-center gap-3">
              {PRIVACY_POINTS.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 rounded-[1.5rem] bg-surface p-5 shadow-card"
                >
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-lime text-ink-fixed ring-2 ring-ink-fixed/10">
                    <CheckIcon width={15} height={15} />
                  </span>
                  <span className="text-sm leading-relaxed font-semibold text-ink">
                    {point}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-line bg-surface/60">
          <div className="mx-auto w-full max-w-4xl px-5 py-16 sm:px-8 sm:py-24">
            <h2 className="font-display text-4xl leading-[0.9] font-extrabold tracking-[-0.06em] text-ink sm:text-5xl">
              Questions people ask
            </h2>
            <div className="mt-8 flex flex-col gap-2">
              {FAQS.map(({ q, a }) => (
                <details
                  key={q}
                  className="group rounded-[1.5rem] bg-surface px-5 shadow-card"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-base font-bold text-ink [&::-webkit-details-marker]:hidden">
                    {q}
                    <ChevronRightIcon
                      width={18}
                      height={18}
                      className="shrink-0 text-muted transition-transform group-open:rotate-90"
                    />
                  </summary>
                  <p className="pb-5 text-sm leading-relaxed text-muted">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-coral px-7 py-12 text-center text-ink-fixed sm:px-10 sm:py-16">
            <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-5">
              <h2 className="font-display text-4xl leading-[0.88] font-extrabold tracking-[-0.06em] text-balance sm:text-6xl">
                Stop paying for the things you meant to cancel.
              </h2>
              <Link
                href="/app"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-ink px-7 text-base font-bold text-bone transition-transform duration-200 hover:-translate-y-0.5 active:scale-95"
              >
                Open Undue
                <ArrowRightIcon width={19} height={19} />
              </Link>
              <p className="text-xs font-semibold text-ink-fixed/65">
                Free, no account, and it works offline.
              </p>
            </div>
            <Mascot
              variant="happy"
              color="var(--color-lime)"
              size={170}
              className="pointer-events-none absolute -bottom-6 -left-6 hidden opacity-90 sm:left-4 sm:block"
            />
            <Mascot
              variant="wink"
              color="var(--color-yellow)"
              size={140}
              className="pointer-events-none absolute -top-6 -right-4 hidden opacity-90 sm:right-6 sm:block"
            />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function PreviewStack() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div className="relative rounded-[2.5rem] bg-dark p-5 shadow-float sm:p-7">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-[0.16em] text-paper/45 uppercase">
            Your week
          </span>
          <span className="rounded-full bg-paper/10 px-2.5 py-1 text-[10px] font-bold text-paper/60">
            3 deadlines
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-2.5">
          {PREVIEW.map((item) => (
            <div
              key={item.name}
              className={cn(
                "flex items-center gap-3 rounded-[1.4rem] p-4 text-ink-fixed",
                item.tone,
              )}
            >
              <ServiceAvatar category={item.category} size="sm" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-display text-xl leading-none font-extrabold tracking-[-0.04em]">
                  {item.name}
                </span>
                <span className="text-[11px] font-semibold text-ink-fixed/60">
                  {item.meta}
                </span>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="rounded-full bg-ink-fixed px-2.5 py-1 text-[10px] font-bold text-paper">
                  {item.pill}
                </span>
                <span className="text-xs font-bold">{item.amount}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-[1.4rem] bg-paper/10 p-3.5">
          <Mascot variant="happy" color="var(--color-yellow)" size={54} />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-[0.12em] text-paper/40 uppercase">
              Undue says
            </span>
            <span className="text-sm font-semibold text-paper">
              Netflix is today. The rest can wait.
            </span>
          </div>
        </div>
      </div>

      <span className="absolute -top-4 -right-3 rotate-6 rounded-full bg-lavender px-4 py-2 text-xs font-extrabold text-ink-fixed ring-2 ring-ink-fixed sm:-right-5">
        Last day: Fri 30 Oct
      </span>
      <span className="absolute -bottom-4 -left-3 -rotate-3 rounded-full bg-lime px-4 py-2 text-xs font-extrabold text-ink-fixed ring-2 ring-ink-fixed sm:-left-5">
        You saved ₦52,800
      </span>
    </div>
  );
}
