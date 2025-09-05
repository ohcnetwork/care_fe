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

interface DateSelectionProps {
  facilityId: string;
  resourceId: string;
  currentAppointment?: Appointment;
  setSelectedDate: (selectedDate: Date) => void;
  selectedDate?: Date;
  setSelectedMonth: (selectedMonth: Date) => void;
  selectedMonth: Date;
}

export const DateSelection = ({
  facilityId,
  resourceId,
  currentAppointment,
  setSelectedDate,
  selectedDate,
  selectedMonth,
  setSelectedMonth,
}: DateSelectionProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 w-full">
      {!resourceId ? (
        <span className="text-gray-950 font-medium">
          {t("choose_practitioner")}
        </span>
      ) : (
        <h4 className="sm:hidden">{t("select_date")}</h4>
      )}
      <Calendar
        month={selectedMonth}
        onMonthChange={(month) => {
          setSelectedMonth(month);
        }}
        setSelectedDate={setSelectedDate}
        renderDay={(date) => {
          return (
            <RenderDay
              date={date}
              facilityId={facilityId}
              resourceId={resourceId}
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

interface RenderDayProps {
  facilityId: string;
  resourceId: string;
  selectedDate?: Date;
  setSelectedDate: (date: Date) => void;
  date: Date;
  currentAppointment?: Appointment;
  selectedMonth: Date;
}

const RenderDay = ({
  date,
  facilityId,
  resourceId,
  selectedDate,
  setSelectedDate,
  currentAppointment,
  selectedMonth,
}: RenderDayProps) => {
  const isSelected = isSameDay(date, selectedDate ?? new Date());
  const isBeforeToday = isBefore(date, startOfToday());
  const { t } = useTranslation();

  const heatmapQuery = useAvailabilityHeatmap({
    facilityId,
    userId: resourceId,
    month: selectedMonth,
  });

  const slotsTodayQuery = useQuery({
    queryKey: ["slots", facilityId, resourceId, dateQueryString(new Date())],
    queryFn: query(scheduleApis.slots.getSlotsForDay, {
      pathParams: { facilityId },
      body: {
        resource_type: SchedulableResourceType.Practitioner,
        resource_id: resourceId,
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
          "h-full w-full hover:bg-gray-50 rounded-lg relative overflow-hidden border border-gray-200 cursor-not-allowed",
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
        "h-full w-full hover:bg-gray-50 rounded-lg relative overflow-hidden border-2 hover:scale-105 hover:shadow-md transition-all",
        isSelected ? "border-primary-500" : "border-gray-200",
        isFullyBooked ? "bg-gray-200" : "bg-white",
      )}
    >
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
