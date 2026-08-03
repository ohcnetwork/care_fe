import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import {
  compareAsc,
  eachDayOfInterval,
  format,
  isPast,
  max,
  startOfToday,
} from "date-fns";

import query from "@/Utils/request/query";
import { dateQueryString, getMonthStartAndEnd } from "@/Utils/utils";
import {
  AvailabilityHeatmapResponse,
  PublicAppointment,
  SchedulableResourceType,
  TokenSlot,
} from "@/types/scheduling/schedule";
import scheduleApis from "@/types/scheduling/scheduleApi";

export const getUniqueSchedulesFromSlots = (slots: TokenSlot[]) => {
  const scheduleMap = new Map<string, TokenSlot["availability"]["schedule"]>();

  for (const slot of slots) {
    const schedule = slot.availability.schedule;
    if (!scheduleMap.has(schedule.id)) {
      scheduleMap.set(schedule.id, schedule);
    }
  }

  // Sort by schedule name
  return Array.from(scheduleMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
};

export const groupSlotsByAvailability = (slots: TokenSlot[]) => {
  const result: {
    availability: TokenSlot["availability"];
    slots: Omit<TokenSlot, "availability">[];
  }[] = [];

  for (const slot of slots) {
    // skip past slots
    if (isPast(slot.end_datetime)) {
      continue;
    }
    // skip fully allocated slots
    if (slot.allocated === slot.availability.tokens_per_slot) {
      continue;
    }
    const availability = slot.availability;
    const existing = result.find(
      (r) => r.availability.name === availability.name,
    );
    if (existing) {
      existing.slots.push(slot);
    } else {
      result.push({ availability, slots: [slot] });
    }
  }

  // sort slots by start time
  result.forEach(({ slots }) =>
    slots.sort((a, b) => compareAsc(a.start_datetime, b.start_datetime)),
  );

  // sort availability by first slot start time
  result.sort((a, b) =>
    compareAsc(a.slots[0].start_datetime, b.slots[0].start_datetime),
  );

  return result;
};

/**
 * Get the availability heatmap for a user for a given month
 */
export const useAvailabilityHeatmap = ({
  facilityId,
  resourceId,
  month,
  resourceType,
}: {
  facilityId: string;
  resourceId?: string;
  month: Date;
  resourceType: SchedulableResourceType;
}) => {
  const { start, end } = getMonthStartAndEnd(month);

  // start from today if the month is current or past
  const fromDate = dateQueryString(max([start, startOfToday()]));

  // ensure toDate is not before fromDate
  const toDate = dateQueryString(max([fromDate, end]));

  let queryFn = query(scheduleApis.slots.availabilityStats, {
    pathParams: { facilityId },
    body: {
      // voluntarily coalesce to empty string since we know query would be
      // enabled only if userId is present
      resource_type: resourceType,
      resource_id: resourceId ?? "",
      from_date: fromDate,
      to_date: toDate,
    },
    silent: true,
  });

  if (careConfig.appointments.useAvailabilityStatsAPI === false) {
    queryFn = async () => getInfiniteAvailabilityHeatmap({ fromDate, toDate });
  }

  return useQuery({
    queryKey: ["availabilityHeatmap", resourceId, fromDate, toDate],
    queryFn,
    enabled: !!resourceId,
  });
};

const getInfiniteAvailabilityHeatmap = ({
  fromDate,
  toDate,
}: {
  fromDate: string;
  toDate: string;
}) => {
  const dates = eachDayOfInterval({ start: fromDate, end: toDate });

  const result: AvailabilityHeatmapResponse = {};

  for (const date of dates) {
    result[dateQueryString(date)] = { total_slots: Infinity, booked_slots: 0 };
  }

  return result;
};

export const formatAppointmentSlotTime = (appointment: PublicAppointment) => {
  if (!appointment.token_slot?.start_datetime) {
    return "";
  }
  return format(appointment.token_slot.start_datetime, "dd MMM, yyyy, hh:mm a");
};

export const formatSlotTimeRange = (slot: {
  start_datetime: string;
  end_datetime: string;
}) => {
  return `${format(slot.start_datetime, "h:mm a")} - ${format(
    slot.end_datetime,
    "h:mm a",
  )}`;
};

/** UTC ICS timestamp — slot datetimes are absolute instants, not floating times. */
const icsStamp = (value: string | Date) =>
  new Date(value)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

/** RFC 5545 requires these characters to be escaped within text values. */
const icsText = (value: string) =>
  value.replace(/[\\;,]/g, (char) => `\\${char}`).replace(/\n/g, "\\n");

export const buildAppointmentCalendarFile = (
  appointment: PublicAppointment,
  title: string,
) => {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//care//appointment//EN",
    "BEGIN:VEVENT",
    `UID:${appointment.id}`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(appointment.token_slot.start_datetime)}`,
    `DTEND:${icsStamp(appointment.token_slot.end_datetime)}`,
    `SUMMARY:${icsText(title)}`,
    `LOCATION:${icsText(appointment.facility.name)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(
    lines.join("\r\n"),
  )}`;
};
