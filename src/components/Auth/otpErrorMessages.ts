import { HTTPError } from "@/Utils/request/types";

/**
 * Flattens an OTP endpoint error into a field → message map. Validation
 * failures arrive as `{ errors: [{ msg: string | { [field]: message } }] }`;
 * a plain string `msg`, a throttling `detail` or a top-level `error` is
 * reported under `error`.
 */
export function otpErrorMessages(error: unknown): Record<string, string> {
  const messages: Record<string, string> = {};
  if (!(error instanceof HTTPError) || !error.cause) return messages;

  const cause: Record<string, unknown> = error.cause;
  if (Array.isArray(cause.errors)) {
    for (const entry of cause.errors) {
      const msg: unknown = entry?.msg;
      if (typeof msg === "string") {
        messages.error = msg;
      } else if (msg && typeof msg === "object") {
        for (const [field, value] of Object.entries(msg)) {
          const text: unknown = Array.isArray(value) ? value[0] : value;
          if (typeof text === "string") messages[field] = text;
        }
      }
    }
  }

  for (const field of ["error", "otp", "password"]) {
    const value = cause[field];
    if (typeof value === "string") messages[field] = value;
  }
  if (!messages.error && typeof cause.detail === "string") {
    messages.error = cause.detail;
  }

  return messages;
}
