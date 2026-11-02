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
    <footer className="bg-dark text-paper">
      <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <BrandMark size={32} />
              <BrandWordmark className="text-2xl text-paper" />
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-paper/55">
              Pay what&apos;s due. Nothing undue.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-display text-lg font-extrabold tracking-[-0.03em] text-paper">
              By Mutawakkil
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              {SOCIALS.map(({ label, handle, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 rounded-full bg-paper/10 px-3.5 py-2 text-sm text-paper transition-colors hover:bg-paper/15"
                >
                  <Icon width={16} height={16} />
                  <span className="text-paper/50">{label}</span>
                  <span className="font-semibold">@{handle}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-paper/10 pt-6 text-xs text-paper/40 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Undue. Built by Mutawakkil.</span>
          <span>Undue is not affiliated with the services it tracks.</span>
        </div>
      </div>
    </footer>
  );
}
