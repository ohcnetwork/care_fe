import { format, formatDistanceToNow } from "date-fns";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getFrequencyDisplay } from "@/components/Medicine/MedicationsTable";
import { formatDosage } from "@/components/Medicine/utils";
import RadioInput from "@/components/Questionnaire/RadioInput";

import { formatName } from "@/Utils/utils";
import {
  MEDICATION_ADMINISTRATION_STATUS,
  MedicationAdministrationRequest,
  MedicationAdministrationStatus,
} from "@/types/emr/medicationAdministration/medicationAdministration";
import { MedicationRequestRead } from "@/types/emr/medicationRequest/medicationRequest";

interface MedicineAdminFormProps {
  medication: MedicationRequestRead;
  lastAdministeredDate?: string;
  lastAdministeredBy?: string;
  administrationRequest: MedicationAdministrationRequest;
  onChange: (request: MedicationAdministrationRequest) => void;
  formId: string;
  isValid?: (valid: boolean) => void;
}

export const MedicineAdminForm: React.FC<MedicineAdminFormProps> = ({
  medication,
  lastAdministeredDate,
  lastAdministeredBy,
  administrationRequest,
  onChange,
  formId,
  isValid,
}) => {
  const { t } = useTranslation();

  const [isPastTime, setIsPastTime] = useState(
    administrationRequest.occurrence_period_start !==
      administrationRequest.occurrence_period_end || !!administrationRequest.id,
  );
  const [startTimeError, setStartTimeError] = useState("");
  const [endTimeError, setEndTimeError] = useState("");

  const validateDateTime = (date: Date, isStartTime: boolean): string => {
    const now = new Date();
    const authoredOn = new Date(medication.authored_on);
    const startTime = new Date(administrationRequest.occurrence_period_start);

    if (date > now) {
      return t(
        isStartTime ? "start_time_future_error" : "end_time_future_error",
      );
    }

    if (isStartTime) {
      return date < authoredOn ? t("start_time_before_authored_error") : "";
    }

    return date < startTime ? t("end_time_before_start_error") : "";
  };

  // Validate and notify parent whenever times change
  useEffect(() => {
    if (!administrationRequest.occurrence_period_start) {
      isValid?.(false);
      return;
    }

    const startDate = new Date(administrationRequest.occurrence_period_start);
    const startError = validateDateTime(startDate, true);
    setStartTimeError(startError);

    // Only validate end time if status is completed or if end time is provided
    if (
      administrationRequest.status === "completed" ||
      administrationRequest.occurrence_period_end
    ) {
      if (!administrationRequest.occurrence_period_end) {
        isValid?.(false);
        return;
      }
      const endDate = new Date(administrationRequest.occurrence_period_end);
      const endError = validateDateTime(endDate, false);
      setEndTimeError(endError);
      isValid?.(!startError && !endError);
    } else {
      setEndTimeError("");
      isValid?.(!startError);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    administrationRequest.occurrence_period_start,
    administrationRequest.occurrence_period_end,
    administrationRequest.status,
  ]);

  const handleDateChange = (newTime: string, isStartTime: boolean) => {
    const date = new Date(newTime);

    // Preserve existing time if available
    const existingDateStr = isStartTime
      ? administrationRequest.occurrence_period_start
      : administrationRequest.occurrence_period_end;

    if (existingDateStr) {
      const existingDate = new Date(existingDateStr);
      date.setHours(existingDate.getHours());
      date.setMinutes(existingDate.getMinutes());
    }

    onChange({
      ...administrationRequest,
      ...(isStartTime
        ? {
            occurrence_period_start: date.toISOString(),
            occurrence_period_end: date.toISOString(),
          }
        : {
            occurrence_period_end: date.toISOString(),
          }),
    });
  };

  const formatTime = (date: string | undefined) => {
    if (!date) return "";
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return "";
      return `${dateObj.getHours().toString().padStart(2, "0")}:${dateObj
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
    } catch {
      return "";
    }
  };

  const handleTimeChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    isStartTime: boolean,
  ) => {
    const [hours, minutes] = event.target.value.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return;

    const dateStr = isStartTime
      ? administrationRequest.occurrence_period_start
      : administrationRequest.occurrence_period_end;

    if (!dateStr) return;

    const currentDate = new Date(dateStr);
    if (isNaN(currentDate.getTime())) return;

    currentDate.setHours(hours);
    currentDate.setMinutes(minutes);

    onChange({
      ...administrationRequest,
      ...(isStartTime
        ? {
            occurrence_period_start: currentDate.toISOString(),
            occurrence_period_end: currentDate.toISOString(),
          }
        : {
            occurrence_period_end: currentDate.toISOString(),
          }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">
          {medication.medication?.display}
        </h3>
        {lastAdministeredDate && (
          <p className="text-sm text-gray-500">
            {t("last_administered")}{" "}
            {formatDistanceToNow(new Date(lastAdministeredDate))} {t("ago")}{" "}
            {t("by")} {formatName(medication.created_by)}
          </p>
        )}
        <p className="text-sm text-gray-500">
          {t("prescribed")}{" "}
          {formatDistanceToNow(
            new Date(medication.authored_on || medication.created_date),
          )}{" "}
          {t("ago")} {t("by")} {lastAdministeredBy}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <Label className="text-xs text-gray-500">{t("dosage")}</Label>
          <p className="font-medium">
            {formatDosage(medication.dosage_instruction[0])}
          </p>
        </div>
        <div>
          <Label className="text-xs text-gray-500">{t("frequency")}</Label>
          <p className="font-medium">
            {getFrequencyDisplay(medication.dosage_instruction[0]?.timing)
              ?.meaning || "-"}
          </p>
        </div>
        <div>
          <Label className="text-xs text-gray-500">{t("route")}</Label>
          <p className="font-medium">
            {medication.dosage_instruction[0]?.route?.display || "Oral"}
          </p>
        </div>
        <div>
          <Label className="text-xs text-gray-500">{t("duration")}</Label>
          <p className="font-medium">
            {medication.dosage_instruction[0]?.timing?.repeat?.bounds_duration
              ?.value || "-"}{" "}
            {medication.dosage_instruction[0]?.timing?.repeat?.bounds_duration
              ?.unit || ""}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("status")}</Label>
        <Select
          value={administrationRequest.status}
          onValueChange={(value: MedicationAdministrationStatus) => {
            const newRequest = { ...administrationRequest, status: value };

            if (value === "in_progress" || value === "not_done") {
              delete newRequest.occurrence_period_end;
            } else if (
              value === "completed" &&
              !administrationRequest.occurrence_period_end
            ) {
              newRequest.occurrence_period_end =
                administrationRequest.occurrence_period_start;
            }

            onChange(newRequest);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("select_status")} />
          </SelectTrigger>
          <SelectContent>
            {MEDICATION_ADMINISTRATION_STATUS.map((status) => (
              <SelectItem key={status} value={status}>
                {t(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("administration_notes")}</Label>
        <Input
          name={`${formId}notes`}
          value={administrationRequest.note || ""}
          onChange={(e) =>
            onChange({ ...administrationRequest, note: e.target.value })
          }
        />
      </div>

      {!administrationRequest.id && (
        <div className="space-y-2">
          <Label>{t("is_this_administration_for_a_past_time")}?</Label>
          <RadioInput
            name={`${formId}isPastTime`}
            value={isPastTime ? "yes" : "no"}
            onValueChange={(newValue: string) => {
              setIsPastTime(newValue === "yes");
              if (newValue === "no") {
                const now = new Date().toISOString();
                const newRequest = {
                  ...administrationRequest,
                  occurrence_period_start: now,
                };

                if (
                  !(
                    administrationRequest.status === "in_progress" ||
                    administrationRequest.status === "not_done"
                  )
                ) {
                  newRequest.occurrence_period_end = now;
                }

                onChange(newRequest);
              }
            }}
            options={[
              { value: "yes", label: t("yes") },
              { value: "no", label: t("no") },
            ]}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>{t("start_time")}</Label>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "flex-1 justify-start text-left font-normal",
                  !administrationRequest.occurrence_period_start &&
                    "text-gray-500",
                )}
                disabled={!isPastTime || !!administrationRequest.id}
              >
                <CareIcon icon="l-calender" className="mr-2 size-4" />
                {administrationRequest.occurrence_period_start
                  ? format(
                      new Date(administrationRequest.occurrence_period_start),
                      "PPP",
                    )
                  : t("pick_a_date")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={
                  administrationRequest.occurrence_period_start
                    ? new Date(administrationRequest.occurrence_period_start)
                    : undefined
                }
                onSelect={(date) => {
                  if (!date) return;
                  handleDateChange(date.toISOString(), true);
                }}
                initialFocus
                disabled={(date) => {
                  const now = new Date();
                  const encounterStart = new Date(medication.authored_on);
                  return date < encounterStart || date > now;
                }}
              />
            </PopoverContent>
          </Popover>
          <Input
            type="time"
            className="w-full max-w-[7rem] sm:max-w-[9.5rem] text-sm sm:text-base py-0"
            value={formatTime(administrationRequest.occurrence_period_start)}
            onChange={(e) => handleTimeChange(e, true)}
            disabled={!isPastTime || !!administrationRequest.id}
          />
        </div>
        {startTimeError && (
          <p className="text-sm text-red-500">{startTimeError}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>{t("end_time")}</Label>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "flex-1 justify-start text-left font-normal",
                  !administrationRequest.occurrence_period_end &&
                    "text-gray-500",
                )}
                disabled={
                  !isPastTime ||
                  (!!administrationRequest.id &&
                    administrationRequest.status !== "in_progress") ||
                  administrationRequest.status === "in_progress"
                }
              >
                <CareIcon icon="l-calender" className="mr-2 size-4" />
                {administrationRequest.occurrence_period_end
                  ? format(
                      new Date(administrationRequest.occurrence_period_end),
                      "PPP",
                    )
                  : t("pick_a_date")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={
                  administrationRequest.occurrence_period_end
                    ? new Date(administrationRequest.occurrence_period_end)
                    : undefined
                }
                onSelect={(date) => {
                  if (!date) return;
                  handleDateChange(date.toISOString(), false);
                }}
                initialFocus
                disabled={(date) => {
                  const now = new Date();
                  const encounterStart = new Date(medication.authored_on);
                  return date < encounterStart || date > now;
                }}
              />
            </PopoverContent>
          </Popover>
          <Input
            type="time"
            className="w-full max-w-[7rem] sm:max-w-[9.5rem] text-sm sm:text-base py-0"
            value={formatTime(administrationRequest.occurrence_period_end)}
            onChange={(e) => handleTimeChange(e, false)}
            disabled={
              !isPastTime ||
              (!!administrationRequest.id &&
                administrationRequest.status !== "in_progress") ||
              administrationRequest.status === "in_progress"
            }
          />
        </div>
        {endTimeError && <p className="text-sm text-red-500">{endTimeError}</p>}
      </div>
    </div>
  );
};
