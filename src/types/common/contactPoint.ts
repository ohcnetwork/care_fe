import { t } from "i18next";
import { z } from "zod";

export const ContactPointSystems = [
  "phone",
  "fax",
  "email",
  "pager",
  "url",
  "sms",
  "other",
] as const;

export type ContactPointSystem = (typeof ContactPointSystems)[number];

export const ContactPointUses = ["home", "work", "temp", "mobile"] as const;

export type ContactPointUse = (typeof ContactPointUses)[number];

export interface ContactPoint {
  system: ContactPointSystem;
  value: string;
  use: ContactPointUse;
}

export default () => ({
  contactPoint: z.discriminatedUnion("system", [
    // Phone numbers
    z.object({
      system: z.literal("phone"),
      value: z.string().min(1, { message: t("field_required") }),
      use: z.enum(ContactPointUses),
    }),
    // Fax numbers (also using phone validation since they follow same format)
    z.object({
      system: z.literal("fax"),
      value: z.string().min(1, { message: t("field_required") }),
      use: z.enum(ContactPointUses),
    }),
    // Email addresses
    z.object({
      system: z.literal("email"),
      value: z
        .string()
        .min(1, { message: t("field_required") })
        .email(),
      use: z.enum(ContactPointUses),
    }),
    // URLs
    z.object({
      system: z.literal("url"),
      value: z
        .string()
        .min(1, { message: t("field_required") })
        .url(),
      use: z.enum(ContactPointUses),
    }),
    // SMS (also using phone validation)
    z.object({
      system: z.literal("sms"),
      value: z.string().min(1, { message: t("field_required") }),
      use: z.enum(ContactPointUses),
    }),
    // Pager (typically numeric, but can vary)
    z.object({
      system: z.literal("pager"),
      value: z
        .string()
        .min(1, { message: t("field_required") })
        .max(20, { message: t("pager_number_too_long") }),
      use: z.enum(ContactPointUses),
    }),
    // Other (catch-all with basic validation)
    z.object({
      system: z.literal("other"),
      value: z.string().min(1, { message: t("field_required") }),
      use: z.enum(ContactPointUses),
    }),
  ]),
});
