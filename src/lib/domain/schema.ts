import { z } from "zod";

export const CURRENCY_CODES = ["NGN", "USD", "GBP"] as const;
export const currencyCodeSchema = z.enum(CURRENCY_CODES);
export type CurrencyCode = z.infer<typeof currencyCodeSchema>;

export const CYCLE_UNITS = ["day", "week", "month", "year"] as const;
export const cycleUnitSchema = z.enum(CYCLE_UNITS);
export type CycleUnit = z.infer<typeof cycleUnitSchema>;

export const cycleSchema = z.object({
  unit: cycleUnitSchema,
  interval: z.number().int().min(1).max(60),
});
export type Cycle = z.infer<typeof cycleSchema>;

export const CATEGORY_IDS = [
  "streaming",
  "music",
  "cloud",
  "software",
  "mobile",
  "internet",
  "gaming",
  "fitness",
  "finance",
  "education",
  "other",
] as const;
export const categoryIdSchema = z.enum(CATEGORY_IDS);
export type CategoryId = z.infer<typeof categoryIdSchema>;

export interface Category {
  readonly id: CategoryId;
  readonly label: string;
  readonly emoji: string;
}

export const CATEGORIES: readonly Category[] = [
  { id: "streaming", label: "Streaming", emoji: "📺" },
  { id: "music", label: "Music", emoji: "🎧" },
  { id: "cloud", label: "Cloud storage", emoji: "☁️" },
  { id: "software", label: "Software", emoji: "🧩" },
  { id: "mobile", label: "Airtime & data", emoji: "📶" },
  { id: "internet", label: "Internet & hosting", emoji: "🌐" },
  { id: "gaming", label: "Gaming", emoji: "🎮" },
  { id: "fitness", label: "Health & fitness", emoji: "💪" },
  { id: "finance", label: "Finance", emoji: "🏦" },
  { id: "education", label: "Learning", emoji: "📚" },
  { id: "other", label: "Other", emoji: "📦" },
];

const categoryById = new Map(CATEGORIES.map((category) => [category.id, category]));

export function getCategory(id: CategoryId): Category {
  const category = categoryById.get(id);
  if (!category) {
    throw new RangeError(`Unknown category: ${id}`);
  }
  return category;
}

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a YYYY-MM-DD date");

export const subscriptionStatusSchema = z.enum(["active", "cancelled"]);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

export const subscriptionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  serviceId: z.string().min(1).nullable(),
  emoji: z.string().min(1).max(8),
  category: categoryIdSchema,
  amount: z.number().nonnegative().finite(),
  currency: currencyCodeSchema,
  cycle: cycleSchema,
  nextRenewal: isoDateSchema,
  leadDays: z.number().int().min(0).max(60),
  isTrial: z.boolean(),
  cancelUrl: z.string().url().nullable(),
  notes: z.string().max(1000).nullable(),
  status: subscriptionStatusSchema,
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});
export type Subscription = z.infer<typeof subscriptionSchema>;

export const settingsSchema = z.object({
  id: z.literal("app"),
  displayCurrency: currencyCodeSchema,
  fxToNgn: z.record(currencyCodeSchema, z.number().positive()),
  defaultLeadDays: z.number().int().min(0).max(60),
  updatedAt: z.string().min(1),
});
export type AppSettings = z.infer<typeof settingsSchema>;
