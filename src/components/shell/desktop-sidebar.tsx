"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mascot } from "@/components/brand/mascot";
import { BrandLogo } from "@/components/brand/logo";
import { useSubscriptionSheet } from "@/components/subscriptions/subscription-sheet";
import { BrandWordmark } from "@/components/shell/brand";
import {
  CalendarIcon,
  GuidesIcon,
  HomeIcon,
  SearchIcon,
  PlusIcon,
  SettingsIcon,
  ShieldIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: "/app", label: "Deadlines", Icon: HomeIcon },
  { href: "/find", label: "Find", Icon: SearchIcon },
  { href: "/calendar", label: "Calendar", Icon: CalendarIcon },
  { href: "/guides", label: "Guides", Icon: GuidesIcon },
  { href: "/settings", label: "Settings", Icon: SettingsIcon },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/app") {
    return pathname === "/app" || pathname === "/insights";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopSidebar() {
  const pathname = usePathname();
  const { openAdd } = useSubscriptionSheet();

  return (
    <aside className="fixed top-6 bottom-6 left-6 z-40 no-scrollbar hidden w-[252px] flex-col overflow-y-auto rounded-[2.25rem] bg-dark p-5 text-paper lg:flex">
      <Link href="/app" className="flex items-center gap-2.5 px-2">
        <BrandLogo size={36} />
        <BrandWordmark className="text-2xl text-paper" />
      </Link>

      <nav aria-label="Primary" className="mt-9 flex flex-col gap-1.5">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-full px-4 py-3 text-sm font-semibold transition-all duration-200",
                active
                  ? "bg-lime text-ink-fixed"
                  : "text-paper/60 hover:bg-paper/10 hover:text-paper",
              )}
            >
              <Icon width={20} height={20} strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={() => openAdd()}
        className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-full bg-coral px-5 text-sm font-bold text-ink-fixed transition-transform duration-200 active:scale-[0.98]"
      >
        <PlusIcon width={20} height={20} strokeWidth={2.2} />
        Add subscription
      </button>

      <div className="mt-auto flex flex-col gap-3 rounded-[1.5rem] bg-paper/8 p-4">
        <Mascot
          variant="calm"
          color="var(--color-lime)"
          size={64}
          className="animate-float"
        />
        <p className="font-display text-lg leading-[1.05] font-extrabold tracking-[-0.04em] text-paper">
          Nothing leaves this device.
        </p>
        <p className="text-xs leading-relaxed text-paper/55">
          No account, no server. Back up whenever you want.
        </p>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-lime">
          <ShieldIcon width={13} height={13} />
          Private by design
        </span>
      </div>
    </aside>
  );
}
