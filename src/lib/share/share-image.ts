export type ShareOutcome = "shared" | "cancelled" | "unsupported";

export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type || "image/png" });
}

/** True when this browser can hand an image file to the system share sheet. */
export function canShareFile(file: File): boolean {
  if (typeof navigator === "undefined" || typeof navigator.canShare !== "function") {
    return false;
  }
  try {
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

/**
 * Opens the system share sheet with the image attached. Must be called straight
 * from a click handler (browsers reject share() otherwise), so callers render
 * the image first and only call this on the tap.
 */
export async function shareImageFile(
  file: File,
  options: { title: string; text: string },
): Promise<ShareOutcome> {
  if (!canShareFile(file)) {
    return "unsupported";
  }
  try {
    await navigator.share({ files: [file], title: options.title, text: options.text });
    return "shared";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return "cancelled";
    }
    throw error;
  }
}

/** Saves the image to the device. The object URL is released after the click is handled. */
export function downloadImage(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4_000);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
