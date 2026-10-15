import { BrandMark, BrandWordmark } from "@/components/shell/brand";
import { InstagramIcon, XIcon } from "@/components/ui/icons";

const SOCIALS = [
  {
    label: "Instagram",
    handle: "itsmutawakkil",
    href: "https://instagram.com/itsmutawakkil",
    Icon: InstagramIcon,
  },
  {
    label: "X",
    handle: "itsmutawakkil",
    href: "https://x.com/itsmutawakkil",
    Icon: XIcon,
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface/60">
      <div className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-8">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <BrandMark size={28} />
              <BrandWordmark className="text-xl" />
            </div>
            <p className="max-w-xs text-sm text-muted">
              Pay what&apos;s due. Nothing undue.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-display text-lg text-ink">By Mutawakkil</span>
            <div className="flex flex-wrap items-center gap-2.5">
              {SOCIALS.map(({ label, handle, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-sm text-ink transition-colors hover:border-line-strong"
                >
                  <Icon width={16} height={16} />
                  <span className="text-muted">{label}</span>
                  <span className="font-medium">@{handle}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Undue. Built by Mutawakkil.</span>
          <span>Undue is not affiliated with the services it tracks.</span>
        </div>
      </div>
    </footer>
  );
}
