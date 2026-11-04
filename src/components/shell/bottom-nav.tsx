"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSubscriptionSheet } from "@/components/subscriptions/subscription-sheet";
import {
  CalendarIcon,
  GuidesIcon,
  HomeIcon,
  PlusIcon,
  SettingsIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";
import { vibrate } from "@/lib/utils/haptics";

interface NavItem {
  href: string;
  label: string;
  Icon: typeof HomeIcon;
}

const LEFT_ITEMS: readonly NavItem[] = [
  { href: "/app", label: "Home", Icon: HomeIcon },
  { href: "/calendar", label: "Calendar", Icon: CalendarIcon },
];

const RIGHT_ITEMS: readonly NavItem[] = [
  { href: "/guides", label: "Guides", Icon: GuidesIcon },
  { href: "/settings", label: "Settings", Icon: SettingsIcon },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/app") {
    return pathname === "/app" || pathname === "/insights";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href);
  const Icon = item.Icon;

  return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className="group flex h-14 w-11 items-center justify-center rounded-full min-[360px]:w-14"
    >
      <span
        className={cn(
          "flex size-11 items-center justify-center rounded-full transition-all duration-300 ease-out min-[360px]:size-12",
          active
            ? "scale-100 bg-lime text-ink-fixed shadow-[0_0_0_4px_rgba(189,230,106,0.16)]"
            : "scale-95 text-paper/55 group-hover:bg-paper/10 group-hover:text-paper group-active:scale-90",
        )}
      >
        <Icon width={23} height={23} strokeWidth={active ? 2.2 : 1.8} />
      </span>
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const { openAdd } = useSubscriptionSheet();

  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-nav z-40 px-4 lg:hidden">
      <div className="mx-auto flex h-[72px] max-w-md items-center justify-between rounded-full bg-dark px-2 shadow-float ring-1 ring-paper/10 min-[360px]:h-[74px] min-[360px]:px-2.5">
        {LEFT_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}

        <button
          type="button"
          onClick={() => {
            vibrate(6);
            openAdd();
          }}
          aria-label="Add subscription"
          className="-mt-9 flex size-[56px] shrink-0 items-center justify-center rounded-full bg-coral text-ink-fixed ring-[6px] ring-bone transition-transform duration-200 ease-out active:scale-90 min-[360px]:size-[62px]"
        >
          <PlusIcon width={30} height={30} strokeWidth={2.2} />
        </button>

        {RIGHT_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>
    </nav>
  );
}
