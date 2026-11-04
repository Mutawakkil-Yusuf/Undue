"use client";

import { useEffect } from "react";

export default function ErrorPage({
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
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-start justify-center gap-5 px-6">
      <h1 className="font-display text-5xl leading-[0.9] font-extrabold tracking-[-0.06em] text-ink">
        Something broke.
      </h1>
      <p className="text-base leading-relaxed text-muted">
        Your subscriptions are safe: they are stored on this device and nothing was
        deleted. Try again, and if it keeps happening, reload the page.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="min-h-12 rounded-full bg-lime px-6 text-sm font-bold text-ink-fixed"
        >
          Try again
        </button>
        <a
          href="/app"
          className="inline-flex min-h-12 items-center rounded-full border-2 border-ink px-6 text-sm font-bold text-ink"
        >
          Go to my deadlines
        </a>
      </div>
    </main>
  );
}
