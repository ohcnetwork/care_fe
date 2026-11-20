import { createFileRoute } from "@tanstack/react-router";

import BookPractitioner from "@/pages/PublicAppointments/BookPractitioner";

export const Route = createFileRoute("/_patient/patient/book/$facilityId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = Route.useParams();
  return <BookPractitioner facilityId={facilityId} />;
}
