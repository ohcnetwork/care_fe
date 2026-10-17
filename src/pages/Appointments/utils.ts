import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { compareAsc, eachDayOfInterval, isPast } from "date-fns";

import query from "@/Utils/request/query";
import { dateQueryString, getMonthStartAndEnd } from "@/Utils/utils";
import {
  formatSchedulingDateTime,
  formatSchedulingTimeRange,
  getClinicTodayYmd,
} from "@/pages/Appointments/schedulingTimeZone";
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

  // Clinic "today" — not the viewer's locale day (Sensors / travel TZ).
  const clinicTodayYmd = getClinicTodayYmd();
  const monthStartYmd = dateQueryString(start);
  const fromDate =
    monthStartYmd < clinicTodayYmd ? clinicTodayYmd : monthStartYmd;

  // ensure toDate is not before fromDate
  const monthEndYmd = dateQueryString(end);
  const toDate = monthEndYmd < fromDate ? fromDate : monthEndYmd;

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
  return formatSchedulingDateTime(
    appointment.token_slot.start_datetime,
    "dd MMM, yyyy, hh:mm a",
  );
};

export const formatSlotTimeRange = (slot: {
  start_datetime: string;
  end_datetime: string;
}) =>
  formatSchedulingTimeRange(slot.start_datetime, slot.end_datetime, "h:mm a");
