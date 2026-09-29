import { isBefore, isSameDay, parse } from "date-fns";

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

export function isScheduleStartTimeInFuture(
  date: Date,
  startTime: string,
  now = new Date(),
) {
  return !isSameDay(date, now) || isBefore(now, parse(startTime, "HH:mm", now));
}
