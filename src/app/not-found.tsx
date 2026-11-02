import Link from "next/link";
import { Mascot } from "@/components/brand/mascot";
import { BrandMark, BrandWordmark } from "@/components/shell/brand";
import { ArrowRightIcon } from "@/components/ui/icons";

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-bone px-6 py-12 text-center">
      <Link href="/" className="flex items-center gap-2.5">
        <BrandMark size={34} />
        <BrandWordmark className="text-xl" />
      </Link>

      <div className="relative flex size-56 items-center justify-center rounded-full bg-lavender">
        <Mascot variant="alarmed" color="var(--color-yellow)" size={150} />
        <span className="absolute -top-2 -right-1 rotate-6 rounded-full bg-coral px-3 py-1.5 text-xs font-extrabold text-ink-fixed ring-2 ring-ink-fixed">
          404
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="font-display text-4xl leading-[0.9] font-extrabold tracking-[-0.06em] text-ink sm:text-5xl">
          This page took an undue turn.
        </h1>
        <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted">
          The page you were looking for does not exist or has moved. Your subscriptions
          are safe.
        </p>
      </div>

      <Link
        href="/app"
        className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-ink px-6 text-base font-bold text-bone transition-transform duration-200 active:scale-95"
      >
        Back to deadlines
        <ArrowRightIcon width={18} height={18} />
      </Link>
    </div>
  );
}
