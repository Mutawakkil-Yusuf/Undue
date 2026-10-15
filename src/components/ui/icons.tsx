import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      width={24}
      height={24}
      {...props}
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </Icon>
  );
}

export function GuidesIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5Z" />
      <path d="M4 5.5V20.5" />
      <path d="M9 7h7M9 11h7" />
    </Icon>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
    </Icon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 12.5 9 17l10.5-10.5" />
    </Icon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 5l7 7-7 7" />
    </Icon>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </Icon>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3l7 3v5.5c0 4.6-3 7.9-7 9.5-4-1.6-7-4.9-7-9.5V6Z" />
      <path d="M9.5 12l1.8 1.8 3.4-3.6" />
    </Icon>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4 2.8 20h18.4Z" />
      <path d="M12 10v4.5M12 17.5h.01" />
    </Icon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Icon>
  );
}

export function ExternalLinkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14 4h6v6M20 4l-8.5 8.5" />
      <path d="M18 14.5V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V7.5A1.5 1.5 0 0 1 5 6h4.5" />
    </Icon>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 6.5h15M9 6.5V4h6v2.5M6.5 6.5 7.5 20h9l1-13.5" />
      <path d="M10.5 10v6M13.5 10v6" />
    </Icon>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5v11M7.5 10 12 14.5 16.5 10" />
      <path d="M4.5 19.5h15" />
    </Icon>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 20.5v-11M7.5 14 12 9.5 16.5 14" />
      <path d="M4.5 4.5h15" />
    </Icon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </Icon>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 20h4L19 9l-4-4L4 16Z" />
      <path d="m14 6 4 4" />
    </Icon>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3v4M12 17v4M4.5 12h4M15.5 12h4" />
      <path d="M12 8.5 13 11l2.5 1-2.5 1-1 2.5-1-2.5L8.5 12l2.5-1Z" />
    </Icon>
  );
}

export function StreamingIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="4.5" width="18" height="15" rx="3" />
      <path d="M10 9.2v5.6l4.6-2.8Z" />
    </Icon>
  );
}

export function MusicIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 17V5.5l11-2V15" />
      <circle cx="6.5" cy="17.3" r="2.5" />
      <circle cx="17.5" cy="15.3" r="2.5" />
    </Icon>
  );
}

export function CloudIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 18.5h9.4a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 6.1 11.4 3.7 3.7 0 0 0 7 18.5Z" />
    </Icon>
  );
}

export function SoftwareIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 4.6a2 2 0 0 1 4 0v1.4h2.4A1.6 1.6 0 0 1 18 7.6V10h1.4a2 2 0 0 1 0 4H18v2.4a1.6 1.6 0 0 1-1.6 1.6H14v1.4a2 2 0 0 1-4 0V18H7.6A1.6 1.6 0 0 1 6 16.4V14H4.6a2 2 0 0 1 0-4H6V7.6A1.6 1.6 0 0 1 7.6 6H10Z" />
    </Icon>
  );
}

export function MobileIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 18.5v-2.5M9.5 18.5v-5.5M14 18.5v-8.5M18.5 18.5v-11" />
    </Icon>
  );
}

export function InternetIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.4 2.3 3.7 5.3 3.7 8.5S14.4 18.2 12 20.5C9.6 18.2 8.3 15.2 8.3 12S9.6 5.8 12 3.5Z" />
    </Icon>
  );
}

export function GamingIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8.2 8h7.6a5 5 0 0 1 4.9 5.9l-.5 2.9A2.6 2.6 0 0 1 17.1 19a2.6 2.6 0 0 1-2.2-1.2L14.2 16.9H9.8l-.7.9A2.6 2.6 0 0 1 6.9 19a2.6 2.6 0 0 1-3.1-2.2l-.5-2.9A5 5 0 0 1 8.2 8Z" />
      <path d="M7.6 11.3v2.4M6.4 12.5h2.4M15.4 11.8h.01M17.2 13.6h.01" />
    </Icon>
  );
}

export function FitnessIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 12.5h3.6l1.9-5 3.6 10 2-5H21" />
    </Icon>
  );
}

export function FinanceIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 9.3 12 4l8.5 5.3" />
      <path d="M5.2 10.2v7.3M9.6 10.2v7.3M14.4 10.2v7.3M18.8 10.2v7.3" />
      <path d="M3.8 20.5h16.4" />
    </Icon>
  );
}

export function EducationIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4.8 2.8 9.3 12 13.8l9.2-4.5Z" />
      <path d="M6.8 11.5V16c0 1.3 2.3 2.6 5.2 2.6s5.2-1.3 5.2-2.6v-4.5" />
    </Icon>
  );
}

export function OtherIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.6 20 7.6v8.8L12 20.4 4 16.4V7.6Z" />
      <path d="M4 7.6 12 11.6l8-4M12 11.6v8.8" />
    </Icon>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17" cy="7" r="1.1" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function XIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        fill="currentColor"
        stroke="none"
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117Z"
      />
    </Icon>
  );
}
