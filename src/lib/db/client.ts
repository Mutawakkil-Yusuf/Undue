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
  }
}

export const db = new UndueDatabase();
