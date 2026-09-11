import { format } from "date-fns";
import { MessageCircleWarning, X } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { ScheduleResourceIcon } from "@/components/Schedule/ScheduleResourceIcon";
import {
  Appointment,
  formatScheduleResourceName,
  SchedulableResourceType,
  ScheduleResource,
  TokenSlot,
} from "@/types/scheduling/schedule";

export type AppointmentConflictType = "duplicate" | "clash";

interface AppointmentConflictAlertProps {
  type: AppointmentConflictType;
  conflictingAppointment: Appointment;
  newSlot: Pick<TokenSlot, "start_datetime" | "end_datetime">;
  newResource?: ScheduleResource;
  onPickAnotherSlot: () => void;
  onContinueAnyway: () => void;
  onClose: () => void;
}

export const AppointmentConflictAlert = ({
  type,
  conflictingAppointment,
  newSlot,
  newResource,
  onPickAnotherSlot,
  onContinueAnyway,
  onClose,
}: AppointmentConflictAlertProps) => {
  const { t } = useTranslation();

  const existingStart = new Date(
    conflictingAppointment.token_slot.start_datetime,
  );
  const newStart = new Date(newSlot.start_datetime);

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center size-9 rounded-full bg-yellow-100 shrink-0">
            <MessageCircleWarning className="size-5 text-yellow-700" />
          </div>
          <span className="font-semibold text-gray-950">
            {type === "duplicate"
              ? t("multiple_appointment_alert")
              : t("timing_clash_alert")}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="text-gray-400 hover:text-gray-600 shrink-0"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="border-t border-gray-200" />

      <p className="text-sm text-gray-950">
        {t("patient_already_has_appointment_on")}{" "}
        <span className="font-semibold">
          {format(existingStart, "dd MMM yyyy")} ·{" "}
          {format(existingStart, "hh:mm a")}
        </span>
      </p>

      <div className="flex items-center justify-between gap-2 rounded-md bg-gray-50 p-2">
        <div className="flex items-center gap-2 min-w-0">
          <ScheduleResourceIcon
            resource={conflictingAppointment}
            className="size-8"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-gray-950 truncate">
              {formatScheduleResourceName(conflictingAppointment)}
            </span>
            {conflictingAppointment.resource_type ===
              SchedulableResourceType.Practitioner && (
              <span className="text-xs text-gray-600">
                {t(conflictingAppointment.resource.user_type)}
              </span>
            )}
          </div>
        </div>
        {type === "duplicate" && (
          <span className="text-sm font-medium text-green-700 whitespace-nowrap">
            {format(existingStart, "hh:mm a")}
          </span>
        )}
      </div>

      {type === "duplicate" ? (
        <p className="text-sm text-gray-950">
          <Trans
            i18nKey="trying_to_book_another_slot_same_doctor"
            components={{ bold: <span className="font-semibold" /> }}
          />{" "}
          <span className="font-semibold">
            {format(newStart, "dd MMM yyyy")} · {format(newStart, "hh:mm a")}
          </span>
        </p>
      ) : (
        <>
          <p className="text-sm text-gray-950">
            <Trans
              i18nKey="clash_new_slot_overlaps"
              values={{
                resourceName: newResource
                  ? formatScheduleResourceName(newResource)
                  : "",
                time: format(newStart, "hh:mm a"),
              }}
              components={{ bold: <span className="font-semibold" /> }}
            />
          </p>

          {newResource && (
            <div className="flex items-center gap-2 rounded-md bg-gray-50 p-2">
              <ScheduleResourceIcon resource={newResource} className="size-8" />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-gray-950 truncate">
                  {formatScheduleResourceName(newResource)}
                </span>
                {newResource.resource_type ===
                  SchedulableResourceType.Practitioner && (
                  <span className="text-xs text-gray-600">
                    {t(newResource.resource.user_type)}
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <p className="text-sm font-medium text-gray-950">
        {t("what_would_you_like_to_do")}
      </p>

      <Button
        type="button"
        variant="primary"
        className="w-full"
        onClick={onPickAnotherSlot}
      >
        {t("pick_another_slot")}
      </Button>

      <button
        type="button"
        onClick={onContinueAnyway}
        className="text-sm font-semibold text-gray-950 underline text-center mx-auto"
      >
        {t("continue_anyway")}
      </button>
    </div>
  );
};
