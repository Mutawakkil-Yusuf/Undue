import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "Undue",
  title: {
    default: "Undue: know when to cancel, before you’re charged",
    template: "%s · Undue",
  },
  description:
    "Undue tracks the last day to cancel each subscription so you can act before it renews. No account, no bank connection. Your data stays on your device.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Undue",
    locale: "en_NG",
    title: "Undue: know when to cancel, before you’re charged",
    description:
      "Track the last day to cancel each subscription so you can act before it renews. No account, no bank connection.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Undue: know when to cancel, before you’re charged",
    description:
      "Track the last day to cancel each subscription so you can act before it renews.",
  },
  appleWebApp: {
    capable: true,
    title: "Undue",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f0e5" },
    { media: "(prefers-color-scheme: dark)", color: "#121110" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const themeScript = `(function(){try{var t=localStorage.getItem("undue-theme");var d=t==="dark"||((!t||t==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);var e=document.documentElement;e.classList.toggle("dark",d);e.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${dmSans.variable} h-full antialiased motion-safe:scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
