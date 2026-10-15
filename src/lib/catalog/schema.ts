import { z } from "zod";
import { categoryIdSchema, cycleSchema } from "@/lib/domain/schema";

export const catalogEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: categoryIdSchema,
  aliases: z.array(z.string()).default([]),
  defaultCycle: cycleSchema,
  defaultLeadDays: z.number().int().min(0).max(60),
  cancelUrl: z.string().url().nullable(),
  cancelNote: z.string().min(1),
});
export type CatalogEntry = z.infer<typeof catalogEntrySchema>;
