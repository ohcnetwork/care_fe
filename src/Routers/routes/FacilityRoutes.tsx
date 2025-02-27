import { Redirect } from "raviger";

import FacilityUsers from "@/components/Facility/FacilityUsers";
import ResourceCreate from "@/components/Resource/ResourceForm";

import { AppRoutes } from "@/Routers/AppRouter";
import { FacilityOverview } from "@/pages/Facility/overview";
import { SettingsLayout } from "@/pages/Facility/settings/layout";

const FacilityRoutes: AppRoutes = {
  "/facility": () => <Redirect to="/" />,
  "/facility/:facilityId/overview": ({ facilityId }) => (
    <FacilityOverview facilityId={facilityId} />
  ),
  "/facility/:facilityId/users": ({ facilityId }) => (
    <FacilityUsers facilityId={facilityId} />
  ),
  "/facility/:facilityId/resource/new": ({ facilityId }) => (
    <ResourceCreate facilityId={facilityId} />
  ),
  "/facility/:facilityId/settings*": ({ facilityId }) => (
    <SettingsLayout facilityId={facilityId} />
  ),
};

export default FacilityRoutes;
