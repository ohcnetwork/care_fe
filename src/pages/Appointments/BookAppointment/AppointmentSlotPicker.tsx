import {
  Appointment,
  GetSlotsForDayResponse,
  SchedulableResourceType,
  ScheduleResource,
  TokenSlot,
  UpcomingAppointmentStatuses,
} from "@/types/scheduling/schedule";
import {
  areIntervalsOverlapping,
  format,
  isSameDay,
  isWithinInterval,
} from "date-fns";
import { Ref, useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import RadioInput from "@/components/ui/RadioInput";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import useBreakpoints from "@/hooks/useBreakpoints";
import { cn } from "@/lib/utils";
import {
  AppointmentConflictAlert,
  AppointmentConflictType,
} from "@/pages/Appointments/BookAppointment/AppointmentConflictAlert";
import {
  getUniqueSchedulesFromSlots,
  groupSlotsByAvailability,
} from "@/pages/Appointments/utils";
import scheduleApi from "@/types/scheduling/scheduleApi";
import query from "@/Utils/request/query";
import { dateQueryString } from "@/Utils/utils";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

interface AppointmentSlotPickerProps {
  facilityId: string;
  resourceId?: string;
  onSlotSelect: (slotId: string | undefined) => void;
  selectedSlotId?: string;
  onSlotDetailsChange?: (slot: TokenSlot) => void;
  currentAppointment?: Appointment;
  selectedDate: Date;
  resourceType: SchedulableResourceType;
  patientId?: string;
  newResource?: ScheduleResource;
  onConflictAcknowledged?: () => void;
}

interface ConflictAlertState {
  slotId: string;
  type: AppointmentConflictType;
  appointment: Appointment;
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
  patientId,
  newResource,
  onConflictAcknowledged,
}: AppointmentSlotPickerProps) {
  const { t } = useTranslation();
  const isMobile = useBreakpoints({ default: true, sm: false });

  const [conflictAlert, setConflictAlert] = useState<ConflictAlertState | null>(
    null,
  );

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

  // Fetch the patient's other active appointments to check for
  // duplicate/clash conflicts when a slot is clicked.
  const patientAppointmentsQuery = useQuery({
    queryKey: [
      "patient-active-appointments-for-conflict-check",
      facilityId,
      patientId,
    ],
    queryFn: query(scheduleApi.appointments.getAppointments, {
      pathParams: { patientId: patientId ?? "" },
      queryParams: {
        facility: facilityId,
        status: UpcomingAppointmentStatuses.join(","),
        limit: 100,
      },
    }),
    enabled: !!patientId,
  });

  const checkForConflict = useCallback(
    (
      slot: Pick<TokenSlot, "id" | "start_datetime" | "end_datetime">,
    ): { type: AppointmentConflictType; appointment: Appointment } | null => {
      const appointments = (
        patientAppointmentsQuery.data?.results ?? []
      ).filter((appointment) => appointment.id !== currentAppointment?.id);

      const newSlotInterval = {
        start: new Date(slot.start_datetime),
        end: new Date(slot.end_datetime),
      };

      const duplicate = appointments.find(
        (appointment) =>
          appointment.resource_type === resourceType &&
          appointment.resource.id === resourceId &&
          isSameDay(
            new Date(appointment.token_slot.start_datetime),
            newSlotInterval.start,
          ),
      );
      if (duplicate) {
        return { type: "duplicate", appointment: duplicate };
      }

      const clash = appointments.find((appointment) => {
        if (
          appointment.resource_type !== SchedulableResourceType.Practitioner ||
          appointment.resource.id === resourceId
        ) {
          return false;
        }
        return areIntervalsOverlapping(newSlotInterval, {
          start: new Date(appointment.token_slot.start_datetime),
          end: new Date(appointment.token_slot.end_datetime),
        });
      });
      if (clash) {
        return { type: "clash", appointment: clash };
      }

      return null;
    },
    [
      patientAppointmentsQuery.data,
      currentAppointment,
      resourceType,
      resourceId,
    ],
  );

  // Update slot details when a slot is selected
  const handleSlotSelect = useCallback(
    (slotId: string | undefined) => {
      onSlotSelect(slotId);
      if (slotId && onSlotDetailsChange) {
        const allSlots = slotsQuery.data || [];
        const selectedSlot = allSlots.find((slot) => slot.id === slotId);

        if (selectedSlot) {
          onSlotDetailsChange(selectedSlot);
        }
      }
    },
    [onSlotSelect, onSlotDetailsChange, slotsQuery.data],
  );

  // Runs the duplicate/clash check the moment a slot is clicked by the user.
  const handleSlotClick = useCallback(
    (slot: Pick<TokenSlot, "id" | "start_datetime" | "end_datetime">) => {
      const isDeselecting = selectedSlotId === slot.id;
      handleSlotSelect(isDeselecting ? undefined : slot.id);

      if (isDeselecting || !patientId) {
        setConflictAlert(null);
        return;
      }

      const conflict = checkForConflict(slot);
      setConflictAlert(conflict ? { slotId: slot.id, ...conflict } : null);
    },
    [selectedSlotId, handleSlotSelect, patientId, checkForConflict],
  );

  // Clear any stale conflict alert when the resource or date changes.
  useEffect(() => {
    setConflictAlert(null);
  }, [resourceId, resourceType, selectedDate]);

  const { slotGroups, availableSlots, uniqueSchedules } = useMemo(() => {
    const allSlots = slotsQuery.data || [];
    const uniqueSchedules = getUniqueSchedulesFromSlots(allSlots);
    const slotGroups = groupSlotsByAvailability(allSlots);
    const availableSlots = slotGroups.flatMap((group) => group.slots);
    return { slotGroups, availableSlots, uniqueSchedules };
  }, [slotsQuery.data]);

  // State for selected schedule filter
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null,
  );

  // Auto-select the first schedule when schedules change
  useEffect(() => {
    if (uniqueSchedules.length > 0) {
      setSelectedScheduleId(uniqueSchedules[0].id);
    } else {
      setSelectedScheduleId(null);
    }
  }, [uniqueSchedules]);

  // Filter slots based on selected schedule
  const filteredSlotGroups = useMemo(() => {
    if (!selectedScheduleId) return slotGroups;
    return slotGroups
      .map((group) => ({
        ...group,
        slots: group.slots.filter(
          (slot) =>
            slotsQuery.data?.find((s) => s.id === slot.id)?.availability
              .schedule.id === selectedScheduleId,
        ),
      }))
      .filter((group) => group.slots.length > 0);
  }, [slotGroups, selectedScheduleId, slotsQuery.data]);

  const filteredAvailableSlots = useMemo(() => {
    return filteredSlotGroups.flatMap((group) => group.slots);
  }, [filteredSlotGroups]);

  // Pre-select the first slot for current date if there are any slots available
  useEffect(() => {
    const firstSlot = filteredAvailableSlots?.[0];
    handleSlotSelect(firstSlot?.id);

    if (!firstSlot || !patientId) {
      setConflictAlert(null);
      return;
    }

    const conflict = checkForConflict(firstSlot);
    setConflictAlert(conflict ? { slotId: firstSlot.id, ...conflict } : null);
  }, [filteredAvailableSlots, handleSlotSelect, patientId, checkForConflict]);

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
            {availableSlots.length} {t("available_time_slots")}
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
      {/* Schedule Filter */}
      {uniqueSchedules.length > 1 && (
        <RadioInput
          options={uniqueSchedules.map((schedule) => ({
            label: schedule.name,
            value: schedule.id,
          }))}
          value={selectedScheduleId ?? ""}
          onValueChange={setSelectedScheduleId}
          required
        />
      )}
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
            filteredSlotGroups.map(({ availability, slots }) => (
              <div key={availability.name} className="flex flex-col">
                <div className="flex flex-row gap-2 items-center mb-2 mt-2 sm:mt-0">
                  <ClipboardCheck size={16} />
                  <span className="text-sm font-medium text-gray-700">
                    {availability.name}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-1 xl:grid-cols-3 2xl:grid-cols-5 gap-2">
                  {slots.map((slot) => {
                    const button = (
                      <TokenSlotButton
                        key={slot.id}
                        slot={slot}
                        availability={availability}
                        selectedSlotId={selectedSlotId}
                        onClick={() => handleSlotClick(slot)}
                      />
                    );

                    if (conflictAlert?.slotId !== slot.id) {
                      return button;
                    }

                    // Dismissing the alert (via the close button, Escape, or
                    // an outside click) must be treated the same as explicitly
                    // picking another slot: the conflicting slot is deselected
                    // rather than left silently selected without
                    // acknowledgment.
                    const dismissConflict = () => {
                      setConflictAlert(null);
                      handleSlotSelect(undefined);
                    };

                    const conflictAlertContent = (
                      <AppointmentConflictAlert
                        type={conflictAlert.type}
                        conflictingAppointment={conflictAlert.appointment}
                        newSlot={slot}
                        newResource={newResource}
                        onClose={dismissConflict}
                        onPickAnotherSlot={dismissConflict}
                        onContinueAnyway={() => {
                          setConflictAlert(null);
                          onConflictAcknowledged?.();
                        }}
                      />
                    );

                    if (isMobile) {
                      return (
                        <div key={slot.id}>
                          {button}
                          <Drawer
                            open
                            onOpenChange={(open) => {
                              if (!open) dismissConflict();
                            }}
                          >
                            <DrawerContent>
                              <DrawerTitle className="sr-only">
                                {conflictAlert.type === "duplicate"
                                  ? t("multiple_appointment_alert")
                                  : t("timing_clash_alert")}
                              </DrawerTitle>
                              {conflictAlertContent}
                            </DrawerContent>
                          </Drawer>
                        </div>
                      );
                    }

                    return (
                      <Popover
                        key={slot.id}
                        open
                        onOpenChange={(open) => {
                          if (!open) dismissConflict();
                        }}
                      >
                        <PopoverTrigger asChild>{button}</PopoverTrigger>
                        <PopoverContent
                          side="bottom"
                          align="start"
                          sideOffset={8}
                          className="w-80 p-0 rounded-xl shadow-lg"
                        >
                          {conflictAlertContent}
                        </PopoverContent>
                      </Popover>
                    );
                  })}
                </div>
                <Separator className="my-6" />
              </div>
            ))}
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
  ref,
}: {
  slot: Omit<TokenSlot, "availability">;
  availability: TokenSlot["availability"];
  selectedSlotId: string | undefined;
  onClick: () => void;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
}) => {
  const { t } = useTranslation();

  const percentage = slot.allocated / availability.tokens_per_slot;

  const isOngoingSlot = isWithinInterval(new Date(), {
    start: slot.start_datetime,
    end: slot.end_datetime,
  });

  return (
    <Button
      ref={ref}
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
