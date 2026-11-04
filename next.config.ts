import type { NextConfig } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
  (process.env.NETLIFY_URL ? `https://${process.env.NETLIFY_URL}` : undefined) ??
  "https://useundue.vercel.app";

const nextConfig: NextConfig = {
  env: {
    /** Defaults line up with src/lib/site.ts so server and client agree. */
    NEXT_PUBLIC_SITE_URL: siteUrl,
  },
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
