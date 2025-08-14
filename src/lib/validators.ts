import { z } from "zod";


export const tzAwareDateTime = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?([+-]\d{2}:\d{2}|Z)$/,
    "Invalid ISO date-time format with timezone"
  );

export const timeRequired = z
  .string()
  .min(1, "Required")
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "Invalid time format" });

export const timeOptional = z.preprocess(
  v => (v === "" ? undefined : v),
  z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional()
);
