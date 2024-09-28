import { AddBedForm } from "../../Components/Facility/AddBedForm";
import { AddInventoryForm } from "../../Components/Facility/AddInventoryForm";
import { AddLocationForm } from "../../Components/Facility/AddLocationForm";
import { BedManagement } from "../../Components/Facility/BedManagement";
import LocationManagement from "../../Components/Facility/LocationManagement";
import CentralLiveMonitoring from "../../Components/CameraFeed/CentralLiveMonitoring";
import { AuthorizeUserRoute } from "../../Utils/AuthorizeFor";
import { CameraFeedPermittedUserTypes } from "../../Utils/permissions";
import CameraPresetsConfigure from "../../Components/CameraFeed/CameraPresetsConfigure";

export default {
  "/facility/:facilityId/location": ({ facilityId }: any) => (
    <LocationManagement facilityId={facilityId} />
  ),
  "/facility/:facilityId/location/:locationId/beds": ({
    facilityId,
    locationId,
  }: any) => <BedManagement facilityId={facilityId} locationId={locationId} />,
  "/facility/:facilityId/inventory/add": ({ facilityId }: any) => (
    <AddInventoryForm facilityId={facilityId} />
  ),
  "/facility/:facilityId/location/add": ({ facilityId }: any) => (
    <AddLocationForm facilityId={facilityId} />
  ),
  "/facility/:facilityId/location/:locationId/update": ({
    facilityId,
    locationId,
  }: any) => (
    <AddLocationForm facilityId={facilityId} locationId={locationId} />
  ),
  "/facility/:facilityId/location/:locationId/beds/add": ({
    facilityId,
    locationId,
  }: any) => <AddBedForm facilityId={facilityId} locationId={locationId} />,
  "/facility/:facilityId/location/:locationId/beds/:bedId/update": ({
    facilityId,
    locationId,
    bedId,
  }: any) => (
    <AddBedForm facilityId={facilityId} locationId={locationId} bedId={bedId} />
  ),
  "/facility/:facilityId/location/:locationId/beds/:bedId/cameras": ({
    locationId,
    bedId,
  }: any) => <CameraPresetsConfigure locationId={locationId} bedId={bedId} />,
  "/facility/:facilityId/live-monitoring": (props: any) => (
    <AuthorizeUserRoute userTypes={CameraFeedPermittedUserTypes}>
      <CentralLiveMonitoring {...props} />
    </AuthorizeUserRoute>
  ),
};
