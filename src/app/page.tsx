import Link from "next/link";
import { AnimatedMascot } from "@/components/brand/animated-mascot";
import { SiteFooter } from "@/components/landing/site-footer";
import { BrandMark, BrandWordmark } from "@/components/shell/brand";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  CloseIcon,
  ShieldIcon,
} from "@/components/ui/icons";
import { ServiceAvatar } from "@/components/ui/service-avatar";
import type { CategoryId } from "@/lib/domain/schema";
import { REPOSITORY_URL } from "@/lib/site";
import { cn } from "@/lib/utils/cn";

const PRIMARY_CTA =
  "inline-flex h-13 items-center justify-center gap-2 rounded-full bg-ink px-6 text-base font-bold text-bone transition-transform duration-200 hover:-translate-y-0.5 active:scale-95";
const SECONDARY_CTA =
  "inline-flex h-13 items-center justify-center rounded-full border-2 border-ink px-6 text-base font-bold text-ink transition-colors hover:bg-ink hover:text-bone";
const EYEBROW = "text-[11px] font-bold tracking-[0.16em] text-coral-ink uppercase";
const H2 =
  "font-display text-4xl leading-[0.9] font-extrabold tracking-[-0.06em] text-ink sm:text-5xl";

/** Sample data for the product preview. Both dates are real app concepts. */
const PREVIEW: readonly {
  category: CategoryId;
  name: string;
  amount: string;
  cancelBy: string;
  renews: string;
  pill: string;
  tone: string;
}[] = [
  {
    category: "streaming",
    name: "Netflix",
    amount: "₦4,400",
    cancelBy: "17 Nov",
    renews: "18 Nov",
    pill: "Today",
    tone: "bg-coral",
  },
  {
    category: "streaming",
    name: "DStv Compact",
    amount: "₦19,000",
    cancelBy: "22 Nov",
    renews: "23 Nov",
    pill: "5 days",
    tone: "bg-yellow",
  },
  {
    category: "music",
    name: "Spotify",
    amount: "₦2,900",
    cancelBy: "4 Dec",
    renews: "5 Dec",
    pill: "17 days",
    tone: "bg-lime",
  },
];

const STEPS = [
  {
    title: "Add a subscription",
    body: "Pick from more than 75 services or add your own. Any amount, monthly or yearly, in naira, dollars or other currencies.",
    tone: "bg-coral",
  },
  {
    title: "Review the suggested deadline",
    body: "Undue counts back from the renewal date using a cancellation window. Each service comes with a suggested window, and you can change it for any subscription.",
    tone: "bg-yellow",
  },
  {
    title: "Get a reminder",
    body: "Add the deadline to your calendar or get a notification on your device. The calendar is the most dependable way to be reminded when the app is closed.",
    tone: "bg-lime",
  },
];

const DOES = [
  "Keeps your subscriptions on your device, in your browser’s storage.",
  "Works offline once you add it to your home screen.",
  "Backs up to a file you control, so you can move to a new phone.",
];

const DOES_NOT = [
  "Ask for an email, a password or an account.",
  "Connect to your bank, your cards or your inbox.",
  "Cancel anything for you or contact the provider.",
  "Know every provider’s rules. The cancel-by date comes from the window you set, so check the provider’s terms for anything important.",
];

const NIGERIAN_SERVICES = [
  "DStv",
  "GOtv",
  "Showmax",
  "Boomplay",
  "Audiomack",
  "MTN Data Auto-Renew",
  "Airtel Data Auto-Renew",
  "Glo Data Auto-Renew",
  "Spectranet",
  "Smile",
];

const INTERNATIONAL_SERVICES = [
  "Netflix",
  "Spotify",
  "YouTube Premium",
  "ChatGPT Plus",
  "Apple iCloud+",
  "Microsoft 365",
];

