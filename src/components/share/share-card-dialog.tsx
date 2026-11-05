"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { CloseIcon, DownloadIcon, ShareIcon } from "@/components/ui/icons";
import { Switch } from "@/components/ui/switch";
import type { ShareCardSpec } from "@/lib/share/card-spec";
import { civilDate } from "@/lib/domain/date";
import type { Subscription } from "@/lib/domain/schema";
import { buildCardSpecFor, buildSavedCardSpec } from "@/lib/share/card-spec";
import { renderShareCard } from "@/lib/share/render-card";
import {
  blobToFile,
  canShareFile,
  copyText,
  downloadImage,
  shareImageFile,
} from "@/lib/share/share-image";

interface ShareCardDialogProps {
  subscription: Subscription;
  /** "saved" forces the cancelled-and-saved card, e.g. right after cancelling. */
  mode?: "auto" | "saved";
  defaultIncludeAmount: boolean;
  onClose: () => void;
}

interface Rendered {
  readonly blob: Blob;
  readonly url: string;
  readonly spec: ShareCardSpec;
}

export function ShareCardDialog({
  subscription,
  mode = "auto",
  defaultIncludeAmount,
  onClose,
}: ShareCardDialogProps) {
  const { showToast } = useToast();
  const [includeAmount, setIncludeAmount] = useState(defaultIncludeAmount);
  const [rendered, setRendered] = useState<Rendered | null>(null);
  const [failed, setFailed] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Draw the image up front so the Share tap can call navigator.share()
  // immediately; browsers reject share() if it waits on async work first.
  useEffect(() => {
    let cancelled = false;
    let createdUrl: string | null = null;
    const today = civilDate();
    const options = { includeAmount };
    const spec =
      mode === "saved"
        ? buildSavedCardSpec(subscription, today, options)
        : buildCardSpecFor(subscription, today, options);

    renderShareCard(spec)
      .then((blob) => {
        if (cancelled) {
          return;
        }
        createdUrl = URL.createObjectURL(blob);
        setFailed(false);
        setRendered({ blob, url: createdUrl, spec });
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [subscription, mode, includeAmount]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = dialogRef.current;
    const focusableSelector =
      "button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex='-1'])";
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key === "Tab" && panel) {
        // Keep Tab inside this dialog, and stop the sheet or celebration
        // underneath from pulling focus back into itself.
        event.stopPropagation();
        const focusable = Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) {
          event.preventDefault();
          return;
        }
        const active = document.activeElement;
        if (event.shiftKey && (active === first || !panel.contains(active))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (active === last || !panel.contains(active))) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.body.style.overflow = originalOverflow;
      previous?.focus?.();
    };
  }, [onClose]);

  const file = rendered ? blobToFile(rendered.blob, rendered.spec.filename) : null;
  const canNativeShare = file ? canShareFile(file) : false;

  const handleShare = useCallback(async () => {
    if (!rendered || !file) {
      return;
    }
    try {
      const outcome = await shareImageFile(file, {
        title: rendered.spec.title,
        text: rendered.spec.shareText,
      });
      if (outcome === "unsupported") {
        downloadImage(rendered.blob, rendered.spec.filename);
        showToast("Image saved. Attach it in any app.", "success");
      }
    } catch {
      showToast("Could not open sharing. Try Download instead.", "danger");
    }
  }, [file, rendered, showToast]);

  const handleDownload = useCallback(() => {
    if (!rendered) {
      return;
    }
    downloadImage(rendered.blob, rendered.spec.filename);
    showToast("Image saved", "success");
  }, [rendered, showToast]);

  const handleCopy = useCallback(async () => {
    if (!rendered) {
      return;
    }
    const ok = await copyText(rendered.spec.shareText);
    showToast(ok ? "Message copied" : "Could not copy that", ok ? "success" : "danger");
  }, [rendered, showToast]);

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Share as an image"
      className="fixed inset-0 z-[90] flex animate-fade-in flex-col overflow-y-auto bg-dark/90 px-4 pt-safe pb-safe backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-extrabold tracking-[-0.04em] text-paper">
            Share as an image
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-11 items-center justify-center rounded-full bg-paper/10 text-paper transition-colors hover:bg-paper/20"
          >
            <CloseIcon width={20} height={20} />
          </button>
        </div>

        <div
          className="relative w-full overflow-hidden rounded-[1.5rem] bg-paper/10 shadow-card"
          style={{ aspectRatio: "1080 / 1350" }}
        >
          {rendered ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={rendered.url}
              alt={rendered.spec.alt}
              className="absolute inset-0 size-full object-contain"
              draggable={false}
            />
          ) : (
            <div
              role="status"
              className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm font-semibold text-paper/70"
            >
              {failed ? "Could not draw the image on this device." : "Drawing your card…"}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-paper/10 px-3.5 py-2.5">
          <Switch
            checked={includeAmount}
            onChange={setIncludeAmount}
            tone="fixed"
            label="Show the price"
            description="Off by default so you only share what you mean to."
            className="[&_*]:!text-paper"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="lime"
            size="lg"
            disabled={!rendered}
            onClick={() => void handleShare()}
            leadingIcon={<ShareIcon width={18} height={18} />}
          >
            {canNativeShare ? "Share" : "Save to share"}
          </Button>
          <Button
            variant="white"
            size="lg"
            disabled={!rendered}
            onClick={handleDownload}
            leadingIcon={<DownloadIcon width={18} height={18} />}
          >
            Download
          </Button>
        </div>
        <button
          type="button"
          onClick={() => void handleCopy()}
          disabled={!rendered}
          className="mx-auto rounded-full px-4 py-2 text-xs font-bold text-paper/70 underline decoration-2 underline-offset-4 hover:text-paper disabled:opacity-40"
        >
          Copy message with link
        </button>
      </div>
    </div>,
    document.body,
  );
}
