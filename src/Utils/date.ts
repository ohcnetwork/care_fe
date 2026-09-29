import {
  addDays,
  addMonths,
  addYears,
  differenceInCalendarMonths,
  differenceInDays,
  format,
  formatDistanceToNow,
  isAfter,
  isEqual,
  isToday,
  isValid,
  parse,
  parseISO,
  startOfDay,
  subMinutes,
} from "date-fns";
import { t } from "i18next";

import type {
  PatientListRead,
  PatientRead,
  PublicPatientRead,
} from "@/types/emr/patient/patient";

export type DateLike = string | number | Date | null | undefined;

/** ISO date-only values represent local calendar dates, not UTC midnight. */
export const parseDate = (value: DateLike): Date => {
  if (value === undefined) return new Date();
  if (value === null) return new Date(NaN);
  if (typeof value !== "string") return new Date(value);
  const date = parseISO(value);
  return isValid(date) ? date : new Date(value);
};

export const formatDateTime = (
  date: DateLike,
  pattern?: string,
  datePattern = "dd/MM/yyyy",
  dateTimePattern = "hh:mm a; dd/MM/yyyy",
) => {
  const parsed = parseDate(date);
  if (!isValid(parsed)) return "Invalid Date";
  return format(
    parsed,
    pattern ||
      (isEqual(parsed, startOfDay(parsed)) ? datePattern : dateTimePattern),
  );
};

export const relativeDate = (date: DateLike, withoutSuffix = false) => {
  const parsed = parseDate(date);
  if (!isValid(parsed)) return "Invalid Date";
  const hasTime = !!(
    parsed.getHours() ||
    parsed.getMinutes() ||
    parsed.getSeconds()
  );
  if (isToday(parsed) && !hasTime) return t("today");
  return formatDistanceToNow(parsed, { addSuffix: !withoutSuffix });
};

export const relativeTime = (time?: DateLike) => {
  const parsed = parseDate(time);
  return isValid(parsed)
    ? formatDistanceToNow(parsed, { addSuffix: true })
    : "Invalid Date";
};

export const dateQueryString = (date: DateLike) => {
  if (!date) return "";
  const parsed = parseDate(date);
  return isValid(parsed) ? format(parsed, "yyyy-MM-dd") : "";
};

/** Local midnight from a "YYYY-MM-DD" string for the calendar. */
export const parseLocalDate = (dateYmd?: string): Date | undefined =>
  dateYmd ? parseISO(dateYmd) : undefined;

export const dateTimeQueryString = (date: DateLike, isEndDate = false) => {
  if (!date) return "";
  const parsed = parseDate(date);
  if (!isValid(parsed)) return "";
  const midnight = startOfDay(parsed);
  return (isEndDate ? addDays(midnight, 1) : midnight).toISOString();
};

export const isUserOnline = (user: { last_login: DateLike }) =>
  !!user.last_login &&
  isAfter(parseDate(user.last_login), subMinutes(new Date(), 5));

/** Round-trip parsing keeps incomplete fields and overflowing dates invalid. */
export const isValidDate = (year: string, month: string, day: string) => {
  const value = `${year}-${month}-${day}`;
  const parsed = parse(value, "yyyy-MM-dd", new Date());
  return isValid(parsed) && format(parsed, "yyyy-MM-dd") === value;
};

const ageUnit = (
  count: number,
  unit: "years" | "months" | "weeks" | "days",
  abbreviated = false,
) =>
  abbreviated ? t(`age_${unit}_short`, { count }) : t(`age_${unit}`, { count });

// A month completes at the clamped calendar anniversary, including February.
const completedMonths = (end: Date, start: Date): number => {
  if (isAfter(start, end)) return -completedMonths(start, end);
  const months = differenceInCalendarMonths(end, start);
  return months - (isAfter(addMonths(start, months), end) ? 1 : 0);
};

export const formatPatientAge = (
  obj: PatientRead | PatientListRead | PublicPatientRead,
  abbreviated = false,
) => {
  const start = obj.date_of_birth
    ? parseISO(obj.date_of_birth)
    : new Date(obj.year_of_birth!, 0, 1);
  const end =
    "deceased_datetime" in obj && obj.deceased_datetime
      ? parseISO(obj.deceased_datetime)
      : new Date();
  const months = completedMonths(end, start);
  // Count completed months so leap-day birthdays retain end-of-month semantics.
  const years = Math.trunc(months / 12);
  // Skip representing as no. of months/days if we don't know the date of birth
  // since it would anyways be inaccurate.
  if (!obj.date_of_birth) {
    return `${obj.year_of_birth} (${ageUnit(years, "years", true)})`;
  }

  const totalDays = differenceInDays(end, start);

  // > 18 years: years only
  if (years >= 18) {
    return ageUnit(years, "years", abbreviated);
  }

  // 2–18 years (inclusive): years and months
  if (years >= 2) {
    const remainingMonths = months - years * 12;
    const yearStr = ageUnit(years, "years", abbreviated);
    if (remainingMonths === 0) return yearStr;
    return `${yearStr} ${ageUnit(remainingMonths, "months", abbreviated)}`;
  }

  // 1–2 years (inclusive, i.e. 365 days to 2 years): months and days
  if (months >= 12) {
    const remainingDays = differenceInDays(end, addMonths(start, months));
    const monthStr = ageUnit(months, "months", abbreviated);
    if (remainingDays === 0) return monthStr;
    return `${monthStr} ${ageUnit(remainingDays, "days", abbreviated)}`;
  }

  // 29 days to < 12 months: weeks and days
  if (totalDays >= 29) {
    const weeks = Math.floor(totalDays / 7);
    const remainingDays = totalDays % 7;
    const weekStr = ageUnit(weeks, "weeks", abbreviated);
    if (remainingDays === 0) return weekStr;
    return `${weekStr} ${ageUnit(remainingDays, "days", abbreviated)}`;
  }

  // 0–28 days (inclusive): days only
  return ageUnit(totalDays, "days", abbreviated);
};

/**
 * Returns a verbose breakdown of a patient's age for use in tooltips.
 * Format: years/months/days breakdown, largest-unit-first, leading zero-units omitted.
 * Returns null if only year_of_birth is known (no date_of_birth).
 */
export const formatPatientAgeBreakdown = (
  obj: PatientRead | PatientListRead | PublicPatientRead,
): string | null => {
  if (!obj.date_of_birth) return null;

  const start = parseISO(obj.date_of_birth);
  const end =
    "deceased_datetime" in obj && obj.deceased_datetime
      ? parseISO(obj.deceased_datetime)
      : new Date();
  const years = Math.trunc(completedMonths(end, start) / 12);
  const afterYears = addYears(start, years);
  const months = completedMonths(end, afterYears);
  const days = differenceInDays(end, addMonths(afterYears, months));

  const parts: string[] = [];
  if (years > 0) parts.push(ageUnit(years, "years"));
  if (months > 0) parts.push(ageUnit(months, "months"));
  if (days > 0 || parts.length === 0) parts.push(ageUnit(days, "days"));

  return parts.join(", ");
};
