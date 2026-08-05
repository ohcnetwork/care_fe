import { format, isValid, parse } from "date-fns";

/**
 * A date-only row value rendered with a `date-fns` pattern.
 *
 * Structured rows carry a clinical date either as the bare `yyyy-MM-dd` the
 * native `<input type="date">` speaks or as the UTC-midnight instant the
 * wire uses for that same calendar day. Both must be read off the STRING and
 * re-anchored to LOCAL midnight: `new Date("2026-08-01")` is UTC midnight per
 * ECMAScript, so formatting it renders 31 Jul anywhere west of Greenwich —
 * one day off from the `<input type="date">` sitting in the same row.
 *
 * Only a value carrying a real time of day (`authored_on`, an encounter's
 * discharge instant, a record's `created_date`) names a moment rather than a
 * calendar day, and those may go through `new Date` for display.
 *
 * A missing or unparseable value renders as `""` so callers can drop the
 * result straight into a cell.
 */
export function formatCalendarDate(
  value: string | null | undefined,
  pattern: string,
): string {
  if (!value) return "";
  const date = parse(value.slice(0, 10), "yyyy-MM-dd", new Date());
  return isValid(date) ? format(date, pattern) : "";
}
