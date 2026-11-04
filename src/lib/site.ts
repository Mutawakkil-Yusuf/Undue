/**
 * Canonical public URL of the app, without a trailing slash.
 *
 * `next.config.ts` resolves this once at build time (explicit env var, then the
 * Netlify or Vercel production URL) and inlines it as NEXT_PUBLIC_SITE_URL, so
 * the server (metadata, open graph) and the browser (share cards) agree.
 */
export const DEFAULT_SITE_URL = "https://useundue.vercel.app";

export function normalizeSiteUrl(value: string | undefined | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    return url.origin;
  } catch {
    return null;
  }
}

export const SITE_URL: string =
  normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL) ?? DEFAULT_SITE_URL;

/** The host people can read aloud or type, e.g. "undue.netlify.app". */
export const SITE_HOST: string = new URL(SITE_URL).host;

/**
 * Public repository for the landing page's open-source section. Leave null
 * until the code is public AND carries a license; the section stays hidden
 * while this is null. Issues are linked as `${REPOSITORY_URL}/issues`, which
 * matches GitHub.
 */
export const REPOSITORY_URL: string | null = null;
