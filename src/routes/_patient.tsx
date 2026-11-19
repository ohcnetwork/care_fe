import { createFileRoute } from "@tanstack/react-router";

import { requirePatient } from "@/lib/router/auth";

/**
 * Patient portal (OTP sign-in). Signed-out users go to the sign-in; staff
 * users get a not-found page, as before.
 */
export const Route = createFileRoute("/_patient")({
  beforeLoad: requirePatient,
});
