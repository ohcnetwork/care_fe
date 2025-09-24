import { useQuery } from "@tanstack/react-query";
import { format, isWithinInterval } from "date-fns";
import { ClipboardCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import query from "@/Utils/request/query";
import { dateQueryString } from "@/Utils/utils";
import { groupSlotsByAvailability } from "@/pages/Appointments/utils";
import {
  Appointment,
  GetSlotsForDayResponse,
  SchedulableResourceType,
  TokenSlot,
} from "@/types/scheduling/schedule";
import scheduleApi from "@/types/scheduling/scheduleApi";
import { useEffect } from "react";

interface AppointmentSlotPickerProps {
  facilityId: string;
  resourceId?: string;
  onSlotSelect: (slotId: string | undefined) => void;
  selectedSlotId?: string;
  onSlotDetailsChange?: (slot: TokenSlot) => void;
  currentAppointment?: Appointment;
  selectedDate: Date;
  resourceType: SchedulableResourceType;
}

export function AppointmentSlotPicker({
  facilityId,
  resourceId,
  onSlotSelect,
  selectedSlotId,
  onSlotDetailsChange,
  currentAppointment,
  selectedDate,
  resourceType,
}: AppointmentSlotPickerProps) {
  const { t } = useTranslation();

  const slotsQuery = useQuery({
    queryKey: ["slots", facilityId, resourceId, dateQueryString(selectedDate)],
    queryFn: query(scheduleApi.slots.getSlotsForDay, {
      pathParams: { facilityId },
      body: {
        resource_type: resourceType,
        resource_id: resourceId ?? "",
        day: dateQueryString(selectedDate),
      },
    }),
    enabled: !!resourceId && !!selectedDate,
    select: (data: GetSlotsForDayResponse) => {
      if (currentAppointment) {
        return data.results.filter(
          (slot) => slot.id !== currentAppointment.token_slot.id,
        );
      }
      return data.results;
    },
  });

  // Update slot details when a slot is selected
  const handleSlotSelect = (slotId: string | undefined) => {
    onSlotSelect(slotId);
    if (slotId && onSlotDetailsChange) {
      const allSlots = slotsQuery.data || [];
      const selectedSlot = allSlots.find((slot) => slot.id === slotId);

      if (selectedSlot) {
        onSlotDetailsChange(selectedSlot);
      }
    }
  };

  useEffect(() => {
    onSlotSelect(undefined);
  }, [selectedDate]);

  const totalSlots = groupSlotsByAvailability(slotsQuery.data || []).flatMap(
    (group) => group.slots,
  ).length;

  return (
    <div
      className={cn(
        "sm:flex flex-col gap-3 w-full overflow-y-auto",
        !resourceId && "opacity-50 pointer-events-none",
      )}
    >
      <div className="hidden sm:flex sm:justify-between items-center lg:flex-col xl:flex-row lg:gap-1 xl:justify-between">
        <span className="font-semibold text-gray-950 text-base">
          {format(selectedDate, "MMMM d yyyy")}
        </span>
        {!!slotsQuery.data?.length && (
          <span className="text-sm font-medium text-gray-700">
            {totalSlots} {t("available_time_slots")}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2 sm:hidden">
        <span className="font-semibold text-lg text-gray-950 mb-2">
          {format(selectedDate, "MMMM d yyyy")}
        </span>
        <div className="mb-2">
          {!!slotsQuery.data?.length && (
            <span className="text-sm font-medium text-gray-700">
              {slotsQuery.data?.length} {t("available_time_slots")}
            </span>
          )}
        </div>
      </div>
      <div className="border-b border-gray-200 w-full" />
      {slotsQuery.isFetching ? (
        <div className="flex flex-wrap gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-20" />
          ))}
        </div>
      ) : (
        <div>
          {slotsQuery.data == null && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-3">
                <div className="w-32 h-4 bg-gray-50 rounded" />
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-12 bg-gray-50 rounded flex text-gray-400 items-center justify-center"
                    >
                      --:--
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="w-32 h-4 bg-gray-50 rounded" />
                <div className="grid grid-cols-4 gap-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-12 bg-gray-50 rounded flex text-gray-400 items-center justify-center"
                    >
                      --:--
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {slotsQuery.data?.length === 0 && (
            <div className="flex items-center justify-center py-32 border-2 border-gray-200 border-dashed rounded-lg text-center">
              <p className="text-gray-400">
                {t("no_slots_available_for_this_date")}
              </p>
            </div>
          )}
          {!!slotsQuery.data?.length &&
            groupSlotsByAvailability(slotsQuery.data).map(
              ({ availability, slots }) => (
                <div key={availability.name} className="flex flex-col">
                  <div className="flex flex-row gap-2 items-center mb-2 mt-2 sm:mt-0">
                    <ClipboardCheck size={16} />
                    <span className="text-sm font-medium text-gray-700">
                      {availability.name}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-1 xl:grid-cols-3 2xl:grid-cols-5 gap-2">
                    {slots.map((slot) => (
                      <TokenSlotButton
                        key={slot.id}
                        slot={slot}
                        availability={availability}
                        selectedSlotId={selectedSlotId}
                        onClick={() => {
                          handleSlotSelect(
                            selectedSlotId === slot.id ? undefined : slot.id,
                          );
                        }}
                      />
                    ))}
                  </div>
                  <Separator className="my-6" />
                </div>
              ),
            )}
        </div>
      )}
    </div>
  );
}

export const TokenSlotButton = ({
  slot,
  availability,
  selectedSlotId,
  onClick,
  className,
}: {
  slot: Omit<TokenSlot, "availability">;
  availability: TokenSlot["availability"];
  selectedSlotId: string | undefined;
  onClick: () => void;
  className?: string;
}) => {
  const { t } = useTranslation();

  const percentage = slot.allocated / availability.tokens_per_slot;

  const isOngoingSlot = isWithinInterval(new Date(), {
    start: slot.start_datetime,
    end: slot.end_datetime,
  });

  return (
    <Button
      key={slot.id}
      size="lg"
      type="button"
      variant={selectedSlotId === slot.id ? "primary" : "outline"}
      onClick={onClick}
      disabled={slot.allocated === availability.tokens_per_slot}
      className={cn(
        "flex flex-col items-center group gap-0 w- relative",
        className,
      )}
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
        {isOngoingSlot ? (
          <>
            {t("live")} •{" "}
            {t("tokens_left", {
              count: availability.tokens_per_slot - slot.allocated,
            })}
          </>
        ) : (
          t("tokens_left", {
            count: availability.tokens_per_slot - slot.allocated,
          })
        )}
      </span>
    </Button>
  );
};
