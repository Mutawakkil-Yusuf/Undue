import Link from "next/link";
import { BrandMark } from "@/components/shell/brand";

export default function NotFound() {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 text-center">
      <BrandMark size={40} />
      <p className="font-display text-5xl text-ink">404</p>
      <h1 className="font-display text-xl text-ink">This page took an undue turn</h1>
      <p className="max-w-xs text-sm text-muted">
        The page you were looking for does not exist or has moved.
      </p>
      <Link
        href="/app"
        className="mt-1 inline-flex min-h-11 items-center justify-center rounded-full bg-ember-strong px-6 text-sm font-medium text-on-ember transition-transform active:scale-95"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
