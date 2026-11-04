import { createElement } from "react";
import { LogoMark } from "@/components/brand/logo-mark";
import { Mascot, type MascotVariant } from "@/components/brand/mascot";
import { SITE_HOST } from "@/lib/site";
import type { ShareCardSpec, ShareTone } from "./card-spec";

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;

const INK = "#191713";
const PAPER = "#fffdf9";
const DARK = "#171614";
const LIME = "#bde66a";

const TONE_HEX: Record<ShareTone, string> = {
  coral: "#ff6b5a",
  yellow: "#f7bd3f",
  lime: LIME,
  cream: "#efe2d3",
};

/** The mascot is an SVG that uses CSS variables, which do not resolve inside an <img>. */
const CSS_VAR_HEX: Record<string, string> = {
  "--color-paper": PAPER,
  "--color-coral": "#ff6b5a",
  "--color-yellow": "#f7bd3f",
  "--color-lime": LIME,
  "--color-sky": "#93baf8",
  "--color-lavender": "#cbb8f7",
};

const MARGIN = 72;
const SANS_FALLBACK = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

interface Fonts {
  readonly display: string;
  readonly body: string;
}

function resolveFonts(): Fonts {
  const style = getComputedStyle(document.documentElement);
  const display = style.getPropertyValue("--font-bricolage").trim();
  const body = style.getPropertyValue("--font-dm-sans").trim();
  return {
    display: display ? `${display}, ${SANS_FALLBACK}` : SANS_FALLBACK,
    body: body ? `${body}, ${SANS_FALLBACK}` : SANS_FALLBACK,
  };
}

async function ensureFonts(fonts: Fonts): Promise<void> {
  if (!("fonts" in document)) {
    return;
  }
  try {
    await Promise.all([
      document.fonts.load(`800 64px ${fonts.display}`),
      document.fonts.load(`700 32px ${fonts.body}`),
      document.fonts.load(`600 32px ${fonts.body}`),
    ]);
  } catch {
    // Fall back to whatever is available; the card is still readable.
  }
}

async function loadMascot(
  variant: MascotVariant,
  color: string,
  size: number,
  pad = 0,
): Promise<HTMLImageElement> {
  const { renderToStaticMarkup } = await import("react-dom/server");
  let markup = renderToStaticMarkup(createElement(Mascot, { variant, color, size }));
  if (pad > 0) {
    // Inside an <img> the SVG is clipped to its viewBox, so the party hat and
    // antennae need breathing room that the on-screen mascot gets via overflow.
    markup = markup.replace(
      'viewBox="0 0 140 140"',
      `viewBox="${-pad} ${-pad} ${140 + pad * 2} ${140 + pad * 2}"`,
    );
  }
  markup = markup.replace(/var\((--[a-z-]+)\)/g, (match, name: string) => {
    return CSS_VAR_HEX[name] ?? match;
  });
  const image = new Image();
  image.decoding = "async";
  const loaded = new Promise<HTMLImageElement>((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not draw the mascot."));
  });
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  return loaded;
}

/** The Undue logo as an image, for the card header. */
async function loadLogo(size: number): Promise<HTMLImageElement> {
  const { renderToStaticMarkup } = await import("react-dom/server");
  const markup = renderToStaticMarkup(createElement(LogoMark, { size }));
  const image = new Image();
  image.decoding = "async";
  const loaded = new Promise<HTMLImageElement>((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not draw the logo."));
  });
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  return loaded;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function setLetterSpacing(ctx: CanvasRenderingContext2D, px: number): void {
  if ("letterSpacing" in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
      `${px}px`;
  }
}

/** Greedy word wrap that also splits a single word that is wider than the line. */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  const pushLongWord = (word: string): string => {
    let chunk = "";
    for (const char of word) {
      if (ctx.measureText(chunk + char).width > maxWidth && chunk) {
        lines.push(chunk);
        chunk = char;
      } else {
        chunk += char;
      }
    }
    return chunk;
  };

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) {
      lines.push(current);
      current = "";
    }
    current = ctx.measureText(word).width > maxWidth ? pushLongWord(word) : word;
  }
  if (current) {
    lines.push(current);
  }
  return lines;
}

