/* eslint-disable */
import { useQuery } from "@tanstack/react-query";
import { format, isBefore, isSameDay, startOfToday } from "date-fns";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import Calendar from "@/CAREUI/interactive/Calendar";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { usePatientContext } from "@/hooks/usePatientUser";

import query from "@/Utils/request/query";
import { dateQueryString } from "@/Utils/utils";
import {
  groupSlotsByAvailability,
  useAvailabilityHeatmap,
} from "@/pages/Appointments/utils";
import PublicAppointmentApi from "@/types/scheduling/PublicAppointmentApi";
import { TokenSlot } from "@/types/scheduling/schedule";
import scheduleApis from "@/types/scheduling/scheduleApis";

interface AppointmentSlotPickerProps {
  facilityId: string;
  staffId?: string;
  resourceId?: string;
  onSlotSelect: (slot: TokenSlot | undefined) => void;
  selectedSlot?: TokenSlot;
}

export function AppointmentSlotPicker({
  facilityId,
  staffId,
  resourceId,
  onSlotSelect,
  selectedSlot,
}: AppointmentSlotPickerProps) {
  const { t } = useTranslation();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const heatmapQuery = useAvailabilityHeatmap({
    facilityId,
    userId: resourceId,
    month: selectedMonth,
  });

  let renderDay: (date: Date) => React.ReactNode = () => null;

  const slotsQuery = useQuery<{ results: TokenSlot[] }>({
    queryKey: resourceId
      ? ["slots", facilityId, resourceId, dateQueryString(selectedDate)]
      : staffId
        ? ["slots", facilityId, staffId, selectedDate]
        : [],
    queryFn: resourceId
      ? query(scheduleApis.slots.getSlotsForDay, {
          pathParams: { facility_id: facilityId },
          body: {
            user: resourceId ?? "",
            day: dateQueryString(selectedDate),
          },
        })
      : staffId
        ? query(PublicAppointmentApi.getSlotsForDay, {
            body: {
              facility: facilityId,
              user: staffId || "",
              day: dateQueryString(selectedDate),
            },
            headers: {
              Authorization: `Bearer ${usePatientContext()?.tokenData.token}`,
            },
            silent: true,
          })
        : async () => ({ results: [] }),
    enabled:
      !!selectedDate &&
      (!!resourceId || (!!staffId && !!usePatientContext()?.tokenData.token)),
  });

  if (slotsQuery.error) {
    if (
      slotsQuery.error instanceof Error &&
      slotsQuery.error.cause &&
      typeof slotsQuery.error.cause === "object" &&
      "errors" in slotsQuery.error.cause &&
      Array.isArray(slotsQuery.error.cause.errors) &&
      slotsQuery.error.cause.errors[0][0] === "Resource is not schedulable"
    ) {
      toast.error(t("user_not_available_for_appointments"));
    } else {
      toast.error(t("error_fetching_slots_data"));
    }
  }

  if (resourceId) {
    renderDay = (date: Date) => {
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
              onSlotSelect(undefined);
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
            onSlotSelect(undefined);
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
                {tokensLeft} {t("left")}
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
  }

  if (staffId) {
    renderDay = (date: Date) => {
      const isSelected = date.toDateString() === selectedDate?.toDateString();

      return (
        <button
          onClick={() => setSelectedDate(date)}
          className={cn(
            "h-full w-full hover:bg-gray-50 rounded-lg",
            isSelected ? "bg-white ring-2 ring-primary-500" : "bg-gray-100",
          )}
        >
          <span>{date.getDate()}</span>
        </button>
      );
    };
  }

  return (
    <>
      <div>
        <Calendar
          month={selectedMonth}
          onMonthChange={(month) => {
            setSelectedMonth(month);
            onSlotSelect(undefined);
          }}
          renderDay={renderDay}
          className="mb-6"
          highlightToday={false}
        />
      </div>

      <div>
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">{t("available_time_slots")}</h3>
          </div>
          <ScrollArea>
            <div className="max-h-96">
              {!slotsQuery?.data && (
                <div className="flex items-center justify-center py-32 border-2 border-gray-200 border-dashed rounded-lg text-center">
                  <p className="text-gray-400">
                    {t("to_view_available_slots_select_resource_and_date")}
                  </p>
                </div>
              )}
              {slotsQuery?.data?.results.length === 0 && (
                <div className="flex items-center justify-center py-32 border-2 border-gray-200 border-dashed rounded-lg text-center">
                  <p className="text-gray-400">
                    {t("no_slots_available_for_this_date")}
                  </p>
                </div>
              )}
              {!!slotsQuery?.data?.results.length &&
                groupSlotsByAvailability(slotsQuery.data.results).map(
                  ({ availability, slots }) => (
                    <div key={availability.name}>
                      <h4 className="text-lg font-semibold mb-3">
                        {availability.name}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {slots.map((slot) => {
                          const percentage =
                            slot.allocated / availability.tokens_per_slot;
                          const isPastSlot =
                            isSameDay(selectedDate, new Date()) &&
                            isBefore(slot.start_datetime, new Date());

                          return (
                            <Button
                              key={slot.id}
                              size="lg"
                              variant={
                                selectedSlot?.id === slot.id
                                  ? "primary"
                                  : "outline"
                              }
                              onClick={() => {
                                onSlotSelect(
                                  selectedSlot?.id === slot.id
                                    ? undefined
                                    : { ...slot, availability: availability },
                                );
                              }}
                              disabled={
                                slot.allocated ===
                                  availability.tokens_per_slot || isPastSlot
                              }
                              className="flex flex-col items-center group gap-0 w-24 shrink-0"
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
                                  selectedSlot?.id === slot.id && "text-white",
                                )}
                              >
                                {availability.tokens_per_slot - slot.allocated}{" "}
                                {t("left")}
                              </span>
                            </Button>
                          );
                        })}
                      </div>
                      <Separator className="my-6" />
                    </div>
                  ),
                )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  );
}
