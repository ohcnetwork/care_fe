import { type DateLike, formatDateTime as formatDate } from "@/Utils/date";

export const formatDateTime = (date: DateLike, pattern?: string) =>
  formatDate(date, pattern, "MMM dd, yyyy", "MMM dd, yyyy, hh:mm a");

export function booleanFromString(str: string | undefined, fallback = false) {
  if (str === "true") return true;
  if (str === "false") return false;
  return fallback;
}