function ellipsize(
  ctx: CanvasRenderingContext2D,
  line: string,
  maxWidth: number,
): string {
  let text = line;
  while (text.length > 1 && ctx.measureText(`${text}…`).width > maxWidth) {
    text = text.slice(0, -1);
  }
  return `${text.trimEnd()}…`;
}

interface FittedText {
  readonly lines: string[];
  readonly fontSize: number;
}

/** Largest font size (down to `min`) at which the text fits in `maxLines` lines. */
export function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontFor: (size: number) => string,
  maxWidth: number,
  maxLines: number,
  max: number,
  min: number,
  step = 4,
): FittedText {
  for (let size = max; size >= min; size -= step) {
    ctx.font = fontFor(size);
    const lines = wrapText(ctx, text, maxWidth);
    if (lines.length <= maxLines) {
      return { lines, fontSize: size };
    }
  }
  ctx.font = fontFor(min);
  const lines = wrapText(ctx, text, maxWidth);
  const kept = lines.slice(0, maxLines);
  const last = kept[kept.length - 1];
  if (last !== undefined) {
    kept[kept.length - 1] = ellipsize(ctx, last, maxWidth);
  }
  return { lines: kept, fontSize: min };
}

function drawBackground(ctx: CanvasRenderingContext2D, tone: ShareTone): void {
  ctx.fillStyle = TONE_HEX[tone];
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  ctx.fillStyle = "rgba(255, 253, 249, 0.22)";
  ctx.beginPath();
  ctx.arc(CARD_WIDTH - 40, 60, 330, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-60, 940, 230, 0, Math.PI * 2);
  ctx.fill();
}

function drawHeader(
  ctx: CanvasRenderingContext2D,
  fonts: Fonts,
  logo: HTMLImageElement,
  pill: string,
): void {
  ctx.drawImage(logo, MARGIN - 8, 62, 104, 104);

  ctx.fillStyle = INK;
  ctx.textBaseline = "alphabetic";
  ctx.font = `800 62px ${fonts.display}`;
  setLetterSpacing(ctx, -2);
  ctx.fillText("Undue", MARGIN + 108, 134);
  setLetterSpacing(ctx, 0);

  ctx.font = `700 30px ${fonts.body}`;
  const padX = 30;
  const pillWidth = ctx.measureText(pill).width + padX * 2;
  const pillHeight = 28 * 2 + 4;
  const pillX = CARD_WIDTH - MARGIN - pillWidth;
  const pillY = 84;
  ctx.fillStyle = INK;
  roundedRect(ctx, pillX, pillY, pillWidth, pillHeight, pillHeight / 2);
  ctx.fill();
  ctx.fillStyle = PAPER;
  ctx.fillText(pill, pillX + padX, pillY + 42);
}

function drawHeadline(
  ctx: CanvasRenderingContext2D,
  fonts: Fonts,
  spec: ShareCardSpec,
): void {
  const maxWidth = CARD_WIDTH - MARGIN * 2;

  ctx.fillStyle = "rgba(25, 23, 19, 0.62)";
  ctx.font = `800 32px ${fonts.body}`;
  setLetterSpacing(ctx, 3);
  ctx.fillText(spec.eyebrow.toUpperCase(), MARGIN, 262);
  setLetterSpacing(ctx, 0);

  const title = fitText(
    ctx,
    spec.title,
    (size) => `800 ${size}px ${fonts.display}`,
    maxWidth,
    2,
    164,
    72,
  );
  const lineHeight = title.fontSize * 0.94;
  const bottom = 556;
  const firstBaseline = bottom - (title.lines.length - 1) * lineHeight;

  ctx.fillStyle = INK;
  ctx.font = `800 ${title.fontSize}px ${fonts.display}`;
  setLetterSpacing(ctx, -title.fontSize * 0.035);
  title.lines.forEach((line, index) => {
    ctx.fillText(line, MARGIN, firstBaseline + index * lineHeight);
  });
  setLetterSpacing(ctx, 0);
}

