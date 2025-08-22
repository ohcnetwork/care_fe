import { format } from "date-fns";

import { MedicationAdministrationRequest } from "@/types/emr/medicationAdministration/medicationAdministration";
import { MedicationRequestRead } from "@/types/emr/medicationRequest/medicationRequest";

// Constants
export const TIME_SLOTS = [
  { label: "12:00 AM - 06:00 AM", start: "00:00", end: "06:00" },
  { label: "06:00 AM - 12:00 PM", start: "06:00", end: "12:00" },
  { label: "12:00 PM - 06:00 PM", start: "12:00", end: "18:00" },
  { label: "06:00 PM - 12:00 AM", start: "18:00", end: "24:00" },
] as const;

export const STATUS_COLORS = {
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  in_progress: "bg-yellow-50 text-yellow-700 border-yellow-200",
  default: "bg-red-50 text-red-700 border-red-200",
} as const;

// Utility Functions
export function createMedicationAdministrationRequest(
  medication: MedicationRequestRead,
  encounterId: string,
): MedicationAdministrationRequest {
  return {
    request: medication.id,
    encounter: encounterId,
    ...(medication.medication?.code && {
      medication: {
        code: medication.medication?.code,
        display: medication.medication?.display,
        system: medication.medication?.system,
      },
    }),
    ...(medication.requested_product && {
      administered_product: medication.requested_product.id,
    }),
    occurrence_period_start: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    occurrence_period_end: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    note: "",
    status: "completed",
    dosage: {
      site: medication.dosage_instruction[0]?.site,
      route: medication.dosage_instruction[0]?.route,
      method: medication.dosage_instruction[0]?.method,
      dose: medication.dosage_instruction[0]?.dose_and_rate?.dose_quantity && {
        value:
          medication.dosage_instruction[0]?.dose_and_rate?.dose_quantity?.value,
        unit: medication.dosage_instruction[0]?.dose_and_rate?.dose_quantity
          ?.unit,
      },
    },
  };
}

export function isTimeInSlot(
  date: Date,
  slot: { date: Date; start: string; end: string },
): boolean {
  const slotStartDate = new Date(slot.date);
  const [startHour] = slot.start.split(":").map(Number);
  const [endHour] = slot.end.split(":").map(Number);

  slotStartDate.setHours(startHour, 0, 0, 0);
  const slotEndDate = new Date(slotStartDate);
  slotEndDate.setHours(endHour, 0, 0, 0);

  return date >= slotStartDate && date < slotEndDate;
}

export function getAdministrationsForTimeSlot<
  T extends {
    occurrence_period_start: string;
    request: string;
  },
>(
  administrations: T[],
  medicationId: string,
  slotDate: Date,
  start: string,
  end: string,
): T[] {
  return administrations.filter((admin) => {
    const adminDate = new Date(admin.occurrence_period_start);
    const slotStartDate = new Date(slotDate);
    const slotEndDate = new Date(slotDate);

    const [startHour] = start.split(":").map(Number);
    const [endHour] = end.split(":").map(Number);

    slotStartDate.setHours(startHour, 0, 0, 0);
    slotEndDate.setHours(endHour, 0, 0, 0);

    return (
      admin.request === medicationId &&
      adminDate >= slotStartDate &&
      adminDate < slotEndDate
    );
  });
}

export function getCurrentTimeSlotIndex(): number {
  const hour = new Date().getHours();
  if (hour < 6) return 0;
  if (hour < 12) return 1;
  if (hour < 18) return 2;
  return 3;
}

export function getEarliestAuthoredDate(
  medications: MedicationRequestRead[],
): Date | null {
  if (!medications?.length) return null;
  return new Date(
    Math.min(
      ...medications.map((med) =>
        new Date(med.authored_on || med.created_date).getTime(),
      ),
    ),
  );
}
