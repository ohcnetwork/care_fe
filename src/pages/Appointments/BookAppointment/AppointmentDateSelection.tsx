import { useQuery } from "@tanstack/react-query";
import { isBefore, isPast, isSameDay, isToday, startOfToday } from "date-fns";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import Calendar from "@/CAREUI/interactive/Calendar";

import query from "@/Utils/request/query";
import { dateQueryString } from "@/Utils/utils";
import { useAvailabilityHeatmap } from "@/pages/Appointments/utils";
import {
  Appointment,
  GetSlotsForDayResponse,
  SchedulableResourceType,
} from "@/types/scheduling/schedule";
import scheduleApis from "@/types/scheduling/scheduleApi";
import { useState } from "react";

interface AppointmentDateSelectionProps {
  facilityId: string;
  resourceId?: string;
  resourceType: SchedulableResourceType;
  currentAppointment?: Appointment;
  setSelectedDate: (selectedDate: Date) => void;
  selectedDate: Date;
}

export const AppointmentDateSelection = ({
  facilityId,
  resourceId,
  resourceType,
  currentAppointment,
  setSelectedDate,
  selectedDate,
}: AppointmentDateSelectionProps) => {
  const { t } = useTranslation();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  return (
    <div className="flex flex-col gap-3 md:min-w-121 lg:w-full">
      {!resourceId ? (
        <span className="text-gray-950 font-medium">
          {t("choose_resource")}
        </span>
      ) : (
        <h4 className="sm:hidden">{t("select_date")}</h4>
      )}
      <Calendar
        month={selectedMonth}
        onMonthChange={setSelectedMonth}
        setSelectedDate={setSelectedDate}
        renderDay={(date) => {
          return (
            <DateColumn
              date={date}
              facilityId={facilityId}
              resourceId={resourceId}
              resourceType={resourceType}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              currentAppointment={currentAppointment}
              selectedMonth={selectedMonth}
            />
          );
        }}
        highlightToday={false}
        className={cn(!resourceId && "opacity-50 pointer-events-none")}
      />
    </div>
  );
};

interface DateColumnProps {
  facilityId: string;
  resourceId?: string;
  selectedDate: Date;
  resourceType: SchedulableResourceType;
  setSelectedDate: (date: Date) => void;
  date: Date;
  currentAppointment?: Appointment;
  selectedMonth: Date;
}

const DateColumn = ({
  date,
  facilityId,
  resourceId,
  selectedDate,
  setSelectedDate,
  currentAppointment,
  selectedMonth,
  resourceType,
}: DateColumnProps) => {
  const isSelected = isSameDay(date, selectedDate ?? new Date());
  const isBeforeToday = isBefore(date, startOfToday());
  const { t } = useTranslation();

  const heatmapQuery = useAvailabilityHeatmap({
    facilityId,
    resourceId,
    month: selectedMonth,
    resourceType,
  });

  const slotsTodayQuery = useQuery({
    queryKey: ["slots", facilityId, resourceId, dateQueryString(new Date())],
    queryFn: query(scheduleApis.slots.getSlotsForDay, {
      pathParams: { facilityId },
      body: {
        resource_type: resourceType,
        resource_id: resourceId || "",
        day: dateQueryString(new Date()),
      },
    }),
    enabled: !!resourceId,
    select: (data: GetSlotsForDayResponse) => {
      if (currentAppointment) {
        return data.results.filter(
          (slot) => slot.id !== currentAppointment.token_slot.id,
        );
      }
      return data.results;
    },
  });

  const availability = (() => {
    // If the date is today and there are slots for today, ignore the heatmap
    // as the heatmap does not account for past slots and instead compute
    // the availability for the day based on the slots that are currently
    // available
    if (isToday(date) && slotsTodayQuery.data) {
      const slots = slotsTodayQuery.data.filter(
        (slot) => !isPast(slot.end_datetime),
      );
      return {
        booked_slots: slots.reduce((a, s) => a + s.allocated, 0),
        total_slots: slots.reduce(
          (acc, slot) => acc + slot.availability.tokens_per_slot,
          0,
        ),
      };
    }

    return heatmapQuery.data?.[dateQueryString(date)];
  })();

  if (
    heatmapQuery.isFetching ||
    !availability ||
    availability.total_slots === 0 ||
    isBeforeToday
  ) {
    return (
      <button
        disabled
        onClick={() => {
          setSelectedDate(date);
        }}
        className={cn(
          "h-full w-full hover:bg-gray-50 rounded-lg relative overflow-hidden cursor-not-allowed",
          isSelected ? "ring-2 ring-primary-500" : "",
        )}
      >
        <div className="relative z-10">
          <span>{date.getDate()}</span>
          {!heatmapQuery.isFetching && (
            <span className="text-xs text-gray-400 block">--</span>
          )}
        </div>
      </button>
    );
  }

  const { booked_slots, total_slots } = availability;
  const bookedPercentage = booked_slots / total_slots;
  const tokensLeft = total_slots - booked_slots;
  const isFullyBooked = tokensLeft <= 0;

  return (
    <button
      disabled={isBeforeToday || isFullyBooked}
      onClick={() => {
        setSelectedDate(date);
      }}
      className={cn(
        "h-full w-full hover:bg-gray-50 rounded-md relative overflow-hidden border hover:scale-105 hover:shadow-md transition-all",
        isSelected
          ? "border-2 border-primary-600 bg-green-50 hover:bg-green-50"
          : "border-gray-400",
        isFullyBooked && "bg-gray-200",
      )}
    >
      {isSelected && (
        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-1 rounded-b-sm bg-primary-600 z-20" />
      )}
      <div className="relative z-10">
        <span>{date.getDate()}</span>
        {Number.isFinite(tokensLeft) && (
          <span
            className={cn(
              "text-xs text-gray-500 block font-semibold",
              bookedPercentage >= 0.8
                ? "text-red-500"
                : bookedPercentage >= 0.5
                  ? "text-yellow-500"
                  : "text-primary-500",
            )}
          >
            {t("tokens_left", { count: tokensLeft })}
          </span>
        )}
      </div>
      {!isFullyBooked && (
        <div
          className={cn(
            "absolute bottom-0 left-0 w-full transition-all",
            bookedPercentage > 0.8
              ? "bg-red-100"
              : bookedPercentage > 0.5
                ? "bg-yellow-100"
                : "bg-primary-100",
          )}
          style={{ height: `${Math.min(bookedPercentage * 100, 100)}%` }}
        />
      )}
    </button>
  );
};
