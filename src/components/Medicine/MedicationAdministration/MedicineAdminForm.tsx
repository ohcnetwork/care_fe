import { formatDistanceToNow, startOfMinute, subDays } from "date-fns";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import RadioInput from "@/components/ui/RadioInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { getDosageFromInstruction } from "@/components/Medicine/MedicationAdministration/utils";
import {
  formatDosage,
  formatDuration,
  formatFrequency,
} from "@/components/Medicine/utils";

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
  onMedicationChange?: (medication: MedicationRequestRead) => void;
  formId: string;
  isValid?: (valid: boolean) => void;
  compact?: boolean;
  otherGroupRequests?: MedicationRequestRead[];
}

interface DosageInstructionSelectorProps {
  medication: MedicationRequestRead;
  administrationRequest: MedicationAdministrationRequest;
  onChange: (request: MedicationAdministrationRequest) => void;
  formId: string;
}

function findSelectedDosageIndex(
  medication: MedicationRequestRead,
  administrationRequest: MedicationAdministrationRequest,
): number {
  const idx = medication.dosage_instruction.findIndex((di) => {
    const doseValue = di.dose_and_rate?.dose_quantity?.value;
    const doseUnit = di.dose_and_rate?.dose_quantity?.unit?.code;
    return (
      doseValue === administrationRequest.dosage?.dose?.value &&
      doseUnit === administrationRequest.dosage?.dose?.unit?.code
    );
  });
  return idx >= 0 ? idx : 0;
}

