import { formatMoney } from "@/lib/domain/currency";
import type { CurrencyCode } from "@/lib/domain/schema";
import { downloadBlob } from "@/lib/utils/download";
import { SITE_HOST, SITE_URL } from "@/lib/site";
import { wrapText } from "./render-card";

/** Canonical public URL used in share text and the card footer. */
export const SHARE_URL = SITE_URL;

export interface ShareCardInput {
  name: string;
  amount: number;
  currency: CurrencyCode;
  cancelBy: string;
  renewal: string;
  cancelled: boolean;
  trial: boolean;
}

const WIDTH = 1080;
const HEIGHT = 1350;

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

async function ensureFonts(): Promise<void> {
  if (typeof document === "undefined" || !("fonts" in document)) {
    return;
  }
  const loads = [
    `800 54px "Bricolage Grotesque"`,
    `800 104px "Bricolage Grotesque"`,
    `800 68px "Bricolage Grotesque"`,
    `800 76px "Bricolage Grotesque"`,
    `600 22px "DM Sans"`,
    `600 24px "DM Sans"`,
    `700 24px "DM Sans"`,
    `700 28px "DM Sans"`,
  ];
  try {
    await Promise.all(loads.map((font) => document.fonts.load(font)));
  } catch {
    // Fall back to whatever the system has; the card is still readable.
  }
}

/** Largest size at which the text fits in `maxLines` lines, then wrap. */
function fitLines(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
  from: number,
  to: number,
): { lines: string[]; size: number } {
  for (let size = from; size >= to; size -= 8) {
    context.font = `800 ${size}px 'Bricolage Grotesque', 'DM Sans', sans-serif`;
    const lines = wrapText(context, text, maxWidth);
    if (lines.length <= maxLines) {
      return { lines, size };
    }
  }
  context.font = `800 ${to}px 'Bricolage Grotesque', 'DM Sans', sans-serif`;
  const lines = wrapText(context, text, maxWidth).slice(0, maxLines);
  return { lines, size: to };
}

function drawLogo(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size = 160,
): void {
  const scale = size / 64;
  context.save();
  context.translate(x, y);
  context.scale(scale, scale);
  context.lineCap = "round";
  context.lineJoin = "round";

  context.fillStyle = "#bde66a";
  roundRect(context, 0, 0, 64, 64, 16);
  context.fill();

  context.fillStyle = "#fffdf9";
  context.strokeStyle = "#191713";
  context.lineWidth = 4;
  roundRect(context, 17, 17, 30, 32, 7);
  context.fill();
  context.stroke();

  context.beginPath();
  context.moveTo(17, 27);
  context.lineTo(47, 27);
  context.stroke();

  context.beginPath();
  context.moveTo(24, 13);
  context.lineTo(24, 21);
  context.moveTo(40, 13);
  context.lineTo(40, 21);
  context.stroke();

  context.strokeStyle = "#ff6b5a";
  context.lineWidth = 6;
  context.beginPath();
  context.moveTo(24, 44);
  context.lineTo(43, 25);
  context.stroke();

  context.restore();
}

export async function createShareImage(input: ShareCardInput): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("This browser cannot draw the share card.");
  }

  context.fillStyle = "#f8f0e5";
  context.fillRect(0, 0, WIDTH, HEIGHT);

  context.fillStyle = "#bde66a";
  context.beginPath();
  context.arc(940, 100, 250, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#cbb8f7";
  context.beginPath();
  context.arc(1010, 1235, 200, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#ff6b5a";
  context.beginPath();
  context.arc(910, 1140, 120, 0, Math.PI * 2);
  context.fill();

  await ensureFonts();
  drawLogo(context, 72, 74);

  context.fillStyle = "#191713";
  context.font = "800 54px 'Bricolage Grotesque', 'DM Sans', sans-serif";
  context.fillText("Undue", 250, 150);
  context.font = "600 24px 'DM Sans', sans-serif";
  context.fillStyle = "#756b5f";
  context.fillText("Know when to cancel, before you’re charged.", 250, 188);

  const headline = fitLines(
    context,
    input.cancelled ? "One less charge." : input.name,
    900,
    3,
    104,
    64,
  );
  const lineHeight = Math.round(headline.size * 1.04);
  context.fillStyle = "#191713";
  context.font = `800 ${headline.size}px 'Bricolage Grotesque', 'DM Sans', sans-serif`;
  headline.lines.forEach((line, index) => {
    context.fillText(line, 72, 380 + index * lineHeight);
  });

  context.fillStyle = "#191713";
  context.font = "800 76px 'Bricolage Grotesque', 'DM Sans', sans-serif";
  context.fillText(formatMoney(input.amount, input.currency), 72, 720);

  context.fillStyle = input.cancelled ? "#bde66a" : "#ff6b5a";
  roundRect(context, 72, 790, 936, 250, 42);
  context.fill();

  context.fillStyle = "#191713";
  context.font = "700 24px 'DM Sans', sans-serif";
  context.fillText(
    input.cancelled ? "CANCELLED" : input.trial ? "TRIAL ENDS" : "LAST DAY TO CANCEL",
    112,
    852,
  );
  context.font = "800 68px 'Bricolage Grotesque', 'DM Sans', sans-serif";
  context.fillText(input.cancelled ? "Nothing due" : input.cancelBy, 112, 940);
  context.font = "600 24px 'DM Sans', sans-serif";
  context.fillStyle = "#19171399";
  context.fillText(
    input.cancelled ? "Undo anytime in Undue." : `Next charge ${input.renewal}`,
    112,
    990,
  );

  context.fillStyle = "#171614";
  roundRect(context, 72, 1090, 936, 112, 56);
  context.fill();
  context.fillStyle = "#fffdf9";
  context.font = "700 28px 'DM Sans', sans-serif";
  context.fillText("Track yours free at", 112, 1140);
  context.fillStyle = "#bde66a";
  context.font = "800 36px 'Bricolage Grotesque', 'DM Sans', sans-serif";
  context.fillText(SITE_HOST, 112, 1180);

  context.fillStyle = "#756b5f";
  context.font = "600 22px 'DM Sans', sans-serif";
  context.fillText(
    "Private by design. No account. Nothing leaves your device.",
    72,
    1270,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Could not create the share image."));
      }
    }, "image/png");
  });
}

export function shareFilename(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `undue-${slug || "deadline"}.png`;
}

export async function shareOrDownloadImage(
  blob: Blob,
  filename: string,
  title: string,
  text: string,
): Promise<"shared" | "downloaded"> {
  const file = new File([blob], filename, { type: "image/png" });
  let canShare = typeof navigator.share === "function";
  if (canShare && typeof navigator.canShare === "function") {
    try {
      canShare = navigator.canShare({ files: [file] });
    } catch {
      canShare = false;
    }
  }

  if (canShare) {
    try {
      await navigator.share({ files: [file], title, text });
      return "shared";
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }
    }
  }

  downloadBlob(blob, filename);
  return "downloaded";
}
