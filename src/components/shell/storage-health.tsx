"use client";

import { useEffect } from "react";
import { useToast } from "@/components/providers/toast-provider";
import { db } from "@/lib/db/client";

export function StorageHealth() {
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        await db.open();
        const estimate = await navigator.storage?.estimate?.();
        if (
          active &&
          estimate?.usage !== undefined &&
          estimate.quota !== undefined &&
          estimate.quota > 0 &&
          estimate.usage / estimate.quota > 0.9
        ) {
          showToast(
            "This browser is almost out of storage. Export a backup and free some space.",
            "danger",
          );
        }
      } catch {
        if (active) {
          showToast(
            "Local storage is unavailable. Private browsing or a full disk can block saving. Export a backup if you can.",
            "danger",
          );
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [showToast]);

  return null;
}
