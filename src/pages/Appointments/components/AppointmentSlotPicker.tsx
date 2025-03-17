import { useQuery } from "@tanstack/react-query";
import { format, isBefore, isSameDay, startOfToday } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import Calendar from "@/CAREUI/interactive/Calendar";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import query from "@/Utils/request/query";
import { dateQueryString } from "@/Utils/utils";
import {
  groupSlotsByAvailability,
  useAvailabilityHeatmap,
} from "@/pages/Appointments/utils";
import { TokenSlot } from "@/types/scheduling/schedule";
import scheduleApis from "@/types/scheduling/scheduleApi";

interface AppointmentSlotPickerProps {
  facilityId: string;
  resourceId?: string;
  onSlotSelect: (slotId: string | undefined) => void;
  selectedSlotId?: string;
  onSlotDetailsChange?: (slot: TokenSlot) => void;
}

export function AppointmentSlotPicker({
  facilityId,
  resourceId,
  onSlotSelect,
  selectedSlotId,
  onSlotDetailsChange,
}: AppointmentSlotPickerProps) {
  const { t } = useTranslation();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const heatmapQuery = useAvailabilityHeatmap({
    facilityId,
    userId: resourceId,
    month: selectedMonth,
  });

  const slotsQuery = useQuery({
    queryKey: ["slots", facilityId, resourceId, dateQueryString(selectedDate)],
    queryFn: query(scheduleApis.slots.getSlotsForDay, {
      pathParams: { facility_id: facilityId },
      body: {
        user: resourceId ?? "",
        day: dateQueryString(selectedDate),
      },
    }),
    enabled: !!resourceId && !!selectedDate,
  });

  // Update slot details when a slot is selected
  const handleSlotSelect = (slotId: string | undefined) => {
    onSlotSelect(slotId);
    if (slotId && onSlotDetailsChange) {
      const allSlots = slotsQuery.data?.results || [];
      const selectedSlot = allSlots.find((slot) => slot.id === slotId);

      if (selectedSlot) {
        onSlotDetailsChange(selectedSlot);
      }
    }
  };

  const renderDay = (date: Date) => {
    const isSelected = isSameDay(date, selectedDate);
    const isBeforeToday = isBefore(date, startOfToday());
    const availability = heatmapQuery.data?.[dateQueryString(date)];

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
            "h-full w-full hover:bg-gray-50 rounded-lg relative overflow-hidden border border-gray-200",
            isSelected ? "ring-2 ring-primary-500" : "",
          )}
        >
          <div className="relative z-10">
            <span>{date.getDate()}</span>
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
              {tokensLeft} left
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

  return (
    <>
      <div>
        <Calendar
          month={selectedMonth}
          onMonthChange={(month) => {
            setSelectedMonth(month);
          }}
          renderDay={renderDay}
          className="mb-6"
          highlightToday={false}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">{t("available_time_slots")}</h3>
        </div>
        {slotsQuery.isFetching ? (
          <div className="flex flex-wrap gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-20" />
            ))}
          </div>
        ) : (
          <ScrollArea>
            <div className="max-h-96">
              {slotsQuery.data == null && (
                <div className="flex items-center justify-center py-32 border-2 border-gray-200 border-dashed rounded-lg text-center">
                  <p className="text-gray-400">
                    {t("to_view_available_slots_select_resource_and_date")}
                  </p>
                </div>
              )}
              {slotsQuery.data?.results.length === 0 && (
                <div className="flex items-center justify-center py-32 border-2 border-gray-200 border-dashed rounded-lg text-center">
                  <p className="text-gray-400">
                    {t("no_slots_available_for_this_date")}
                  </p>
                </div>
              )}
              {!!slotsQuery.data?.results.length &&
                groupSlotsByAvailability(slotsQuery.data.results).map(
                  ({ availability, slots }) => (
                    <div key={availability.name}>
                      <h4 className="text-lg font-semibold mb-3">
                        {availability.name}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {slots.map((slot) => (
                          <TokenSlotButton
                            key={slot.id}
                            slot={slot}
                            availability={availability}
                            selectedSlotId={selectedSlotId}
                            onClick={() => {
                              handleSlotSelect(
                                selectedSlotId === slot.id
                                  ? undefined
                                  : slot.id,
                              );
                            }}
                            selectedDate={selectedDate}
                          />
                        ))}
                      </div>
                      <Separator className="my-6" />
                    </div>
                  ),
                )}
            </div>
          </ScrollArea>
        )}
      </div>
    </>
  );
}

export const TokenSlotButton = ({
  slot,
  availability,
  selectedSlotId,
  onClick,
  selectedDate,
}: {
  slot: Omit<TokenSlot, "availability">;
  availability: TokenSlot["availability"];
  selectedSlotId: string | undefined;
  onClick: () => void;
  selectedDate: Date;
}) => {
  const percentage = slot.allocated / availability.tokens_per_slot;
  const isPastSlot =
    isSameDay(selectedDate, new Date()) &&
    isBefore(slot.start_datetime, new Date());

  return (
    <Button
      key={slot.id}
      size="lg"
      variant={selectedSlotId === slot.id ? "primary" : "outline"}
      onClick={onClick}
      disabled={slot.allocated === availability.tokens_per_slot || isPastSlot}
      className="flex flex-col items-center group gap-0 w-24"
    >
      <span className="font-semibold">
        {format(slot.start_datetime, "HH:mm")}
      </span>
      <span
        className={cn(
          "text-xs group-hover:text-inherit",
          percentage >= 1
            ? "text-gray-400"
            : percentage >= 0.8
              ? "text-red-600"
              : percentage >= 0.6
                ? "text-yellow-600"
                : "text-green-600",
          selectedSlotId === slot.id && "text-white",
        )}
      >
        {availability.tokens_per_slot - slot.allocated} left
      </span>
    </Button>
  );
};
