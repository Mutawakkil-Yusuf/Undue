"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import { AppDataProvider } from "@/components/providers/app-data-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { SubscriptionSheetProvider } from "@/components/subscriptions/subscription-sheet";
import { SubscriptionDetailProvider } from "@/components/subscriptions/subscription-detail-sheet";
import { BottomNav } from "./bottom-nav";
import { CelebrationProvider } from "./celebration";
import { DesktopSidebar } from "./desktop-sidebar";
import { NotificationScheduler } from "./notification-scheduler";
import { DecisionQueryHandler } from "./decision-query-handler";
import { Onboarding } from "./onboarding";
import { ReminderNotifier } from "./reminder-notifier";
import { ServiceWorkerRegistrar } from "./service-worker-registrar";
import { StorageHealth } from "./storage-health";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppDataProvider>
          <CelebrationProvider>
            <SubscriptionSheetProvider>
              <SubscriptionDetailProvider>
                <Suspense fallback={null}>
                  <DecisionQueryHandler />
                </Suspense>
                <div className="min-h-[100dvh] lg:pl-[300px]">
                  <DesktopSidebar />
                  <main className="mx-auto w-full max-w-[1360px] px-5 pt-safe pb-nav sm:px-8 lg:px-10 lg:pt-10 lg:pb-16 xl:px-12 2xl:px-16">
                    {children}
                  </main>
                </div>
                <BottomNav />
                <Onboarding />
                <ReminderNotifier />
                <NotificationScheduler />
                <ServiceWorkerRegistrar />
                <StorageHealth />
              </SubscriptionDetailProvider>
            </SubscriptionSheetProvider>
          </CelebrationProvider>
        </AppDataProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
