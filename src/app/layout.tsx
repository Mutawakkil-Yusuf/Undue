import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.URL
      ? process.env.URL
      : process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : "https://undue.netlify.app");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Undue",
  title: {
    default: "Undue: know the last day to cancel",
    template: "%s · Undue",
  },
  description:
    "Track every subscription and see the exact last day to cancel before you are charged. Private by design: nothing leaves your device.",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Undue",
    title: "Undue: know the last day to cancel",
    description:
      "Track every subscription and see the exact last day to cancel before you are charged. Private by design.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Undue: know the last day to cancel",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Undue: know the last day to cancel",
    description:
      "Track every subscription and see the exact last day to cancel before you are charged.",
    images: ["/opengraph-image"],
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
