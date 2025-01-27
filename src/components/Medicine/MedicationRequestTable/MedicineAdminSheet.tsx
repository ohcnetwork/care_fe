"use client";

import { useMutation } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import medicationAdministrationApi from "@/types/emr/medicationAdministration/medicationAdministrationApi";
import { MedicationRequestRead } from "@/types/emr/medicationRequest";

import { MedicineAdminForm } from "./MedicineAdminForm";

interface MedicineAdminSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medications: MedicationRequestRead[];
  lastAdministeredDates?: Record<string, string>;
  patientId: string;
  encounterId: string;
}

interface MedicationWithRequiredFields extends MedicationRequestRead {
  medication: {
    display: string;
    code: string;
    system: string;
  };
}

export function MedicineAdminSheet({
  open,
  onOpenChange,
  medications,
  lastAdministeredDates,
  patientId,
  encounterId,
}: MedicineAdminSheetProps) {
  const [search, setSearch] = useState("");
  const [selectedMedicines, setSelectedMedicines] = useState<Set<string>>(
    new Set(),
  );
  const formRef = useRef<HTMLFormElement>(null);

  const { mutate: upsertAdministrations } = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(
        medicationAdministrationApi.upsertMedicationAdministration.path.replace(
          "{patientId}",
          patientId,
        ),
        {
          method:
            medicationAdministrationApi.upsertMedicationAdministration.method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        },
      );
      if (!response.ok) {
        throw new Error("Failed to upsert administrations");
      }
      return response.json();
    },
  });

  // Type guard to check if a medicine has all required fields
  const hasMedicationInfo = (
    medicine: MedicationRequestRead,
  ): medicine is MedicationWithRequiredFields => {
    return !!(
      medicine.medication?.display &&
      medicine.medication?.code &&
      medicine.medication?.system
    );
  };

  const filteredMedicines = medications
    .filter(hasMedicationInfo)
    .filter((medicine) =>
      medicine.medication.display.toLowerCase().includes(search.toLowerCase()),
    );

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedMedicines((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const administrations = Array.from(selectedMedicines).map((id) => {
      const medicine = medications.find((m) => m.id === id);
      if (!hasMedicationInfo(medicine!)) {
        throw new Error(`Medicine ${id} not found or missing medication info`);
      }

      const startTime =
        formData.get(`${id}startDateTime`)?.toString() ||
        new Date().toISOString();
      const endTime = formData.get(`${id}endDateTime`)?.toString() || startTime;
      const notes = formData.get(`${id}notes`)?.toString() || "";

      return {
        request: id,
        encounter: encounterId,
        medication: medicine.medication,
        occurrence_period_start: startTime,
        occurrence_period_end: endTime,
        note: notes,
        status: "completed",
      };
    });

    upsertAdministrations({
      data: administrations,
    });

    onOpenChange(false);
    setSelectedMedicines(new Set());
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-2xl flex flex-col h-full"
      >
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex flex-col h-full"
        >
          <SheetHeader className="space-y-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl">Administer Medicines</SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search Medicine"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto mt-8">
            <div className="space-y-2 pb-4">
              {filteredMedicines.map((medicine) => (
                <div key={medicine.id} className="border-b border-border py-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {medicine.medication?.display}
                        </span>
                        {medicine.dosage_instruction[0]?.as_needed_boolean && (
                          <span className="text-sm text-rose-500">
                            As Needed / PRN
                          </span>
                        )}
                      </div>
                    </div>
                    <Checkbox
                      checked={selectedMedicines.has(medicine.id)}
                      onCheckedChange={(checked) =>
                        handleSelect(medicine.id, checked as boolean)
                      }
                      className="mt-1"
                      aria-label="Select for administration"
                    />
                  </div>

                  <div
                    className={`grid gap-4 overflow-hidden transition-all ${
                      selectedMedicines.has(medicine.id)
                        ? "grid-rows-[1fr] mt-4"
                        : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="min-h-0">
                      <MedicineAdminForm
                        medication={medicine}
                        lastAdministeredDate={
                          lastAdministeredDates?.[medicine.id]
                        }
                        formId={medicine.id}
                        administrationRequest={{
                          request: medicine.id,
                          encounter: encounterId,
                          medication: {
                            code: medicine.medication?.code || "",
                            display: medicine.medication?.display || "",
                            system: medicine.medication?.system || "",
                          },
                          occurrence_period_start: new Date()
                            .toISOString()
                            .slice(0, 16),
                          occurrence_period_end: new Date()
                            .toISOString()
                            .slice(0, 16),
                          note: "",
                          status: "completed",
                        }}
                        onChange={(request) => {
                          // Update the form data for this specific medicine
                          if (formRef.current) {
                            // Get form elements with proper type assertions
                            const form = formRef.current;
                            const notesInput =
                              form.querySelector<HTMLInputElement>(
                                `[name="${medicine.id}notes"]`,
                              );
                            const startTimeInput =
                              form.querySelector<HTMLInputElement>(
                                `[name="${medicine.id}startDateTime"]`,
                              );
                            const endTimeInput =
                              form.querySelector<HTMLInputElement>(
                                `[name="${medicine.id}endDateTime"]`,
                              );

                            if (notesInput)
                              notesInput.value = request.note || "";
                            if (startTimeInput)
                              startTimeInput.value =
                                request.occurrence_period_start;
                            if (endTimeInput)
                              endTimeInput.value =
                                request.occurrence_period_end || "";
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <SheetFooter className="border-t pt-4">
            <div className="flex justify-between w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#006D4C] hover:bg-[#006D4C]/90"
                disabled={selectedMedicines.size === 0}
              >
                Administer Medicines ({selectedMedicines.size})
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
