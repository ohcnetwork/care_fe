import { createFileRoute } from "@tanstack/react-router";

import { fullScreenPage } from "@/lib/router/staticData";

/** Pharmacy billing. */
export const Route = createFileRoute(
  "/_app/_legacy/facility/$facilityId/locations/$locationId/medication_requests/patient/$patientId/bill/prescriptions/$prescriptionIds",
)({ staticData: fullScreenPage });
