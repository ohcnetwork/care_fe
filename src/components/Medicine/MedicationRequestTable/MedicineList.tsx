"use client";

import { Checkbox } from "@/components/ui/checkbox";

import { MedicationRequestRead } from "@/types/emr/medicationRequest";

import { MedicineItem } from "./MedicineItem";

interface MedicineListProps {
  medications: MedicationRequestRead[];
  selectedMedications: string[];
  onMedicationSelect: (medicationId: string) => void;
  lastAdministeredDates?: Record<string, string>;
}

export function MedicineList({
  medications,
  selectedMedications,
  onMedicationSelect,
  lastAdministeredDates,
}: MedicineListProps) {
  return (
    <div className="space-y-4">
      {medications.map((medication) => (
        <div key={medication.id} className="flex items-start gap-3">
          <Checkbox
            id={medication.id}
            checked={selectedMedications.includes(medication.id)}
            onCheckedChange={() => onMedicationSelect(medication.id)}
            className="mt-1"
          />
          <MedicineItem
            medication={medication}
            lastAdministeredDate={lastAdministeredDates?.[medication.id]}
          />
        </div>
      ))}
    </div>
  );
}
