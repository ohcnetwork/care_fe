"use client";

import { formatDistanceToNow } from "date-fns";
import { t } from "i18next";
import React, { useState } from "react";

import { DateTimePicker } from "@/components/ui/date-time-picker";
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

import { getFrequencyDisplay } from "@/components/Medicine/MedicationsTable";
import { formatDosage } from "@/components/Medicine/utils";

import {
  MEDICATION_ADMINISTRATION_STATUS,
  MedicationAdministrationRequest,
  MedicationAdministrationStatus,
} from "@/types/emr/medicationAdministration/medicationAdministration";
import { MedicationRequestRead } from "@/types/emr/medicationRequest";

interface MedicineAdminFormProps {
  medication: MedicationRequestRead;
  lastAdministeredDate?: string;
  administrationRequest: MedicationAdministrationRequest;
  onChange: (request: MedicationAdministrationRequest) => void;
  formId: string;
}

export const MedicineAdminForm: React.FC<MedicineAdminFormProps> = ({
  medication,
  lastAdministeredDate,
  administrationRequest,
  onChange,
  formId,
}) => {
  // Initialize isPastTime based on whether the times are different
  const [isPastTime, setIsPastTime] = useState(
    administrationRequest.occurrence_period_start !==
      administrationRequest.occurrence_period_end || !!administrationRequest.id,
  );

  const handleStartTimeChange = (newStartTime: string) => {
    onChange({
      ...administrationRequest,
      occurrence_period_start: newStartTime,
      occurrence_period_end: newStartTime,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">
          {medication.medication?.display}
        </h3>
        {lastAdministeredDate && (
          <p className="text-sm text-muted-foreground">
            {t("last_administered")}{" "}
            {formatDistanceToNow(new Date(lastAdministeredDate))} {t("ago")}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          {t("prescribed")}{" "}
          {formatDistanceToNow(new Date(medication.created_date))} {t("ago")}{" "}
          {t("by")} {medication.created_by?.first_name}{" "}
          {medication.created_by?.last_name}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <Label className="text-xs text-muted-foreground">{t("dosage")}</Label>
          <p className="font-medium">
            {formatDosage(medication.dosage_instruction[0])}
          </p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">
            {t("frequency")}
          </Label>
          <p className="font-medium">
            {getFrequencyDisplay(medication.dosage_instruction[0]?.timing)
              ?.meaning || "-"}
          </p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">{t("route")}</Label>
          <p className="font-medium">
            {medication.dosage_instruction[0]?.route?.display || "Oral"}
          </p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">
            {t("duration")}
          </Label>
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
          onValueChange={(value: MedicationAdministrationStatus) =>
            onChange({ ...administrationRequest, status: value })
          }
          disabled={
            !!administrationRequest.id &&
            administrationRequest.status !== "in_progress"
          }
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
          <RadioGroup
            name={`${formId}isPastTime`}
            value={isPastTime ? "yes" : "no"}
            onValueChange={(newValue) => {
              setIsPastTime(newValue === "yes");
              if (newValue === "no") {
                // Set both times to current time
                const now = new Date().toISOString();
                onChange({
                  ...administrationRequest,
                  occurrence_period_start: now,
                  occurrence_period_end: now,
                });
              }
            }}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id={`yes-${formId}`} />
              <Label htmlFor={`yes-${formId}`}>{t("yes")}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id={`no-${formId}`} />
              <Label htmlFor={`no-${formId}`}>{t("no")}</Label>
            </div>
          </RadioGroup>
        </div>
      )}

      <div className="space-y-2">
        <Label>{t("start_time")}</Label>
        <DateTimePicker
          value={
            administrationRequest.occurrence_period_start
              ? new Date(administrationRequest.occurrence_period_start)
              : undefined
          }
          onChange={(date) => {
            if (!date) return;
            handleStartTimeChange(date.toISOString());
          }}
          disabled={!isPastTime || !!administrationRequest.id}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("end_time")}</Label>
        <DateTimePicker
          value={
            administrationRequest.occurrence_period_end
              ? new Date(administrationRequest.occurrence_period_end)
              : administrationRequest.occurrence_period_start
                ? new Date(administrationRequest.occurrence_period_start)
                : undefined
          }
          onChange={(date) => {
            if (!date) return;
            onChange({
              ...administrationRequest,
              occurrence_period_end: date.toISOString(),
            });
          }}
          disabled={
            !isPastTime ||
            (!!administrationRequest.id &&
              administrationRequest.status !== "in_progress")
          }
        />
      </div>
    </div>
  );
};
