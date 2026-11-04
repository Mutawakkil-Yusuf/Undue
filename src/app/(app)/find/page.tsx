"use client";

import { useState } from "react";
import Link from "next/link";
import { Mascot } from "@/components/brand/mascot";
import { useToast } from "@/components/providers/toast-provider";
import { BankCsvSheet } from "@/components/import/bank-csv-sheet";
import { useSubscriptionSheet } from "@/components/subscriptions/subscription-sheet";
import { Button } from "@/components/ui/button";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ExternalLinkIcon,
  FinanceIcon,
  MobileIcon,
  PlusIcon,
  SearchIcon,
  ShieldIcon,
  SparkIcon,
} from "@/components/ui/icons";

const SEARCH_QUERY = '"receipt" OR "renewal" OR "trial" OR "subscription"';
const GMAIL_SEARCH_URL =
  "https://mail.google.com/mail/u/0/#search/%22receipt%22%20OR%20%22renewal%22%20OR%20%22trial%22%20OR%20%22subscription%22";
const APPLE_SUBSCRIPTIONS_URL = "https://apps.apple.com/account/subscriptions";
const PLAY_SUBSCRIPTIONS_URL = "https://play.google.com/store/account/subscriptions";

interface SourceCardProps {
  step: number;
  icon: React.ReactNode;
  title: string;
  body: string;
  accent: string;
  children: React.ReactNode;
}

function SourceCard({ step, icon, title, body, accent, children }: SourceCardProps) {
  return (
    <section className="flex flex-col gap-4 rounded-[2rem] bg-surface p-5 shadow-card sm:p-6">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-ink-fixed"
          style={{ background: accent }}
        >
          {icon}
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-[11px] font-bold tracking-[0.13em] text-muted uppercase">
            Step {step}
          </span>
          <h2 className="font-display text-2xl leading-none font-extrabold tracking-[-0.05em] text-ink">
            {title}
          </h2>
          <p className="text-xs leading-relaxed text-muted">{body}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </section>
  );
}

