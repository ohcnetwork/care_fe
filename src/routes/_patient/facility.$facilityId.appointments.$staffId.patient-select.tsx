import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_patient/facility/$facilityId/appointments/$staffId/patient-select",
)({
  beforeLoad: ({ params, location }) => {
    throw redirect({
      href: `/facility/${params.facilityId}/appointments/${params.staffId}/book-appointment${location.searchStr}`,
      replace: true,
    });
  },
  staticData: { patientChrome: false },
});
