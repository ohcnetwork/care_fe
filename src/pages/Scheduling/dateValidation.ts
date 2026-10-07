import { format, isBefore, isValid, parse } from "date-fns";

import {
  facilityLocalDateQueryString,
  formatDateTimeInZone,
} from "@/Utils/date";

export function isScheduleTimeBefore(
  startTime: string | undefined,
  endTime: string | undefined,
) {
  // Recurring wall-clock ranges must not depend on today's DST transition.
  const referenceDate = new Date(2000, 0, 1);
  return isBefore(
    parse(startTime ?? "", "HH:mm", referenceDate),
    parse(endTime ?? "", "HH:mm", referenceDate),
  );
}

/** Compare a picked calendar day and HH:mm with `now` in `timeZone`. */
export function isScheduleStartTimeInFutureInZone(
  date: Date,
  startTime: string,
  timeZone: string,
  now: Date,
) {
  const parsedStart = parse(startTime, "HH:mm", new Date(2000, 0, 1));
  if (!isValid(parsedStart)) return false;
  const selectedDay = format(date, "yyyy-MM-dd");
  const clinicDay = facilityLocalDateQueryString(now, timeZone);
  if (selectedDay < clinicDay) return false;
  if (selectedDay > clinicDay) return true;
  const clinicTime = formatDateTimeInZone(now, timeZone, "HH:mm");
  return format(parsedStart, "HH:mm") > clinicTime;
}
