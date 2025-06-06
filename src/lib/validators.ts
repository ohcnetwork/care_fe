import { z } from "zod";


export const tzAwareDateTime = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?([+-]\d{2}:\d{2}|Z)$/,
    "Invalid ISO date-time format with timezone"
  );