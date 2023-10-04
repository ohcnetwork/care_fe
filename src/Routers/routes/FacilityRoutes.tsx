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

export default {
  "/facility": () => <HospitalList />,
  "/facility/create": () => <FacilityCreate />,
  "/facility/:facilityId/update": ({ facilityId }: any) => (
    <FacilityCreate facilityId={facilityId} />
  ),
  "/facility/:facilityId/configure": ({ facilityId }: any) => (
    <FacilityConfigure facilityId={facilityId} />
  ),
  "/facility/:facilityId/cns": ({ facilityId }: any) => (
    <CentralNursingStation facilityId={facilityId} />
  ),
  "/facility/:facilityId": ({ facilityId }: any) => (
    <FacilityHome facilityId={facilityId} />
  ),

  "/facility/:facilityId/users": ({ facilityId }: any) => (
    <FacilityUsers facilityId={facilityId} />
  ),
  "/facility/:facilityId/resource/new": ({ facilityId }: any) => (
    <ResourceCreate facilityId={facilityId} />
  ),

  // Triage related routes
  "/facility/:facilityId/triage": ({ facilityId }: any) => (
    <TriageForm facilityId={facilityId} />
  ),
  "/facility/:facilityId/triage/:id": ({ facilityId, id }: any) => (
    <TriageForm facilityId={facilityId} id={id} />
  ),

  ...FacilityLocationRoutes,
  ...FacilityInventoryRoutes,
};
