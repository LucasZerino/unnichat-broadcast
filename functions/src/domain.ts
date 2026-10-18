import { z } from "zod";

const id = z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/);
const name = z.string().trim().min(1).max(100);
const connection = z.object({ connectionId: id });
const phone = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s()+.-]/g, ""))
  .pipe(
    z
      .string()
      .regex(/^\d{10,15}$/, "Informe um telefone com DDD (10 a 15 dígitos)."),
  );
const recipients = z
  .array(id)
  .min(1)
  .max(100)
  .refine(
    (values) => new Set(values).size === values.length,
    "Contatos duplicados.",
  );
export const commandSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("createConnection"), name }),
  connection.extend({ action: z.literal("updateConnection"), name }),
  connection.extend({ action: z.literal("deleteConnection") }),
  connection.extend({ action: z.literal("createContact"), name, phone }),
  connection.extend({
    action: z.literal("updateContact"),
    contactId: id,
    name,
    phone,
  }),
  connection.extend({ action: z.literal("deleteContact"), contactId: id }),
  connection.extend({
    action: z.literal("createBroadcast"),
    text: z.string().trim().min(1).max(4000),
    contactIds: recipients,
    scheduledAt: z.number().int().positive().nullable(),
  }),
  connection.extend({
    action: z.literal("updateBroadcast"),
    broadcastId: id,
    text: z.string().trim().min(1).max(4000),
    contactIds: recipients,
    scheduledAt: z.number().int().positive().nullable(),
  }),
  connection.extend({ action: z.literal("deleteBroadcast"), broadcastId: id }),
]);
export type Command = z.infer<typeof commandSchema>;

export function isDue(status: string, scheduledAt: number | null, now: number) {
  return status === "scheduled" && scheduledAt !== null && scheduledAt <= now;
}
export function validSchedule(scheduledAt: number | null, now: number) {
  return (
    scheduledAt === null ||
    (scheduledAt > now && scheduledAt <= now + 366 * 86400000)
  );
}
