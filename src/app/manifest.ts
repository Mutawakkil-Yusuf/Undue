import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Undue: know when to cancel, before you’re charged",
    short_name: "Undue",
    description:
      "Track the last day to cancel each subscription so you can act before it renews. No account, no bank connection.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "en",
    dir: "ltr",
    categories: ["finance", "productivity", "utilities"],
    background_color: "#f8f0e5",
    theme_color: "#f8f0e5",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
