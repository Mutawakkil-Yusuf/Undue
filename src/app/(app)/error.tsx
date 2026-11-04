"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Mascot } from "@/components/brand/mascot";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-6 py-10 text-center">
      <div className="flex size-40 items-center justify-center rounded-full bg-coral">
        <Mascot variant="alarmed" color="var(--color-yellow)" size={112} />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-4xl leading-[0.9] font-extrabold tracking-[-0.06em] text-ink">
          That didn&apos;t load.
        </h1>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted">
          Your subscriptions are stored in this browser, so they should still be here. Try
          again, or check that storage is available in private browsing.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <Button onClick={reset}>Try again</Button>
        <Link
          href="/app"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-line px-5 text-sm font-bold text-ink transition-colors hover:bg-surface"
        >
          Back to deadlines
        </Link>
      </div>
    </div>
  );
}
