import { FacilityConfigure } from "@/components/Facility/FacilityConfigure";
import { FacilityCreate } from "@/components/Facility/FacilityCreate";
import { FacilityHome } from "@/components/Facility/FacilityHome";
import FacilityUsers from "@/components/Facility/FacilityUsers";
import { FacilityList } from "@/components/Facility/FacilityList";
import { TriageForm } from "@/components/Facility/TriageForm";
import ResourceCreate from "@/components/Resource/ResourceCreate";
import CentralNursingStation from "@/components/Facility/CentralNursingStation";
import FacilityLocationRoutes from "./FacilityLocationRoutes";
import FacilityInventoryRoutes from "./FacilityInventoryRoutes";
import DischargedPatientsList from "@/components/Facility/DischargedPatientsList";
import { AppRoutes } from "../AppRouter";

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
  "/facility/:facilityId/triage": ({ facilityId }) => (
    <TriageForm facilityId={facilityId} />
  ),
  "/facility/:facilityId/triage/:id": ({ facilityId, id }) => (
    <TriageForm facilityId={facilityId} id={id} />
  ),
  ...FacilityLocationRoutes,
  ...FacilityInventoryRoutes,
};

export default FacilityRoutes;
