"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GuidesIcon, HomeIcon, SettingsIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

interface NavItem {
  href: string;
  label: string;
  Icon: typeof HomeIcon;
}

const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/guides", label: "Guides", Icon: GuidesIcon },
  { href: "/settings", label: "Settings", Icon: SettingsIcon },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-safe backdrop-blur"
    >
      <div className="mx-auto grid max-w-lg grid-cols-3">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                active ? "text-ember-strong" : "text-muted hover:text-ink",
              )}
            >
              <Icon width={22} height={22} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
