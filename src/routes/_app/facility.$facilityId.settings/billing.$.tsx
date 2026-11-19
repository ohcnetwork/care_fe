import { createFileRoute } from "@tanstack/react-router";

import { BillingSettingsLayout } from "@/pages/Facility/settings/billing/layout";
import { LegacySettingsTitleCrumb } from "@/pages/Facility/settings/LegacySettingsTitleCrumb";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/billing/$",
)({
  component: RouteComponent,
  staticData: {
    crumb: ({ pathname }) => <LegacySettingsTitleCrumb pathname={pathname} />,
  },
});

function RouteComponent() {
  return <BillingSettingsLayout />;
}
