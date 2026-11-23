import { createFileRoute } from "@tanstack/react-router";

import { staffOrPublic } from "@/lib/router/auth";
import { LicensesPage } from "@/pages/Licenses/Licenses";

/** Shared URL: same page, in the staff or the public chrome. */
export const Route = createFileRoute("/licenses")({
  beforeLoad: staffOrPublic,
  component: LicensesPage,
});
