"use client";

import { useSyncExternalStore } from "react";
import {
  getNotificationsSnapshot,
  getServerNotificationsSnapshot,
  notificationsSupported,
  subscribeNotifications,
} from "@/lib/notifications/notifications";

const noopSubscribe = (): (() => void) => () => undefined;

export function useNotificationsEnabled(): boolean {
  return useSyncExternalStore(
    subscribeNotifications,
    getNotificationsSnapshot,
    getServerNotificationsSnapshot,
  );
}

export function useNotificationsSupported(): boolean {
  return useSyncExternalStore(noopSubscribe, notificationsSupported, () => false);
}