function drawValueCard(
  ctx: CanvasRenderingContext2D,
  fonts: Fonts,
  spec: ShareCardSpec,
): void {
  const x = MARGIN;
  const y = 604;
  const width = CARD_WIDTH - MARGIN * 2;
  const height = 292;

  ctx.save();
  ctx.shadowColor = "rgba(25, 23, 19, 0.16)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = PAPER;
  roundedRect(ctx, x, y, width, height, 56);
  ctx.fill();
  ctx.restore();

  const innerWidth = width - 112;
  const value = fitText(
    ctx,
    spec.value,
    (size) => `800 ${size}px ${fonts.display}`,
    innerWidth,
    1,
    132,
    60,
    4,
  );
  ctx.fillStyle = INK;
  ctx.font = `800 ${value.fontSize}px ${fonts.display}`;
  setLetterSpacing(ctx, -value.fontSize * 0.04);
  ctx.fillText(value.lines[0] ?? "", x + 56, y + 70 + value.fontSize * 0.78);
  setLetterSpacing(ctx, 0);

  ctx.fillStyle = "rgba(25, 23, 19, 0.62)";
  ctx.font = `700 38px ${fonts.body}`;
  ctx.fillText(spec.valueSub, x + 56, y + height - 50);
}

function drawDetail(
  ctx: CanvasRenderingContext2D,
  fonts: Fonts,
  spec: ShareCardSpec,
): void {
  if (!spec.detail) {
    return;
  }
  const fitted = fitText(
    ctx,
    spec.detail,
    (size) => `600 ${size}px ${fonts.body}`,
    540,
    3,
    40,
    30,
    2,
  );
  ctx.fillStyle = "rgba(25, 23, 19, 0.82)";
  ctx.font = `600 ${fitted.fontSize}px ${fonts.body}`;
  fitted.lines.forEach((line, index) => {
    ctx.fillText(line, MARGIN, 972 + index * fitted.fontSize * 1.32);
  });
}

function drawFooter(ctx: CanvasRenderingContext2D, fonts: Fonts): void {
  const top = 1176;
  ctx.fillStyle = DARK;
  ctx.fillRect(0, top, CARD_WIDTH, CARD_HEIGHT - top);

  const maxWidth = 560;
  const headline = fitText(
    ctx,
    "Never miss a cancel date.",
    (size) => `800 ${size}px ${fonts.display}`,
    maxWidth,
    1,
    48,
    32,
  );
  ctx.fillStyle = PAPER;
  ctx.font = `800 ${headline.fontSize}px ${fonts.display}`;
  ctx.fillText(headline.lines[0] ?? "", MARGIN, top + 76);

  const host = fitText(
    ctx,
    SITE_HOST,
    (size) => `700 ${size}px ${fonts.body}`,
    maxWidth,
    1,
    42,
    26,
  );
  ctx.fillStyle = LIME;
  ctx.font = `700 ${host.fontSize}px ${fonts.body}`;
  ctx.fillText(host.lines[0] ?? "", MARGIN, top + 130);

  ctx.fillStyle = "rgba(255, 253, 249, 0.55)";
  ctx.font = `600 24px ${fonts.body}`;
  ctx.fillText("Free · No account · Private", MARGIN, top + 164);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Could not create the image."));
      }
    }, "image/png");
  });
}

/** Renders the share card to a 1080×1350 PNG. Browser only. */
export async function renderShareCard(spec: ShareCardSpec): Promise<Blob> {
  const fonts = resolveFonts();
  await ensureFonts(fonts);

  const [logo, hero] = await Promise.all([
    loadLogo(104),
    loadMascot(spec.mascot, "#fffdf9", 420, 14),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("This browser cannot draw images.");
  }

  drawBackground(ctx, spec.tone);
  drawHeader(ctx, fonts, logo, spec.pill);
  drawHeadline(ctx, fonts, spec);
  drawValueCard(ctx, fonts, spec);
  drawDetail(ctx, fonts, spec);
  drawFooter(ctx, fonts);
  ctx.drawImage(hero, 664, 846, 420, 420);

  return canvasToBlob(canvas);
}
