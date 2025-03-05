import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";

import query from "@/Utils/request/query";
import { dateQueryString, getMonthStartAndEnd } from "@/Utils/utils";
import {
  Appointment,
  AvailabilityHeatmapResponse,
  TokenSlot,
} from "@/types/scheduling/schedule";
import scheduleApis from "@/types/scheduling/scheduleApi";

function eachDayOfInterval({ start, end }: { start: Date; end: Date }): Date[] {
  const dates: Date[] = [];
  let current = dayjs(start).startOf("day");
  const last = dayjs(end).startOf("day");
  while (current.isBefore(last) || current.isSame(last)) {
    dates.push(current.toDate());
    current = current.add(1, "day");
  }
  return dates;
}

export const groupSlotsByAvailability = (slots: TokenSlot[]) => {
  const result: {
    availability: TokenSlot["availability"];
    slots: Omit<TokenSlot, "availability">[];
  }[] = [];

  for (const slot of slots) {
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
    slots.sort((a, b) => dayjs(a.start_datetime).diff(dayjs(b.start_datetime))),
  );

  // sort availability by first slot start time
  result.sort((a, b) =>
    dayjs(a.slots[0].start_datetime).diff(dayjs(b.slots[0].start_datetime)),
  );

  return result;
};

/**
 * Get the availability heatmap for a user for a given month
 */
export const useAvailabilityHeatmap = ({
  facilityId,
  userId,
  month,
}: {
  facilityId: string;
  userId?: string;
  month: Date;
}) => {
  const { start, end } = getMonthStartAndEnd(month);

  // start from today if the month is current or past
  const today = dayjs().startOf("day").toDate();
  const fromDateObj = new Date(Math.max(start.getTime(), today.getTime()));
  const fromDate = dateQueryString(fromDateObj);
  const toDate = dateQueryString(end);

  let queryFn = query(scheduleApis.slots.availabilityStats, {
    pathParams: { facility_id: facilityId },
    body: {
      // voluntarily coalesce to empty string since we know query would be
      // enabled only if userId is present
      user: userId ?? "",
      from_date: fromDate,
      to_date: toDate,
    },
  });

  if (careConfig.appointments.useAvailabilityStatsAPI === false) {
    queryFn = async () => getInfiniteAvailabilityHeatmap({ fromDate, toDate });
  }

  return useQuery({
    queryKey: ["availabilityHeatmap", userId, fromDate, toDate],
    queryFn,
    enabled: !!userId,
  });
};

const getInfiniteAvailabilityHeatmap = ({
  fromDate,
  toDate,
}: {
  fromDate: string;
  toDate: string;
}) => {
  const startDate = new Date(fromDate);
  const endDate = new Date(toDate);
  const dates = eachDayOfInterval({ start: startDate, end: endDate });

  const result: AvailabilityHeatmapResponse = {};

  for (const date of dates) {
    result[dateQueryString(date)] = { total_slots: Infinity, booked_slots: 0 };
  }

  return result;
};

export const formatAppointmentSlotTime = (appointment: Appointment) => {
  if (!appointment.token_slot?.start_datetime) {
    return "";
  }
  return dayjs(appointment.token_slot.start_datetime).format(
    "DD MMM, YYYY, hh:mm A",
  );
};

export const formatSlotTimeRange = (slot: {
  start_datetime: string;
  end_datetime: string;
}) => {
  return `${dayjs(slot.start_datetime).format("h:mm A")} - ${dayjs(slot.end_datetime).format("h:mm A")}`;
};
