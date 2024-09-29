import { FacilityConfigure } from "../../Components/Facility/FacilityConfigure";
import { FacilityCreate } from "../../Components/Facility/FacilityCreate";
import { FacilityHome } from "../../Components/Facility/FacilityHome";
import FacilityUsers from "../../Components/Facility/FacilityUsers";
import { HospitalList } from "../../Components/Facility/HospitalList";
import { TriageForm } from "../../Components/Facility/TriageForm";
import ResourceCreate from "../../Components/Resource/ResourceCreate";
import CentralNursingStation from "../../Components/Facility/CentralNursingStation";
import FacilityLocationRoutes from "./FacilityLocationRoutes";
import FacilityInventoryRoutes from "./FacilityInventoryRoutes";
import DischargedPatientsList from "../../Components/Facility/DischargedPatientsList";
import { AppRoutes } from "../AppRouter";

const FacilityRoutes: AppRoutes = {
  "/facility": () => <HospitalList />,
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
