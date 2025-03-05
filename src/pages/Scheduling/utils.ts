import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

import { Time } from "@/Utils/types";
import {
  Appointment,
  ScheduleAvailability,
  ScheduleException,
} from "@/types/scheduling/schedule";

dayjs.extend(isBetween);

export const isDateInRange = (
  date: Date,
  startDate: string,
  endDate: string,
) => {
  const d = dayjs(date);
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  return d.isBetween(start, end, "day", "[]");
};

export function getDurationInMinutes(startTime: Time, endTime: Time) {
  const start = dayjs(`1970-01-01T${startTime}`);
  const end = dayjs(`1970-01-01T${endTime}`);
  if (!start.isValid() || !end.isValid()) {
    return null;
  }
  return end.diff(start, "minute");
}

type VirtualSlot = {
  start_time: Time;
  end_time: Time;
  isAvailable: boolean;
  exceptions: ScheduleException[];
};

export function computeAppointmentSlots(
  availability: ScheduleAvailability & { slot_type: "appointment" },
  exceptions: ScheduleException[],
  referenceDate: Date = new Date(),
) {
  const avail = availability.availability[0];
  const [sh, sm, ss] = avail.start_time.split(":").map(Number);
  const [eh, em, es] = avail.end_time.split(":").map(Number);
  const startTime = dayjs(referenceDate).hour(sh).minute(sm).second(ss);
  const endTime = dayjs(referenceDate).hour(eh).minute(em).second(es);
  const slotSizeInMinutes = availability.slot_size_in_minutes;
  const slots: VirtualSlot[] = [];

  let time = startTime;
  while (time.isBefore(endTime)) {
    const slotEndTime = time.add(slotSizeInMinutes, "minute");

    let conflicting = false;
    for (const exception of exceptions) {
      const [exh, exm, exs] = exception.start_time.split(":").map(Number);
      const [eeh, eem, ees] = exception.end_time.split(":").map(Number);
      const exceptionStartTime = dayjs(referenceDate)
        .hour(exh)
        .minute(exm)
        .second(exs);
      const exceptionEndTime = dayjs(referenceDate)
        .hour(eeh)
        .minute(eem)
        .second(ees);

      if (
        exceptionStartTime.isBefore(slotEndTime) &&
        exceptionEndTime.isAfter(time)
      ) {
        conflicting = true;
        break;
      }
    }

    if (!conflicting) {
      slots.push({
        start_time: time.format("HH:mm") as Time,
        end_time: slotEndTime.format("HH:mm") as Time,
        isAvailable: true,
        exceptions: [],
      });
    }

    time = slotEndTime;
  }

  return slots;
}

export function getSlotsPerSession(
  startTime: Time,
  endTime: Time,
  slotSizeInMinutes: number,
) {
  const duration = getDurationInMinutes(startTime, endTime);
  if (!duration) return null;
  const result = Math.floor(duration / slotSizeInMinutes);
  return result < 0 ? null : result;
}

export function getTokenDuration(
  slotSizeInMinutes: number,
  tokensPerSlot: number,
) {
  return slotSizeInMinutes / tokensPerSlot;
}

export const getDaysOfWeekFromAvailabilities = (
  availabilities: ScheduleAvailability[],
) => {
  return [
    ...new Set(
      availabilities.flatMap(({ availability }) => {
        return availability.map(({ day_of_week }) => day_of_week);
      }),
    ),
  ];
};

export const filterAvailabilitiesByDayOfWeek = (
  availabilities: ScheduleAvailability[],
  date?: Date,
) => {
  // Doing this weird things because backend uses python's 0-6.
  // TODO: change to strings at seriazlier level...? or bitwise operations?
  const dayOfWeek = ((date ?? new Date()).getDay() + 6) % 7;

  return availabilities.filter(({ availability }) =>
    availability.some((a) => a.day_of_week === dayOfWeek),
  );
};

/**
 * TODO: Remove this once we have token number generation system.
 * This is a temporary function to generate a fake token number for an appointment.
 */
export const getFakeTokenNumber = (appointment: Appointment) => {
  // Convert UUID to a number by summing char codes
  const hash = appointment.id
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Get a number between 10-99
  return (hash % 90) + 10;
};