const FAQS = [
  {
    q: "Is Undue free?",
    a: "Yes. Every feature works without paying. There is no premium tier and no trial that runs out.",
  },
  {
    q: "How is the cancel-by date worked out?",
    a: "Undue counts back from the renewal date by a number of days. Each service has a suggested window, and you can change it for any subscription. Undue does not know each provider’s own cancellation rules, so check the terms for anything important.",
  },
  {
    q: "Do I need to sign up?",
    a: "No. Open it, add your first subscription, and it is already doing its job.",
  },
  {
    q: "Where is my data kept?",
    a: "On your device, inside your browser. It leaves only when you export a backup. The one network request Undue makes is the optional exchange-rate refresh, which does not include your subscriptions.",
  },
  {
    q: "Does it work offline?",
    a: "Yes. Add it to your home screen and it keeps working without a connection. Reminders are created on your device, so for the most dependable alert, add the deadline to your calendar.",
  },
  {
    q: "What if a cancel guide is out of date?",
    a: "Providers change their pages, so guides can go stale. Check the provider’s own page if a step does not match, and let us know using the links below so it can be fixed.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] overflow-x-clip bg-bone">
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
        {/* 1. Hero: the core promise */}
        <section className="mx-auto w-full max-w-6xl px-5 pt-10 pb-16 sm:px-8 sm:pt-16 sm:pb-24">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
            <div className="flex flex-col gap-6">
              <h1 className="font-display text-[length:min(3.3rem,15vw)] leading-[0.86] font-extrabold tracking-[-0.07em] text-balance text-ink sm:text-7xl lg:text-[4.9rem]">
                Know when to{" "}
                <span className="relative inline-block">
                  cancel.
                  <span
                    aria-hidden="true"
                    className="absolute -right-2 -bottom-1 -left-1 -z-10 h-4 -rotate-1 rounded-full bg-coral sm:h-6"
                  />
                </span>{" "}
                <span className="block">Before you’re charged.</span>
              </h1>
              <p className="max-w-lg text-base leading-relaxed text-muted sm:text-lg">
                Undue helps you track the last day to cancel your subscriptions, so you
                have time to act before they renew. No account, no bank connection. Your
                data stays on your device.
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
              <p className="text-xs font-semibold text-muted">
                Free · Private by design · Works offline
              </p>
            </div>

            <CancelByCard />
          </div>
        </section>

        {/* 2. The problem */}
        <section className="border-y border-line bg-cream-deep">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-16">
            <div className="flex flex-col gap-5">
              <span className="inline-flex size-14 items-center justify-center rounded-full bg-coral text-ink-fixed ring-2 ring-ink-fixed">
                <ClockIcon width={26} height={26} />
              </span>
              <h2 className={H2}>
                A renewal reminder tells you when the charge happens.
              </h2>
              <p className="text-base leading-relaxed text-muted sm:text-lg">
                Undue reminds you while there’s still time to cancel. The renewal date and
                the cancel-by date are two different days, and Undue keeps both in view.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1 rounded-[1.75rem] bg-surface p-5 shadow-card">
                <span className="text-[11px] font-bold tracking-[0.14em] text-muted uppercase">
                  A reminder set for the renewal date
                </span>
                <span className="font-display text-2xl font-extrabold tracking-[-0.04em] text-ink">
                  Arrives 18 November
                </span>
                <span className="text-sm text-muted">
                  The charge is already going through.
                </span>
              </div>
              <div className="flex flex-col gap-1 rounded-[1.75rem] bg-coral p-5 text-ink-fixed shadow-card">
                <span className="text-[11px] font-bold tracking-[0.14em] uppercase opacity-70">
                  Undue
                </span>
                <span className="font-display text-2xl font-extrabold tracking-[-0.04em]">
                  Arrives 17 November
                </span>
                <span className="text-sm font-semibold opacity-80">
                  You can still cancel.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. The product */}
        <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
            <div className="flex flex-col gap-4">
              <span className={EYEBROW}>The product</span>
              <h2 className={H2}>Both dates, side by side.</h2>
              <p className="text-base leading-relaxed text-muted sm:text-lg">
                Every subscription shows when it renews and the last day to cancel. The
                list is ordered by what needs action first, so the urgent ones sit at the
                top and the rest stay out of the way.
              </p>
            </div>
            <ProductPreview />
          </div>
        </section>

        {/* 4. Three steps */}
        <section id="how" className="border-y border-line bg-surface/60">
          <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
            <div className="flex flex-col gap-3">
              <span className={EYEBROW}>How it works</span>
              <h2 className={cn(H2, "max-w-xl")}>
                Three steps, then it stays out of the way.
              </h2>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
          </div>
        </section>

        {/* 5. Trust */}
        <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-stretch">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-sky p-7 text-ink-fixed sm:p-10">
              <div className="relative z-10 flex flex-col gap-4 sm:max-w-[62%] lg:max-w-none">
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-paper/55 px-3 py-1.5 text-[11px] font-extrabold tracking-[0.14em] uppercase">
                  <ShieldIcon width={14} height={14} />
                  Private by design
                </span>
                <h2 className="font-display text-[2.4rem] leading-[0.9] font-extrabold tracking-[-0.06em] text-balance sm:text-5xl">
                  Why you can trust it with your list.
                </h2>
                <p className="text-sm leading-relaxed font-medium text-ink-fixed/70">
                  Your subscriptions live in your browser, on your device. There is
                  nothing for us to collect, sell or lose.
                </p>
              </div>
              <AnimatedMascot
                variant="wink"
                color="var(--color-paper)"
                size={170}
                className="pointer-events-none absolute -right-4 -bottom-5 hidden animate-float sm:right-2 sm:block lg:hidden"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TrustList title="What Undue does" items={DOES} positive />
              <TrustList title="What Undue does not do" items={DOES_NOT} />
            </div>
          </div>
          <p className="mt-5 max-w-3xl text-xs leading-relaxed text-muted">
            The one network request Undue makes is the optional exchange-rate refresh, and
            it does not include your subscriptions. Reminders are created on your device,
            so for the most dependable alert when the app is closed, add the deadline to
            your calendar.
          </p>
        </section>

        {/* 6. Coverage */}
        <section className="border-y border-line bg-cream-deep">
          <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
            <div className="flex flex-col gap-3">
              <span className={EYEBROW}>Coverage</span>
              <h2 className={cn(H2, "max-w-2xl")}>
                Built with Nigerian subscriptions in mind.
              </h2>
              <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
                More than 75 services are ready to pick, with cancel steps and a direct
                link where one exists. Can’t find yours? Add a custom subscription in
                seconds.
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-6">
              <ServiceChips label="Nigerian services" items={NIGERIAN_SERVICES} />
              <ServiceChips
                label="And popular international ones"
                items={INTERNATIONAL_SERVICES}
              />
            </div>
            <p className="mt-6 max-w-2xl text-xs leading-relaxed text-muted">
              Cancel guides can go out of date when providers change their pages. If a
              step does not match what you see, check the provider and let us know.
            </p>
          </div>
        </section>

        {/* 7. Open source (shown once a public repository is configured) */}
        {REPOSITORY_URL ? (
          <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
            <div className="flex flex-col gap-5 rounded-[2.5rem] bg-surface p-7 shadow-card sm:p-10 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex max-w-xl flex-col gap-3">
                <span className={EYEBROW}>Open source</span>
                <h2 className={H2}>Check the work.</h2>
                <p className="text-base leading-relaxed text-muted">
                  Read the code to see exactly how cancel-by dates are calculated and what
                  stays on your device. Found outdated cancel guidance or a missing
                  service? Report it so it can be fixed.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href={REPOSITORY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={PRIMARY_CTA}
                >
                  View the code
                  <ArrowUpRightIcon width={18} height={18} />
                </a>
                <a
                  href={`${REPOSITORY_URL}/issues`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={SECONDARY_CTA}
                >
                  Report outdated guidance
                </a>
              </div>
            </div>
          </section>
        ) : null}

        {/* FAQ */}
        <section className="border-y border-line bg-surface/60">
          <div className="mx-auto w-full max-w-4xl px-5 py-16 sm:px-8 sm:py-24">
            <h2 className={H2}>Questions people ask</h2>
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

        {/* 8. One closing call to action */}
        <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-coral px-7 py-12 text-center text-ink-fixed sm:px-10 sm:py-16">
            <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-5">
              <h2 className="font-display text-4xl leading-[0.88] font-extrabold tracking-[-0.06em] text-balance sm:text-6xl">
                Find out before the charge, not after.
              </h2>
              <Link
                href="/app"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-ink px-7 text-base font-bold text-bone transition-transform duration-200 hover:-translate-y-0.5 active:scale-95"
              >
                Add your first subscription
                <ArrowRightIcon width={19} height={19} />
              </Link>
              <p className="text-xs font-semibold text-ink-fixed/70">
                Free, no account, and it works offline.
              </p>
            </div>
            <AnimatedMascot
              variant="happy"
              color="var(--color-lime)"
              size={170}
              className="pointer-events-none absolute -bottom-6 -left-6 hidden opacity-90 sm:left-4 sm:block"
            />
            <AnimatedMascot
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

/** Hero visual: one subscription with its renewal date and cancel-by date. */
function CancelByCard() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div className="rounded-[2.5rem] bg-dark p-5 text-paper shadow-float sm:p-7">
        <div className="flex items-center gap-3">
          <ServiceAvatar category="streaming" size="md" />
          <div className="flex min-w-0 flex-col">
            <span className="font-display text-2xl leading-none font-extrabold tracking-[-0.04em]">
              Netflix
            </span>
            <span className="text-xs font-semibold text-paper/55">₦4,400 a month</span>
          </div>
        </div>

        <dl className="mt-5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-3 rounded-[1.4rem] bg-paper/10 px-4 py-3.5">
            <dt className="text-xs font-bold tracking-[0.12em] text-paper/60 uppercase">
              Renews
            </dt>
            <dd className="font-display text-xl font-extrabold tracking-[-0.03em]">
              18 November
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-[1.4rem] bg-coral px-4 py-3.5 text-ink-fixed">
            <dt className="text-xs font-bold tracking-[0.12em] uppercase">Cancel by</dt>
            <dd className="font-display text-xl font-extrabold tracking-[-0.03em]">
              17 November
            </dd>
          </div>
        </dl>
        <p className="mt-3.5 text-xs font-medium text-paper/55">
          Based on your cancellation reminder window
        </p>
      </div>

      <span className="absolute -top-4 -right-3 rotate-6 rounded-full bg-lavender px-4 py-2 text-xs font-extrabold text-ink-fixed ring-2 ring-ink-fixed sm:-right-5">
        Example
      </span>
    </div>
  );
}

/** Example list with sample data. Swap for a real screenshot when one is ready. */
function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div className="rounded-[2.5rem] bg-dark p-5 shadow-float sm:p-7">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-[0.16em] text-paper/55 uppercase">
            Your deadlines
          </span>
          <span className="rounded-full bg-paper/10 px-2.5 py-1 text-[11px] font-bold text-paper/60">
            3 plans
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
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-display text-xl leading-none font-extrabold tracking-[-0.04em]">
                  {item.name}
                </span>
                <span className="text-xs font-bold">Cancel by {item.cancelBy}</span>
                <span className="text-[11px] font-semibold text-ink-fixed/65">
                  Renews {item.renews}
                </span>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="rounded-full bg-ink-fixed px-2.5 py-1 text-[11px] font-bold text-paper">
                  {item.pill}
                </span>
                <span className="text-xs font-bold">{item.amount}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-[1.4rem] bg-paper/10 p-3.5">
          <AnimatedMascot variant="happy" color="var(--color-yellow)" size={54} />
          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-[0.12em] text-paper/55 uppercase">
              Undue says
            </span>
            <span className="text-sm font-semibold text-paper">
              Cancel Netflix today. The rest can wait.
            </span>
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-muted">
        Example with sample data. Cancel-by dates come from the window you set for each
        subscription.
      </p>
    </div>
  );
}

function TrustList({
  title,
  items,
  positive = false,
}: {
  title: string;
  items: readonly string[];
  positive?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[2rem] bg-surface p-5 shadow-card">
      <h3 className="font-display text-xl font-extrabold tracking-[-0.04em] text-ink">
        {title}
      </h3>
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-ink-fixed ring-2 ring-ink-fixed/10",
                positive ? "bg-lime" : "bg-coral",
              )}
            >
              {positive ? (
                <CheckIcon width={13} height={13} />
              ) : (
                <CloseIcon width={13} height={13} />
              )}
            </span>
            <span className="text-sm leading-relaxed font-semibold text-ink">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ServiceChips({ label, items }: { label: string; items: readonly string[] }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-bold tracking-[0.12em] text-muted uppercase">
        {label}
      </span>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-full bg-surface px-4 py-2 text-sm font-bold text-ink shadow-card"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
