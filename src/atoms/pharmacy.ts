import { atomFamily } from "jotai-family";
import { atomWithStorage } from "jotai/utils";

interface PharmacyDispenseServiceState {
  locationId: string;
  serviceId: string;
}

export const pharmacyDispenseServiceAtom = atomFamily((facilityId) =>
  atomWithStorage<PharmacyDispenseServiceState | null>(
    `pharmacy-dispense-service--${facilityId}`,
    null,
  ),
);
