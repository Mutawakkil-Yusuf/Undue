import Dexie, { type EntityTable } from "dexie";
import type { AppSettings, Subscription } from "@/lib/domain/schema";

export class UndueDatabase extends Dexie {
  subscriptions!: EntityTable<Subscription, "id">;
  settings!: EntityTable<AppSettings, "id">;

  constructor() {
    super("undue");
    this.version(1).stores({
      subscriptions: "id, status, nextRenewal, createdAt",
      settings: "id",
    });
    this.version(2)
      .stores({
        subscriptions: "id, status, nextRenewal, createdAt",
        settings: "id",
      })
      .upgrade((transaction) =>
        transaction
          .table("subscriptions")
          .toCollection()
          .modify((subscription: { priceHistory?: unknown }) => {
            if (!Array.isArray(subscription.priceHistory)) {
              subscription.priceHistory = [];
            }
          }),
      );
    this.version(3)
      .stores({
        subscriptions: "id, status, nextRenewal, createdAt",
        settings: "id",
      })
      .upgrade(async (transaction) => {
        await transaction
          .table("subscriptions")
          .toCollection()
          .modify(
            (subscription: {
              nextRenewal?: string;
              billingDay?: number;
              trialEndsAt?: string | null;
              paidVia?: string;
              chargeStatus?: string;
              myShare?: number | null;
            }) => {
              if (!subscription.billingDay) {
                const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(
                  subscription.nextRenewal ?? "",
                );
                subscription.billingDay = match ? Number(match[3]) : 1;
              }
              if (subscription.trialEndsAt === undefined) {
                subscription.trialEndsAt = null;
              }
              if (subscription.paidVia === undefined) {
                subscription.paidVia = "card";
              }
              if (subscription.chargeStatus === undefined) {
                subscription.chargeStatus = "unknown";
              }
              if (subscription.myShare === undefined) {
                subscription.myShare = null;
              }
            },
          );

        await transaction
          .table("settings")
          .toCollection()
          .modify(
            (settings: {
              notificationTime?: string;
              lastBackupAt?: string | null;
              ratesUpdatedAt?: string | null;
            }) => {
              if (!settings.notificationTime) {
                settings.notificationTime = "08:00";
              }
              if (settings.lastBackupAt === undefined) {
                settings.lastBackupAt = null;
              }
              if (settings.ratesUpdatedAt === undefined) {
                settings.ratesUpdatedAt = null;
              }
            },
          );
      });
  }
}

export const db = new UndueDatabase();