export default function FindPage() {
  const { openAdd, openTrial } = useSubscriptionSheet();
  const { showToast } = useToast();
  const [statementOpen, setStatementOpen] = useState(false);

  async function copySearch() {
    try {
      await navigator.clipboard.writeText(SEARCH_QUERY);
      showToast("Search copied", "success");
    } catch {
      showToast("Couldn't copy; the search is on the button instead.", "danger");
    }
  }

  function addFound() {
    openAdd();
  }

  return (
    <div className="flex flex-col gap-6 pt-2 lg:gap-8">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link
            href="/app"
            aria-label="Back to deadlines"
            className="mb-2 flex size-11 items-center justify-center rounded-full bg-surface text-ink shadow-card transition-colors hover:bg-surface-soft lg:hidden"
          >
            <ArrowLeftIcon width={19} height={19} />
          </Link>
          <span className="text-sm font-medium text-muted">Find what you pay for</span>
          <h1 className="max-w-[12ch] font-display text-[length:min(3.4rem,17vw)] leading-[0.82] font-extrabold tracking-[-0.07em] text-ink sm:text-6xl lg:text-7xl">
            Find everything.
          </h1>
        </div>
        <Mascot
          variant="wink"
          color="var(--color-lavender)"
          size={88}
          className="mt-2 hidden shrink-0 sm:block"
        />
      </header>

      <section className="relative overflow-hidden rounded-[2rem] bg-sky p-6 text-ink-fixed shadow-card sm:p-8">
        <div className="relative z-10 flex max-w-full flex-col items-start gap-4 sm:max-w-[62%]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-paper/55 px-3 py-1.5 text-[11px] font-bold tracking-wide text-ink-fixed uppercase">
            <ShieldIcon width={13} height={13} />
            Undue never sees this
          </span>
          <h2 className="font-display text-[clamp(2rem,9vw,2.4rem)] leading-[0.88] font-extrabold tracking-[-0.06em] text-balance">
            Four places, five minutes.
          </h2>
          <p className="text-sm leading-relaxed font-medium text-ink-fixed/70">
            These links open official pages on your device. Nothing is sent to Undue, and
            no login is ever requested.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="lg"
              leadingIcon={<SparkIcon width={18} height={18} />}
              onClick={openTrial}
            >
              I just started a trial
            </Button>
            <Button
              variant="fixed"
              size="lg"
              leadingIcon={<PlusIcon width={18} height={18} />}
              onClick={() => addFound()}
            >
              Add one I know
            </Button>
          </div>
        </div>
        <Mascot
          variant="happy"
          color="var(--color-paper)"
          size={150}
          className="pointer-events-none absolute -right-2 -bottom-4 hidden animate-float sm:right-6 sm:block"
        />
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SourceCard
          step={1}
          icon={<MobileIcon width={19} height={19} />}
          title="Google Play"
          body="Android apps billed by Google. Scroll the list and spot the ones with a cycle."
          accent="#bde66a"
        >
          <a
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-ink-fixed px-5 text-sm font-bold text-paper transition-transform active:scale-[0.98]"
            href={PLAY_SUBSCRIPTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Play Store
            <ExternalLinkIcon width={16} height={16} />
          </a>
          <Button variant="secondary" size="lg" onClick={addFound}>
            I found one
          </Button>
        </SourceCard>

        <SourceCard
          step={2}
          icon={<MobileIcon width={19} height={19} />}
          title="Apple"
          body="iPhone, iPad and Mac subscriptions billed through your Apple ID."
          accent="#cbb8f7"
        >
          <a
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-ink-fixed px-5 text-sm font-bold text-paper transition-transform active:scale-[0.98]"
            href={APPLE_SUBSCRIPTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Apple subscriptions
            <ExternalLinkIcon width={16} height={16} />
          </a>
          <Button variant="secondary" size="lg" onClick={addFound}>
            I found one
          </Button>
        </SourceCard>

        <SourceCard
          step={3}
          icon={<SearchIcon width={19} height={19} />}
          title="Email receipts"
          body="Receipts and renewal notices are the quickest clue. This opens Gmail with the search pre-filled; no data is sent to Undue."
          accent="#93baf8"
        >
          <a
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-ink-fixed px-5 text-sm font-bold text-paper transition-transform active:scale-[0.98]"
            href={GMAIL_SEARCH_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Search Gmail
            <ExternalLinkIcon width={16} height={16} />
          </a>
          <Button variant="secondary" size="lg" onClick={() => void copySearch()}>
            Copy search
          </Button>
          <Button variant="ghost" size="lg" className="text-muted" onClick={addFound}>
            I found one
          </Button>
        </SourceCard>

        <SourceCard
          step={4}
          icon={<FinanceIcon width={19} height={19} />}
          title="Bank statement"
          body="Spot repeats like the same merchant, same amount, every month — Undue can parse a CSV and flag the patterns."
          accent="#ff6b5a"
        >
          <Button
            variant="primary"
            size="lg"
            leadingIcon={<FinanceIcon width={18} height={18} />}
            onClick={() => setStatementOpen(true)}
          >
            Detect recurring charges
          </Button>
          <Button variant="secondary" size="lg" onClick={addFound}>
            I found one
          </Button>
        </SourceCard>
      </div>

      <p className="flex flex-wrap items-center justify-center gap-2 pb-2 text-center text-xs text-muted">
        Then open any plan and use the Keep / Unsure / Cut tag —
        <Link
          href="/insights"
          className="font-bold text-ink underline decoration-coral/50 underline-offset-2"
        >
          see the true cost
          <ArrowRightIcon width={12} height={12} className="inline" aria-hidden="true" />
        </Link>
      </p>

      <BankCsvSheet open={statementOpen} onClose={() => setStatementOpen(false)} />
    </div>
  );
}
