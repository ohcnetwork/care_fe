import { createFileRoute } from "@tanstack/react-router";

import BookFacility from "@/pages/PublicAppointments/BookFacility";

export const Route = createFileRoute("/_patient/nearby_facilities")({
  component: BookFacility,
});
