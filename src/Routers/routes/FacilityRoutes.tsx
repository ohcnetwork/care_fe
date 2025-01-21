import { Redirect } from "raviger";

import { FacilityHome } from "@/components/Facility/FacilityHome";
import FacilityUsers from "@/components/Facility/FacilityUsers";
import ResourceCreate from "@/components/Resource/ResourceCreate";

import { AppRoutes } from "@/Routers/AppRouter";
import FacilityOrganizationIndex from "@/pages/FacilityOrganization/FacilityOrganizationIndex";
import FacilityOrganizationUsers from "@/pages/FacilityOrganization/FacilityOrganizationUsers";
import FacilityOrganizationView from "@/pages/FacilityOrganization/FacilityOrganizationView";

const FacilityRoutes: AppRoutes = {
  "/facility": () => <Redirect to="/" />,

  "/facility/:facilityId": ({ facilityId }) => (
    <FacilityHome facilityId={facilityId} />
  ),
  "/facility/:facilityId/users": ({ facilityId }) => (
    <FacilityUsers facilityId={facilityId} />
  ),
  "/facility/:facilityId/resource/new": ({ facilityId }) => (
    <ResourceCreate facilityId={facilityId} />
  ),
  "/facility/:facilityId/organization": ({ facilityId }) => (
    <FacilityOrganizationIndex facilityId={facilityId} />
  ),
  "/facility/:facilityId/organization/:id": ({ facilityId, id }) => (
    <FacilityOrganizationView facilityId={facilityId} id={id} />
  ),
  "/facility/:facilityId/organization/:id/users": ({ facilityId, id }) => (
    <FacilityOrganizationUsers facilityId={facilityId} id={id} />
  ),
};

export default FacilityRoutes;
