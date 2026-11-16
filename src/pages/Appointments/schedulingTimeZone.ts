/**
 * Appointments are clinic-timezone first: Today/defaults/filter dates and card
 * times use schedulingTimeZone (default Asia/Kolkata). Plain yyyy-MM-dd still
 * goes to the API; those strings mean clinic calendar days, not viewer locale.
 */
import { addDays, subDays } from "date-fns";

import careConfig from "@careConfig";

import type { DateLike } from "@/Utils/date";
import {
  facilityLocalDateQueryString,
  formatDateTimeInZone,
  parseDate,
  parseLocalDate,
} from "@/Utils/date";
import type { DateRangeOption } from "@/components/ui/multi-filter/utils/Utils";

export function getAppointmentsSchedulingTimeZone(): string {
  return careConfig.appointments.schedulingTimeZone;
}

/** Clinic calendar day as yyyy-MM-dd (not the viewer's locale day). */
export function getClinicTodayYmd(
  timeZone: string = getAppointmentsSchedulingTimeZone(),
  at: Date = new Date(),
): string {
  return facilityLocalDateQueryString(at, timeZone);
}

/** Local-midnight Date for clinic today — safe for isSameDay with calendar cells. */
export function getClinicTodayDate(
  timeZone: string = getAppointmentsSchedulingTimeZone(),
  at: Date = new Date(),
): Date {
  return parseLocalDate(getClinicTodayYmd(timeZone, at))!;
}

/** Calendar chip for an instant's clinic calendar day (e.g. existing appointment slot). */
export function getClinicDateFromInstant(
  date: DateLike,
  timeZone: string = getAppointmentsSchedulingTimeZone(),
): Date {
  return parseLocalDate(
    facilityLocalDateQueryString(parseDate(date), timeZone),
  )!;
}

/**
 * A stored schedule bound is either a clinic calendar day (`yyyy-MM-dd`) or a
 * real instant. Both become the clinic yyyy-MM-dd, so a date-only string is
 * not re-read as UTC midnight.
 */
export function clinicCalendarYmd(
  value: string,
  timeZone: string = getAppointmentsSchedulingTimeZone(),
): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return facilityLocalDateQueryString(value, timeZone);
}

/** Local-midnight label for a clinic calendar day or a stored instant. */
export function clinicCalendarDate(
  value: string,
  timeZone: string = getAppointmentsSchedulingTimeZone(),
): Date {
  return parseLocalDate(clinicCalendarYmd(value, timeZone))!;
}

/**
 * Presets relative to clinic "today" (as local-midnight Date labels) so the
 * pill matches URL clinic days via isSameDay — not browser new Date().
 */
export function getClinicShortDateRangeOptions(
  timeZone: string = getAppointmentsSchedulingTimeZone(),
  at: Date = new Date(),
): DateRangeOption[] {
  const clinicToday = parseLocalDate(
    facilityLocalDateQueryString(at, timeZone),
  )!;

  return [
    {
      label: "last_week",
      getDateRange: () => ({
        from: subDays(clinicToday, 7),
        to: clinicToday,
      }),
    },
    {
      label: "yesterday",
      getDateRange: () => ({
        from: subDays(clinicToday, 1),
        to: subDays(clinicToday, 1),
      }),
    },
    {
      label: "today",
      getDateRange: () => ({
        from: clinicToday,
        to: clinicToday,
      }),
    },
    {
      label: "tomorrow",
      getDateRange: () => ({
        from: addDays(clinicToday, 1),
        to: addDays(clinicToday, 1),
      }),
    },
    {
      label: "next_week",
      getDateRange: () => ({
        from: clinicToday,
        to: addDays(clinicToday, 7),
      }),
    },
    {
      label: "next_month",
      getDateRange: () => ({
        from: clinicToday,
        to: addDays(clinicToday, 30),
      }),
    },
  ];
}

