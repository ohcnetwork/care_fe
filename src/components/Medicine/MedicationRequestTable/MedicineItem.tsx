"use client";

import { formatDistanceToNow } from "date-fns";

import { Label } from "@/components/ui/label";

import { getFrequencyDisplay } from "@/components/Medicine/MedicationsTable";
import { formatDosage } from "@/components/Medicine/utils";

import { MedicationRequestRead } from "@/types/emr/medicationRequest";

interface MedicineItemProps {
  medication: MedicationRequestRead;
  lastAdministeredDate?: string;
}

export function MedicineItem({
  medication,
  lastAdministeredDate,
}: MedicineItemProps) {
  return (
    <div className="space-y-1">
      <h3 className="text-lg font-semibold">
        {medication.medication?.display}
      </h3>
      {lastAdministeredDate && (
        <p className="text-sm text-muted-foreground">
          Last administered{" "}
          {formatDistanceToNow(new Date(lastAdministeredDate))} ago
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        Prescribed {formatDistanceToNow(new Date(medication.created_date))} ago
        by {medication.created_by?.first_name}{" "}
        {medication.created_by?.last_name}
      </p>

      <div className="grid grid-cols-4 gap-4">
        <div>
          <Label className="text-xs text-muted-foreground">Dosage</Label>
          <p className="font-medium">
            {formatDosage(medication.dosage_instruction[0])}
          </p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Frequency</Label>
          <p className="font-medium">
            {getFrequencyDisplay(medication.dosage_instruction[0]?.timing)
              ?.meaning || "-"}
          </p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Route</Label>
          <p className="font-medium">
            {medication.dosage_instruction[0]?.route?.display || "Oral"}
          </p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Duration</Label>
          <p className="font-medium">
            {medication.dosage_instruction[0]?.timing?.repeat?.bounds_duration
              ?.value || "-"}{" "}
            {medication.dosage_instruction[0]?.timing?.repeat?.bounds_duration
              ?.unit || ""}
          </p>
        </div>
      </div>
    </div>
  );
}
