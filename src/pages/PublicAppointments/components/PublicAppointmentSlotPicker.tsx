import { useQuery } from "@tanstack/react-query";
import { format, isBefore, isSameDay } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import Calendar from "@/CAREUI/interactive/Calendar";

import { Button } from "@/components/ui/button";

import { usePatientContext } from "@/hooks/usePatientUser";

import query from "@/Utils/request/query";
import { dateQueryString } from "@/Utils/utils";
import { groupSlotsByAvailability } from "@/pages/Appointments/utils";
import PublicAppointmentApi from "@/types/scheduling/PublicAppointmentApi";
import { TokenSlot } from "@/types/scheduling/schedule";

interface PublicAppointmentSlotPickerProps {
  facilityId: string;
  staffId: string;
  onSlotSelect: (slot: TokenSlot | undefined) => void;
  selectedSlot?: TokenSlot;
}

export function PublicAppointmentSlotPicker({
  facilityId,
  staffId,
  onSlotSelect,
  selectedSlot,
}: PublicAppointmentSlotPickerProps) {
  const { t } = useTranslation();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const patientUserContext = usePatientContext();
  const tokenData = patientUserContext?.tokenData;

  const slotsQuery = useQuery<{ results: TokenSlot[] }>({
    queryKey: ["slots", facilityId, staffId, selectedDate],
    queryFn: query(PublicAppointmentApi.getSlotsForDay, {
      body: {
        facility: facilityId,
        user: staffId,
        day: dateQueryString(selectedDate),
      },
      headers: {
        Authorization: `Bearer ${tokenData.token}`,
      },
      silent: true,
    }),
    enabled: !!selectedDate && !!tokenData.token,
  });

  if (slotsQuery.error) {
    if (
      slotsQuery.error.cause?.errors &&
      Array.isArray(slotsQuery.error.cause.errors) &&
      slotsQuery.error.cause.errors[0][0] === "Resource is not schedulable"
    ) {
      toast.error(t("user_not_available_for_appointments"));
    } else {
      toast.error(t("error_fetching_slots_data"));
    }
  }

  const renderDay = (date: Date) => {
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

  return (
    <>
      <Calendar
        month={selectedMonth}
        onMonthChange={setSelectedMonth}
        renderDay={renderDay}
        highlightToday={false}
      />
      <div className="space-y-6">
        {slotsQuery.data?.results && slotsQuery.data.results.length > 0 ? (
          groupSlotsByAvailability(slotsQuery.data.results).map(
            ({ availability, slots }) => (
              <div key={availability.name}>
                <h4 className="text-lg font-semibold my-3">
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
                          selectedSlot?.id === slot.id ? "primary" : "outline"
                        }
                        onClick={() => {
                          onSlotSelect(
                            selectedSlot?.id === slot.id
                              ? undefined
                              : { ...slot, availability: availability },
                          );
                        }}
                        disabled={
                          slot.allocated === availability.tokens_per_slot ||
                          isPastSlot
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
                          {availability.tokens_per_slot - slot.allocated}
                          {t("left")}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            ),
          )
        ) : (
          <div className="flex  justify-center w-full rounded-sm shadow-md my-4 h-32 items-center">
            {t("no_slots_available")}
          </div>
        )}
      </div>
    </>
  );
}
