import { AddBedForm } from "../../Components/Facility/AddBedForm";
import { AddInventoryForm } from "../../Components/Facility/AddInventoryForm";
import { AddLocationForm } from "../../Components/Facility/AddLocationForm";
import { BedManagement } from "../../Components/Facility/BedManagement";
import LocationManagement from "../../Components/Facility/LocationManagement";
import CentralLiveMonitoring from "../../Components/CameraFeed/CentralLiveMonitoring";
import { AuthorizeUserRoute } from "../../Utils/AuthorizeFor";
import { CameraFeedPermittedUserTypes } from "../../Utils/permissions";
import { AppRoutes } from "../AppRouter";

const FacilityLocationRoutes: AppRoutes = {
  "/facility/:facilityId/location": ({ facilityId }) => (
    <LocationManagement facilityId={facilityId} />
  ),
  "/facility/:facilityId/location/:locationId/beds": ({
    facilityId,
    locationId,
  }) => <BedManagement facilityId={facilityId} locationId={locationId} />,
  "/facility/:facilityId/inventory/add": ({ facilityId }) => (
    <AddInventoryForm facilityId={facilityId} />
  ),
  "/facility/:facilityId/location/add": ({ facilityId }) => (
    <AddLocationForm facilityId={facilityId} />
  ),
  "/facility/:facilityId/location/:locationId/update": ({
    facilityId,
    locationId,
  }) => <AddLocationForm facilityId={facilityId} locationId={locationId} />,
  "/facility/:facilityId/location/:locationId/beds/add": ({
    facilityId,
    locationId,
  }) => <AddBedForm facilityId={facilityId} locationId={locationId} />,
  "/facility/:facilityId/location/:locationId/beds/:bedId/update": ({
    facilityId,
    locationId,
    bedId,
  }) => (
    <AddBedForm facilityId={facilityId} locationId={locationId} bedId={bedId} />
  ),
  "/facility/:facilityId/live-monitoring": ({ facilityId }) => (
    <AuthorizeUserRoute userTypes={CameraFeedPermittedUserTypes}>
      <CentralLiveMonitoring facilityId={facilityId} />
    </AuthorizeUserRoute>
  ),
};

export default FacilityLocationRoutes;
