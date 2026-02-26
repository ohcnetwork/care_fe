import { format } from "date-fns";

import {
  MedicationAdministrationRead,
  MedicationAdministrationRequest,
} from "@/types/emr/medicationAdministration/medicationAdministration";
import {
  ACTIVE_MEDICATION_STATUSES,
  MedicationRequestRead,
} from "@/types/emr/medicationRequest/medicationRequest";

// Types for grouped medications
export interface GroupedMedication {
  productId: string;
  productName: string;
  requests: MedicationRequestRead[];
  hasActiveRequests: boolean;
  hasPRN: boolean;
  routes: string[];
  lastAdministeredTime?: string;
}

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
    return (
      admin.request === medicationId &&
      isTimeInSlot(adminDate, { date: slotDate, start, end })
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

/**
 * Groups medications by their requested_product.id or medication.code
 * Returns sorted array with active groups first, then alphabetically by name
 */
export function groupMedicationsByProduct(
  medications: MedicationRequestRead[],
  administrations?: MedicationAdministrationRead[],
): GroupedMedication[] {
  const groupsMap = new Map<string, GroupedMedication>();

  medications.forEach((medication) => {
    // Use product ID if available, otherwise fall back to medication code
    const productId =
      medication.requested_product?.id ||
      medication.medication?.code ||
      medication.id;

    const productName =
      medication.requested_product?.name ||
      medication.medication?.display ||
      "Unknown Medication";

    if (!groupsMap.has(productId)) {
      groupsMap.set(productId, {
        productId,
        productName,
        requests: [],
        hasActiveRequests: false,
        hasPRN: false,
        routes: [],
      });
    }

    const group = groupsMap.get(productId)!;
    group.requests.push(medication);

    // Check if request is active
    const isActive = ACTIVE_MEDICATION_STATUSES.includes(
      medication.status as (typeof ACTIVE_MEDICATION_STATUSES)[number],
    );

    if (isActive) {
      group.hasActiveRequests = true;
    }

    // Check for PRN
    if (medication.dosage_instruction[0]?.as_needed_boolean) {
      group.hasPRN = true;
    }

    // Collect unique routes
    const route = medication.dosage_instruction[0]?.route?.display;
    if (route && !group.routes.includes(route)) {
      group.routes.push(route);
    }
  });

  // Calculate last administered time for each group
  if (administrations?.length) {
    groupsMap.forEach((group) => {
      const requestIds = new Set(group.requests.map((r) => r.id));
      const groupAdministrations = administrations.filter((a) =>
        requestIds.has(a.request),
      );

      if (groupAdministrations.length > 0) {
        const latestAdmin = groupAdministrations.reduce((latest, current) => {
          return new Date(current.occurrence_period_start) >
            new Date(latest.occurrence_period_start)
            ? current
            : latest;
        });
        group.lastAdministeredTime = latestAdmin.occurrence_period_start;
      }
    });
  }

  // Convert to array and sort: active groups first, then alphabetically
  return Array.from(groupsMap.values()).sort((a, b) => {
    if (a.hasActiveRequests && !b.hasActiveRequests) return -1;
    if (!a.hasActiveRequests && b.hasActiveRequests) return 1;
    return a.productName.localeCompare(b.productName);
  });
}

/**
 * Gets the latest active request from a group (most recently authored)
 */
export function getLatestActiveRequest(
  group: GroupedMedication,
): MedicationRequestRead | null {
  const activeRequests = group.requests.filter((r) =>
    ACTIVE_MEDICATION_STATUSES.includes(
      r.status as (typeof ACTIVE_MEDICATION_STATUSES)[number],
    ),
  );

  if (activeRequests.length === 0) return null;

  return activeRequests.reduce((latest, current) => {
    const latestDate = new Date(latest.authored_on || latest.created_date);
    const currentDate = new Date(current.authored_on || current.created_date);
    return currentDate > latestDate ? current : latest;
  });
}

/**
 * Gets administrations for all medications in a group within a time slot
 */
export function getGroupAdministrationsForTimeSlot(
  administrations: MedicationAdministrationRead[],
  group: GroupedMedication,
  slotDate: Date,
  start: string,
  end: string,
): MedicationAdministrationRead[] {
  const requestIds = new Set(group.requests.map((r) => r.id));

  return administrations.filter((admin) => {
    if (!requestIds.has(admin.request)) return false;

    const adminDate = new Date(admin.occurrence_period_start);
    return isTimeInSlot(adminDate, { date: slotDate, start, end });
  });
}