/** Browser IANA timezone when available (undefined in non-Intl environments). */
export function getUserTimeZone(): string | undefined {
  if (typeof Intl === "undefined") return undefined;
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** True when `tz1` and `tz2` show the same local date and time for `at`. */
export function timeZonesMatchForInstant(
  at: Date,
  tz1: string,
  tz2: string,
): boolean {
  return (
    facilityLocalDateQueryString(at, tz1) ===
      facilityLocalDateQueryString(at, tz2) &&
    formatDateTimeInZone(at, tz1, "HH:mm") ===
      formatDateTimeInZone(at, tz2, "HH:mm")
  );
}

/**
 * General notices compare timezone identities, resolving aliases such as
 * Asia/Calcutta and Asia/Kolkata. For a specific instant, compare clock displays.
 */
export function shouldShowSchedulingTimeZoneHint(
  schedulingTimeZone: string,
  userTimeZone: string | undefined = getUserTimeZone(),
  at?: Date,
): boolean {
  if (!userTimeZone) return false;
  if (userTimeZone === schedulingTimeZone) return false;
  if (at) {
    return !timeZonesMatchForInstant(at, userTimeZone, schedulingTimeZone);
  }
  return (
    new Intl.DateTimeFormat("en-US", {
      timeZone: userTimeZone,
    }).resolvedOptions().timeZone !==
    new Intl.DateTimeFormat("en-US", {
      timeZone: schedulingTimeZone,
    }).resolvedOptions().timeZone
  );
}

/** Prefer common abbreviations; Intl often returns "GMT+5:30" for Kolkata. */
const PREFERRED_TIME_ZONE_ABBREVIATIONS: Record<string, string> = {
  "Asia/Kolkata": "IST",
  "Asia/Calcutta": "IST",
};

/** Short label like "IST" for the scheduling timezone. */
export function getSchedulingTimeZoneAbbreviation(
  timeZone: string = getAppointmentsSchedulingTimeZone(),
  at: Date = new Date(),
): string {
  const preferred = PREFERRED_TIME_ZONE_ABBREVIATIONS[timeZone];
  if (preferred) return preferred;
  if (typeof Intl === "undefined") return timeZone;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "short",
  }).formatToParts(at);
  return parts.find((part) => part.type === "timeZoneName")?.value ?? timeZone;
}

/**
 * Optional clinic timezone suffix with a leading space. Dated appointments use
 * the instant's abbreviation; undated schedules use a stable IANA timezone name.
 */
export function getSchedulingTimeZoneSuffix(
  schedulingTimeZone: string = getAppointmentsSchedulingTimeZone(),
  at?: Date,
  userTimeZone: string | undefined = getUserTimeZone(),
): string {
  if (!shouldShowSchedulingTimeZoneHint(schedulingTimeZone, userTimeZone, at)) {
    return "";
  }
  const label = at
    ? getSchedulingTimeZoneAbbreviation(schedulingTimeZone, at)
    : schedulingTimeZone;
  return ` ${label}`;
}

/** Clinic-zone datetime plus optional TZ suffix when the viewer differs. */
export function formatSchedulingDateTime(
  date: DateLike,
  pattern: string,
  schedulingTimeZone: string = getAppointmentsSchedulingTimeZone(),
  userTimeZone: string | undefined = getUserTimeZone(),
): string {
  const at = parseDate(date);
  return `${formatDateTimeInZone(
    date,
    schedulingTimeZone,
    pattern,
  )}${getSchedulingTimeZoneSuffix(schedulingTimeZone, at, userTimeZone)}`;
}

/** Clinic-zone start–end range plus optional TZ suffix when the viewer differs. */
export function formatSchedulingTimeRange(
  start: DateLike,
  end: DateLike,
  pattern: string = "h:mm a",
  schedulingTimeZone: string = getAppointmentsSchedulingTimeZone(),
  userTimeZone: string | undefined = getUserTimeZone(),
): string {
  const at = parseDate(start);
  return `${formatDateTimeInZone(
    start,
    schedulingTimeZone,
    pattern,
  )} - ${formatDateTimeInZone(
    end,
    schedulingTimeZone,
    pattern,
  )}${getSchedulingTimeZoneSuffix(schedulingTimeZone, at, userTimeZone)}`;
}
