import CentralNursingStation from "@/components/Facility/CentralNursingStation";
import DischargedPatientsList from "@/components/Facility/DischargedPatientsList";
import { FacilityConfigure } from "@/components/Facility/FacilityConfigure";
import { FacilityCreate } from "@/components/Facility/FacilityCreate";
import { FacilityHome } from "@/components/Facility/FacilityHome";
import { FacilityList } from "@/components/Facility/FacilityList";
import FacilityUsers from "@/components/Facility/FacilityUsers";
import ResourceCreate from "@/components/Resource/ResourceCreate";

import { AppRoutes } from "@/Routers/AppRouter";
import FacilityInventoryRoutes from "@/Routers/routes/FacilityInventoryRoutes";
import FacilityLocationRoutes from "@/Routers/routes/FacilityLocationRoutes";
import FacilityOrganizationIndex from "@/pages/FacilityOrganization/FacilityOrganizationIndex";
import FacilityOrganizationUsers from "@/pages/FacilityOrganization/FacilityOrganizationUsers";
import FacilityOrganizationView from "@/pages/FacilityOrganization/FacilityOrganizationView";

const FacilityRoutes: AppRoutes = {
  "/facility": () => <FacilityList />,
  "/facility/create": () => <FacilityCreate />,
  "/facility/:facilityId/update": ({ facilityId }) => (
    <FacilityCreate facilityId={facilityId} />
  ),
  "/facility/:facilityId/configure": ({ facilityId }) => (
    <FacilityConfigure facilityId={facilityId} />
  ),
  "/facility/:facilityId/cns": ({ facilityId }) => (
    <CentralNursingStation facilityId={facilityId} />
  ),
  "/facility/:facilityId": ({ facilityId }) => (
    <FacilityHome facilityId={facilityId} />
  ),
  "/facility/:id/discharged-patients": ({ id }) => (
    <DischargedPatientsList facility_external_id={id} />
  ),
  "/facility/:facilityId/users": ({ facilityId }) => (
    <FacilityUsers facilityId={facilityId} />
  ),
  "/facility/:facilityId/resource/new": ({ facilityId }) => (
    <ResourceCreate facilityId={facilityId} />
  ),
  "/facility/:facilityId/organisation": ({ facilityId }) => (
    <FacilityOrganizationIndex facilityId={facilityId} />
  ),
  "/facility/:facilityId/organisation/:id": ({ facilityId, id }) => (
    <FacilityOrganizationView facilityId={facilityId} id={id} />
  ),
  "/facility/:facilityId/organisation/:id/users": ({ facilityId, id }) => (
    <FacilityOrganizationUsers facilityId={facilityId} id={id} />
  ),
  ...FacilityLocationRoutes,
  ...FacilityInventoryRoutes,
};

export default FacilityRoutes;
