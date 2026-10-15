"use client";

import type { ReactNode } from "react";
import { AppDataProvider } from "@/components/providers/app-data-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { PlusIcon } from "@/components/ui/icons";
import {
  SubscriptionSheetProvider,
  useSubscriptionSheet,
} from "@/components/subscriptions/subscription-sheet";
import { BottomNav } from "./bottom-nav";
import { ServiceWorkerRegistrar } from "./service-worker-registrar";

function AddSubscriptionButton() {
  const { openAdd } = useSubscriptionSheet();

  return (
    <button
      type="button"
      onClick={openAdd}
      aria-label="Add subscription"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 78px)" }}
      className="fixed left-1/2 z-40 flex size-14 -translate-x-1/2 items-center justify-center rounded-full bg-ember-strong text-white shadow-sheet transition-transform active:scale-95"
    >
      <PlusIcon width={26} height={26} />
    </button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AppDataProvider>
        <SubscriptionSheetProvider>
          <div className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col">
            <main className="flex-1 px-4 pt-safe pb-32">{children}</main>
          </div>
          <AddSubscriptionButton />
          <BottomNav />
          <ServiceWorkerRegistrar />
        </SubscriptionSheetProvider>
      </AppDataProvider>
    </ToastProvider>
  );
}