const DosageInstructionSelector: React.FC<DosageInstructionSelectorProps> = ({
  medication,
  administrationRequest,
  onChange,
  formId,
}) => {
  const { t } = useTranslation();
  const selectedIndex = findSelectedDosageIndex(
    medication,
    administrationRequest,
  );
  const hasSingleInstruction = medication.dosage_instruction.length === 1;
  const allDosagesAreSame = medication.dosage_instruction.every(
    (di, _, arr) => {
      const firstDose = arr[0]?.dose_and_rate?.dose_quantity;
      const currentDose = di.dose_and_rate?.dose_quantity;
      return (
        firstDose?.value === currentDose?.value &&
        firstDose?.unit?.code === currentDose?.unit?.code
      );
    },
  );

  const handleSelectDosage = (idx: number) => {
    const instruction = medication.dosage_instruction[idx];
    if (instruction) {
      onChange({
        ...administrationRequest,
        dosage: getDosageFromInstruction(instruction),
      });
    }
  };

  // If there's only one instruction or all dosages are the same, show read-only display)
  if (hasSingleInstruction || allDosagesAreSame) {
    return (
      <div className="space-y-2">
        {medication.dosage_instruction.map((di, idx) => (
          <div
            key={idx}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-gray-50 rounded-lg"
          >
            <div>
              <Label className="text-xs text-gray-500">{t("dosage")}</Label>
              <p className="font-medium">{formatDosage(di)}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">{t("frequency")}</Label>
              <p className="font-medium">{formatFrequency(di) || "-"}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">{t("route")}</Label>
              <p className="font-medium">{di?.route?.display || t("oral")}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">{t("duration")}</Label>
              <p className="font-medium">{formatDuration(di) || "-"}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>{t("select_dosage_instruction")}</Label>
      <RadioGroup
        value={String(selectedIndex)}
        onValueChange={(value) => handleSelectDosage(parseInt(value, 10))}
        className="space-y-2"
      >
        {medication.dosage_instruction.map((di, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <div
              key={idx}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                isSelected
                  ? "bg-primary-50 border-primary-300"
                  : "bg-gray-50 border-gray-200 hover:border-gray-300",
              )}
              onClick={() => handleSelectDosage(idx)}
            >
              <RadioGroupItem
                value={String(idx)}
                id={`${formId}-dosage-${idx}`}
                className="mt-1"
              />
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">{t("dosage")}</Label>
                  <p className="font-medium">{formatDosage(di)}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">
                    {t("frequency")}
                  </Label>
                  <p className="font-medium">{formatFrequency(di) || "-"}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">{t("route")}</Label>
                  <p className="font-medium">
                    {di?.route?.display || t("oral")}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">
                    {t("duration")}
                  </Label>
                  <p className="font-medium">{formatDuration(di) || "-"}</p>
                </div>
              </div>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
};

export const MedicineAdminForm: React.FC<MedicineAdminFormProps> = ({
  medication,
  lastAdministeredDate,
  lastAdministeredBy,
  administrationRequest,
  onChange,
  onMedicationChange,
  formId,
  isValid,
  compact = false,
  otherGroupRequests,
}) => {
  const { t } = useTranslation();

  const [isPastTime, setIsPastTime] = useState(
    administrationRequest.occurrence_period_start !==
      administrationRequest.occurrence_period_end || !!administrationRequest.id,
  );
  const [startTimeError, setStartTimeError] = useState("");
  const [endTimeError, setEndTimeError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(
    !!administrationRequest.id || isPastTime,
  );

  const validateDateTime = (date: Date, isStartTime: boolean): string => {
    const now = startOfMinute(new Date());
    const startTime = startOfMinute(
      new Date(administrationRequest.occurrence_period_start),
    );
    date = startOfMinute(date);

    if (date > now) {
      return t(
        isStartTime ? "start_time_future_error" : "end_time_future_error",
      );
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

  const handleAdministerNow = () => {
    const now = new Date().toISOString();
    onChange({
      ...administrationRequest,
      status: "completed",
      occurrence_period_start: now,
      occurrence_period_end: now,
    });
    setIsPastTime(false);
    setShowAdvanced(false);
  };

  // Compact mode for sheet - simplified form
  if (compact) {
    return (
      <div className="space-y-4">
        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={!showAdvanced ? "default" : "outline"}
            size="sm"
            className={cn(
              "flex-1",
              !showAdvanced && "bg-green-600 hover:bg-green-700",
            )}
            onClick={handleAdministerNow}
          >
            <CareIcon icon="l-check-circle" className="size-4 mr-1.5" />
            {t("administer_now")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-gray-600"
          >
            <CareIcon
              icon={showAdvanced ? "l-angle-up" : "l-angle-down"}
              className="size-4 mr-1"
            />
            {showAdvanced ? t("less_options") : t("more_options")}
          </Button>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{t("status")}:</span>
          <Badge
            variant={
              administrationRequest.status === "completed"
                ? "green"
                : administrationRequest.status === "in_progress"
                  ? "blue"
                  : "secondary"
            }
          >
            {t(administrationRequest.status)}
          </Badge>
        </div>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="space-y-4 pt-2 border-t border-gray-200">
            {/* Status Select */}
            <div className="space-y-2">
              <Label className="text-sm">{t("status")}</Label>
              <Select
                value={administrationRequest.status}
                onValueChange={(value: MedicationAdministrationStatus) => {
                  const newRequest = {
                    ...administrationRequest,
                    status: value,
                  };

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
                <SelectTrigger className="h-9">
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

            {/* Time Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">{t("start_time")}</Label>
                <div className="flex gap-2">
                  <DatePicker
                    date={
                      administrationRequest.occurrence_period_start
                        ? new Date(
                            administrationRequest.occurrence_period_start,
                          )
                        : undefined
                    }
                    onChange={(date) => {
                      if (!date) return;
                      handleDateChange(date.toISOString(), true);
                    }}
                    disabled={(date) => {
                      const now = new Date();
                      const encounterStart = subDays(
                        new Date(medication.authored_on),
                        1,
                      );
                      return date < encounterStart || date > now;
                    }}
                    className="flex-1"
                  />
                  <Input
                    type="time"
                    className="w-24 text-sm"
                    value={formatTime(
                      administrationRequest.occurrence_period_start,
                    )}
                    onChange={(e) => handleTimeChange(e, true)}
                  />
                </div>
                {startTimeError && (
                  <p className="text-xs text-red-500">{startTimeError}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{t("end_time")}</Label>
                <div className="flex gap-2">
                  <DatePicker
                    date={
                      administrationRequest.occurrence_period_end
                        ? new Date(administrationRequest.occurrence_period_end)
                        : undefined
                    }
                    onChange={(date) => {
                      if (!date) return;
                      handleDateChange(date.toISOString(), false);
                    }}
                    disabled={(date) => {
                      const now = new Date();
                      const encounterStart = subDays(
                        new Date(medication.authored_on),
                        1,
                      );
                      return date < encounterStart || date > now;
                    }}
                    className="flex-1"
                    disablePicker={
                      administrationRequest.status === "in_progress"
                    }
                  />
                  <Input
                    type="time"
                    className="w-24 text-sm"
                    value={formatTime(
                      administrationRequest.occurrence_period_end,
                    )}
                    onChange={(e) => handleTimeChange(e, false)}
                    disabled={administrationRequest.status === "in_progress"}
                  />
                </div>
                {endTimeError && (
                  <p className="text-xs text-red-500">{endTimeError}</p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-sm">{t("notes")}</Label>
              <Textarea
                name={`${formId}notes`}
                value={administrationRequest.note || ""}
                onChange={(e) =>
                  onChange({ ...administrationRequest, note: e.target.value })
                }
                placeholder={t("add_notes_optional")}
                rows={2}
                className="resize-none text-sm"
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full form mode for dialog
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

      <DosageInstructionSelector
        medication={medication}
        administrationRequest={administrationRequest}
        onChange={onChange}
        formId={formId}
      />

      {/* All prescriptions in the group */}
      {otherGroupRequests && otherGroupRequests.length > 0 && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <CareIcon icon="l-clipboard-notes" className="size-4" />
            <span>{t("all_prescriptions_in_group")}</span>
          </div>
          <div className="space-y-1.5">
            {otherGroupRequests.map((req) => {
              const isCurrentMedication = req.id === medication.id;
              const canSelect = !isCurrentMedication && onMedicationChange;
              const instructionSummaries = req.dosage_instruction.map((di) => {
                const dosage = formatDosage(di);
                const freq = formatFrequency(di);
                return { dosage, freq };
              });
              return (
                <button
                  type="button"
                  key={req.id}
                  onClick={() => canSelect && onMedicationChange(req)}
                  disabled={isCurrentMedication}
                  className={cn(
                    "flex items-center justify-between w-full px-3 py-2 rounded-md text-sm border text-left transition-colors",
                    isCurrentMedication
                      ? "bg-primary-50 border-primary-200 cursor-default"
                      : "bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200 cursor-pointer",
                  )}
                >
                  <div className="flex items-center gap-2">
                    {isCurrentMedication && (
                      <CareIcon
                        icon="l-check-circle"
                        className="size-4 text-primary-600"
                      />
                    )}
                    <div className="flex flex-col gap-0.5">
                      {instructionSummaries.map((summary, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <span
                            className={
                              isCurrentMedication
                                ? "text-primary-700 font-medium"
                                : "text-gray-700"
                            }
                          >
                            {summary.dosage}
                          </span>
                          {summary.freq && (
                            <span
                              className={
                                isCurrentMedication
                                  ? "text-primary-500"
                                  : "text-gray-400"
                              }
                            >
                              · {summary.freq}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <Badge
                    variant={req.status === "active" ? "green" : "secondary"}
                    className="text-xs"
                  >
                    {t(req.status)}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      )}

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
        <Textarea
          name={`${formId}notes`}
          value={administrationRequest.note || ""}
          onChange={(e) =>
            onChange({ ...administrationRequest, note: e.target.value })
          }
          placeholder={t("add_notes_optional")}
          rows={2}
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
        <div className="flex flex-col sm:flex-row gap-2">
          <DatePicker
            date={
              administrationRequest.occurrence_period_start
                ? new Date(administrationRequest.occurrence_period_start)
                : undefined
            }
            onChange={(date) => {
              if (!date) return;
              handleDateChange(date.toISOString(), true);
            }}
            disabled={(date) => {
              const now = new Date();
              const encounterStart = subDays(
                new Date(medication.authored_on),
                1,
              );
              return date < encounterStart || date > now;
            }}
            disablePicker={!isPastTime || !!administrationRequest.id}
            className="flex-1"
          />
          <Input
            type="time"
            className="w-full sm:max-w-40 text-sm sm:text-base"
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
        <div className="flex flex-col sm:flex-row gap-2">
          <DatePicker
            date={
              administrationRequest.occurrence_period_end
                ? new Date(administrationRequest.occurrence_period_end)
                : undefined
            }
            onChange={(date) => {
              if (!date) return;
              handleDateChange(date.toISOString(), false);
            }}
            disabled={(date) => {
              const now = new Date();
              const encounterStart = subDays(
                new Date(medication.authored_on),
                1,
              );
              return date < encounterStart || date > now;
            }}
            className="flex-1"
            disablePicker={
              !isPastTime ||
              (!!administrationRequest.id &&
                administrationRequest.status !== "in_progress") ||
              administrationRequest.status === "in_progress"
            }
          />
          <Input
            type="time"
            className="w-full sm:max-w-40 text-sm sm:text-base"
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
