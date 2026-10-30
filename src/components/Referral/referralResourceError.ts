import { HTTPError } from "@/Utils/request/types";

export function referralResourceError(
  error: unknown,
  fallback: string,
): string {
  if (
    !(error instanceof HTTPError) ||
    !error.cause ||
    error.status < 400 ||
    error.status >= 500
  )
    return fallback;
  function messagesFrom(value: unknown, depth = 0): string[] {
    if (depth > 4) return [];
    if (typeof value === "string") return [value];
    if (Array.isArray(value))
      return value.flatMap((item) => messagesFrom(item, depth + 1));
    if (!value || typeof value !== "object") return [];
    // Never include validation input, context or locations: those can contain
    // entire submitted clinical payloads. Only follow known error containers.
    return Object.entries(value)
      .filter(([key]) =>
        [
          "detail",
          "msg",
          "message",
          "errors",
          "error",
          "non_field_errors",
        ].includes(key),
      )
      .flatMap(([, item]) => messagesFrom(item, depth + 1));
  }
  const messages = Object.entries(error.cause)
    .filter(([key]) => !["input", "ctx", "loc", "type"].includes(key))
    .flatMap(([, value]) => messagesFrom(value));
  return messages.length ? messages.join(" ").slice(0, 600) : fallback;
}
