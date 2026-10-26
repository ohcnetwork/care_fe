import ReferralAvailabilitySettings from "@/pages/Facility/settings/referrals/ReferralAvailabilitySettings";

import OrganizationLayout, {
  RouteContext,
} from "./components/OrganizationLayout";

interface OrganizationReferralAvailabilityProps {
  id: string;
  navOrganizationId?: string;
  routeContext?: RouteContext;
}

export default function OrganizationReferralAvailability(
  props: OrganizationReferralAvailabilityProps,
) {
  return (
    <OrganizationLayout {...props}>
      {() => (
        <ReferralAvailabilitySettings
          key={props.id}
          organizationId={props.id}
          embedded
        />
      )}
    </OrganizationLayout>
  );
}
